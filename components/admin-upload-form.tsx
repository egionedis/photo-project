"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { buildCloudinaryContext } from "@/lib/metadata";
import exifr from "exifr";
import { TAGGED_COLLECTIONS } from "@/lib/collections";
import { buildPhotoDetailPath } from "@/lib/urls";
import styles from "../app/admin/admin.module.css";

type SignatureResponse = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
};

type SuccessState = {
  publicId: string;
  href: string;
};

type ExifMetadata = {
  takenAtISO?: string;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
};

const DEFAULT_CAMERA_MODEL = "Nikon D90";

function normalizeSelectedCollectionTags(tags: string[]): string[] {
  return TAGGED_COLLECTIONS.map((collection) => collection.slug).filter((slug) => tags.includes(slug));
}

function toggleCollectionTag(tags: string[], tag: string): string[] {
  if (tags.includes(tag)) {
    return tags.filter((value) => value !== tag);
  }
  return normalizeSelectedCollectionTags([...tags, tag]);
}

function firstNonEmpty(values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function findByCaseInsensitiveKey(source: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!source) {
    return undefined;
  }
  const wanted = keys.map((key) => key.toLowerCase());
  for (const [key, value] of Object.entries(source)) {
    if (!wanted.includes(key.toLowerCase())) {
      continue;
    }
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function deepFindByCaseInsensitiveKey(
  source: unknown,
  keys: string[],
  depth = 0,
  visited?: WeakSet<object>
): string | undefined {
  if (!source || depth > 6) {
    return undefined;
  }

  if (typeof source === "string" && source.trim()) {
    return undefined;
  }

  if (typeof source !== "object") {
    return undefined;
  }

  const seen = visited || new WeakSet<object>();
  const objectSource = source as object;
  if (seen.has(objectSource)) {
    return undefined;
  }
  seen.add(objectSource);

  if (Array.isArray(source)) {
    for (const item of source) {
      const found = deepFindByCaseInsensitiveKey(item, keys, depth + 1, seen);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  const asRecord = source as Record<string, unknown>;
  const direct = findByCaseInsensitiveKey(asRecord, keys);
  if (direct) {
    return direct;
  }

  for (const value of Object.values(asRecord)) {
    const nested = deepFindByCaseInsensitiveKey(value, keys, depth + 1, seen);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTakenAt(value: string | null): string {
  if (!value) {
    return "Not found";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not found";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatShutter(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isNaN(numeric) && numeric > 0) {
    if (numeric >= 1) {
      return `${numeric.toFixed(1).replace(/\.0$/, "")}s`;
    }
    const denominator = Math.round(1 / numeric);
    if (denominator > 0) {
      return `1/${denominator}`;
    }
  }
  return String(value);
}

function formatAperture(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return undefined;
  }
  return `f/${numeric.toFixed(1)}`;
}

function formatFocalLength(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numeric = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
    return undefined;
  }
  return `${numeric.toFixed(2)}mm`;
}

async function parseExifMetadata(file: File): Promise<ExifMetadata> {
  const exifData = (await exifr.parse(
    file,
    {
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "ModifyDate",
        "Make",
        "Model",
        "CameraModelName",
        "UniqueCameraModel",
        "LensModel",
        "Lens",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO"
      ],
      tiff: true,
      ifd0: true,
      exif: true,
      mergeOutput: true
    } as unknown as Parameters<typeof exifr.parse>[1]
  )) as
    | {
        DateTimeOriginal?: Date | string;
        CreateDate?: Date | string;
        ModifyDate?: Date | string;
        Make?: string;
        Model?: string;
        LensModel?: string;
        Lens?: string;
        FocalLength?: number | string;
        FNumber?: number | string;
        ExposureTime?: number | string;
        ISO?: number | string;
      }
    | null;

  const exifAny = exifData as Record<string, unknown> | null;
  let cameraMake = firstNonEmpty([exifData?.Make, exifAny?.make, exifAny?.Manufacturer]);
  let cameraModel = firstNonEmpty([
    exifData?.Model,
    exifAny?.model,
    exifAny?.CameraModelName,
    exifAny?.UniqueCameraModel
  ]);

  // Fallback: parse full EXIF and search keys case-insensitively, including nested IFD/XMP shapes.
  if (!cameraMake || !cameraModel) {
    const fullExif = (await exifr.parse(
      file,
      {
        tiff: true,
        ifd0: true,
        exif: true,
        xmp: true,
        mergeOutput: true
      } as unknown as Parameters<typeof exifr.parse>[1]
    )) as Record<string, unknown> | null;

    if (!cameraMake) {
      cameraMake =
        findByCaseInsensitiveKey(fullExif, ["Make", "Manufacturer", "CameraMake"]) ||
        deepFindByCaseInsensitiveKey(fullExif, ["Make", "Manufacturer", "CameraMake"]);
    }
    if (!cameraModel) {
      cameraModel =
        findByCaseInsensitiveKey(fullExif, ["Model", "CameraModelName", "UniqueCameraModel", "CameraModel"]) ||
        deepFindByCaseInsensitiveKey(fullExif, [
          "Model",
          "CameraModelName",
          "UniqueCameraModel",
          "CameraModel"
        ]);
    }
  }

  const candidates = [exifData?.DateTimeOriginal, exifData?.CreateDate, exifData?.ModifyDate];
  let takenAtISO: string | undefined;
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const parsed = candidate instanceof Date ? candidate : new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      takenAtISO = parsed.toISOString();
      break;
    }
  }

  const focalLength = formatFocalLength(exifData?.FocalLength);
  const aperture = formatAperture(exifData?.FNumber);

  return {
    takenAtISO,
    cameraMake,
    cameraModel,
    lensModel: exifData?.LensModel?.trim() || exifData?.Lens?.trim() || undefined,
    focalLength,
    aperture,
    shutter: formatShutter(exifData?.ExposureTime),
    iso: exifData?.ISO !== undefined && exifData.ISO !== null ? String(exifData.ISO) : undefined
  };
}

export function AdminUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [takenAtISO, setTakenAtISO] = useState<string | null>(null);
  const [cameraExif, setCameraExif] = useState<Omit<ExifMetadata, "takenAtISO">>({
    cameraModel: DEFAULT_CAMERA_MODEL
  });
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isParsingExif, setIsParsingExif] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFileSelection(nextFile: File | null) {
    setFile(nextFile);
    setSuccess(null);
    setError("");

    if (!nextFile) {
      setTakenAtISO(null);
      setCameraExif({
        cameraModel: DEFAULT_CAMERA_MODEL
      });
      return;
    }

    setIsParsingExif(true);
    try {
      const parsed = await parseExifMetadata(nextFile);
      setTakenAtISO(parsed.takenAtISO || null);
      setCameraExif({
        cameraModel: parsed.cameraModel || DEFAULT_CAMERA_MODEL,
        lensModel: parsed.lensModel,
        focalLength: parsed.focalLength,
        aperture: parsed.aperture,
        shutter: parsed.shutter,
        iso: parsed.iso
      });
    } catch {
      setTakenAtISO(null);
      setCameraExif({
        cameraModel: DEFAULT_CAMERA_MODEL
      });
    } finally {
      setIsParsingExif(false);
    }
  }

  function resetAll() {
    setFile(null);
    setTitle("");
    setDescription("");
    setSelectedTags([]);
    setTakenAtISO(null);
    setCameraExif({
      cameraModel: DEFAULT_CAMERA_MODEL
    });
    setError("");
    setSuccess(null);
    setIsUploading(false);
    setIsParsingExif(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose an image to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setIsUploading(true);
    setError("");
    setSuccess(null);

    const context = buildCloudinaryContext({
      title: title.trim(),
      description: description.trim(),
      title_en: title.trim(),
      description_en: description.trim(),
      taken_at: takenAtISO || undefined,
      camera_model: cameraExif.cameraModel,
      lens_model: cameraExif.lensModel,
      focal_length: cameraExif.focalLength,
      aperture: cameraExif.aperture,
      shutter: cameraExif.shutter,
      iso: cameraExif.iso
    });
    const normalizedTags = normalizeSelectedCollectionTags(selectedTags);

    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          tags: normalizedTags.length ? normalizedTags.join(",") : undefined
        })
      });

      if (!signResponse.ok) {
        let message = `Signature request failed (${signResponse.status}).`;
        try {
          const payload = (await signResponse.json()) as { error?: string };
          if (payload?.error) {
            message = payload.error;
          }
        } catch {
          // ignore json parse errors and use fallback message
        }
        throw new Error(message);
      }

      const signData = (await signResponse.json()) as SignatureResponse;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", String(signData.timestamp));
      formData.append("signature", signData.signature);
      formData.append("folder", signData.folder);
      formData.append("context", context);
      if (normalizedTags.length) {
        formData.append("tags", normalizedTags.join(","));
      }

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!uploadResponse.ok) {
        let message = `Cloudinary upload failed (${uploadResponse.status}).`;
        try {
          const payload = (await uploadResponse.json()) as { error?: { message?: string } | string };
          if (typeof payload?.error === "string") {
            message = payload.error;
          } else if (payload?.error && typeof payload.error.message === "string") {
            message = payload.error.message;
          }
        } catch {
          // ignore json parse errors and use fallback message
        }
        throw new Error(message);
      }

      const uploaded = (await uploadResponse.json()) as { public_id: string };
      const completeResponse = await fetch("/api/cloudinary/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: uploaded.public_id })
      });
      if (!completeResponse.ok) {
        console.error("Upload succeeded but snapshot refresh failed.", completeResponse.status);
      }

      setSuccess({
        publicId: uploaded.public_id,
        href: buildPhotoDetailPath(uploaded.public_id)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed. Verify session and Cloudinary credentials.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  if (success) {
    return (
      <section>
        <div className={styles.successBanner}>
          <p style={{ margin: 0 }}>Uploaded.</p>
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            <Link className={styles.button} href={success.href}>
              View photo
            </Link>
            <button className={styles.button} type="button" onClick={resetAll}>
              Upload another
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleUpload}>
      <section className={styles.uploadGrid}>
        <div className={styles.uploadLeft}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
          />

          <button
            className={styles.dropzone}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFileSelection(event.dataTransfer.files?.[0] ?? null);
            }}
          >
            <p className={styles.dropzoneText}>
              {file ? "Replace file" : "Drop image here or click to select"}
            </p>
          </button>

          {file && previewUrl ? (
            <div className={styles.previewBlock}>
              <Image
                src={previewUrl}
                alt="Selected preview"
                className={styles.previewImage}
                width={500}
                height={500}
                unoptimized
              />
              <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--muted)" }}>
                {file.name} ({formatBytes(file.size)})
              </p>
            </div>
          ) : null}

          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
            Date taken: {isParsingExif ? "Reading EXIF..." : formatTakenAt(takenAtISO)}
          </p>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
            Camera model:{" "}
            {isParsingExif ? "Reading EXIF..." : cameraExif.cameraModel || "Not found"}
          </p>
        </div>

        <div className={styles.uploadRight}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="photo-title">
              Title
            </label>
            <input
              id="photo-title"
              className={styles.input}
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="photo-description">
              Description
            </label>
            <textarea
              id="photo-description"
              className={styles.textarea}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Collections</label>
            <div className={styles.tagGrid}>
              {TAGGED_COLLECTIONS.map((collection) => (
                <label key={collection.slug} className={styles.tagOption}>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(collection.slug)}
                    onChange={() => setSelectedTags((prev) => toggleCollectionTag(prev, collection.slug))}
                  />
                  <span>{collection.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Camera metadata (editable)</label>
            <div className={styles.fieldGroup}>
              <input
                className={styles.input}
                type="text"
                placeholder="Camera model"
                value={cameraExif.cameraModel || ""}
                onChange={(event) =>
                  setCameraExif((prev) => ({
                    ...prev,
                    cameraModel: event.target.value
                  }))
                }
              />
            </div>
          </div>

          {error ? <p style={{ color: "oklch(45% 0.15 25)", margin: 0, fontSize: "0.95rem" }}>{error}</p> : null}

          <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={isUploading || isParsingExif}>
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </section>
    </form>
  );
}
