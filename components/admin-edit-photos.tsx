"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Photo } from "@/lib/types";
import { formatPhotoDate, getPhotoDisplayDateValue } from "@/lib/photo-date";
import { normalizeTagsInput } from "@/lib/tags";

type AdminEditPhotosProps = {
  photos: Photo[];
};

function toDateInputValue(value: string | undefined): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const parsed = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString();
}

function getCameraRows(photo: Photo): Array<{ label: string; value: string }> {
  const camera = photo.camera;
  if (!camera) {
    return [];
  }

  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: "Camera", value: camera.model || undefined },
    { label: "Lente", value: camera.lens },
    { label: "Distancia focal", value: camera.focalLength },
    { label: "Abertura", value: camera.aperture },
    { label: "Velocidade", value: camera.shutter },
    { label: "ISO", value: camera.iso }
  ];

  return rows.filter((row): row is { label: string; value: string } => Boolean(row.value));
}

function toPhotoHref(publicId: string): string {
  return `/photo/${publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

function getSidebarThumbnail(url: string): string {
  return url.replace("/upload/", "/upload/c_fill,w_96,h_72,q_auto,f_auto/");
}

export function AdminEditPhotos({ photos }: AdminEditPhotosProps) {
  const [items, setItems] = useState<Photo[]>(photos);
  const [query, setQuery] = useState("");
  const [selectedPublicId, setSelectedPublicId] = useState(photos[0]?.publicId || "");
  const [title, setTitle] = useState(photos[0]?.title || "");
  const [description, setDescription] = useState(photos[0]?.description || "");
  const [titleEn, setTitleEn] = useState(photos[0]?.titleEn || "");
  const [descriptionEn, setDescriptionEn] = useState(photos[0]?.descriptionEn || "");
  const [tagsInput, setTagsInput] = useState((photos[0]?.tags || []).join(", "));
  const [takenAtInput, setTakenAtInput] = useState(toDateInputValue(photos[0]?.takenAt));
  const [cameraModel, setCameraModel] = useState(photos[0]?.camera?.model || "");
  const [lensModel, setLensModel] = useState(photos[0]?.camera?.lens || "");
  const [focalLength, setFocalLength] = useState(photos[0]?.camera?.focalLength || "");
  const [aperture, setAperture] = useState(photos[0]?.camera?.aperture || "");
  const [shutter, setShutter] = useState(photos[0]?.camera?.shutter || "");
  const [iso, setIso] = useState(photos[0]?.camera?.iso || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = !term
      ? items
        : items.filter((photo) => {
          const titleText = photo.title.toLowerCase();
          const descriptionText = photo.description.toLowerCase();
          const titleEnText = (photo.titleEn || "").toLowerCase();
          const descriptionEnText = (photo.descriptionEn || "").toLowerCase();
          return (
            titleText.includes(term) ||
            descriptionText.includes(term) ||
            titleEnText.includes(term) ||
            descriptionEnText.includes(term)
          );
        });

    return base;
  }, [items, query]);

  const selected = useMemo(
    () => items.find((item) => item.publicId === selectedPublicId) || filtered[0] || null,
    [items, selectedPublicId, filtered]
  );
  const selectedCameraRows = selected ? getCameraRows(selected) : [];

  function selectPhoto(photo: Photo) {
    setSelectedPublicId(photo.publicId);
    setTitle(photo.title);
    setDescription(photo.description);
    setTitleEn(photo.titleEn || "");
    setDescriptionEn(photo.descriptionEn || "");
    setTagsInput(photo.tags.join(", "));
    setTakenAtInput(toDateInputValue(photo.takenAt));
    setCameraModel(photo.camera?.model || "");
    setLensModel(photo.camera?.lens || "");
    setFocalLength(photo.camera?.focalLength || "");
    setAperture(photo.camera?.aperture || "");
    setShutter(photo.camera?.shutter || "");
    setIso(photo.camera?.iso || "");
    setSaved("");
    setError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setIsSaving(true);
    setError("");
    setSaved("");

    try {
      const normalizedTakenAt = fromDateInputValue(takenAtInput);
      const response = await fetch("/api/cloudinary/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: selected.publicId,
          title: title.trim(),
          description: description.trim(),
          titleEn,
          descriptionEn,
          tags: normalizeTagsInput(tagsInput).join(","),
          takenAt: takenAtInput,
          cameraModel,
          lensModel,
          focalLength,
          aperture,
          shutter,
          iso
        })
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      setItems((prev) =>
        prev.map((photo) =>
          photo.publicId === selected.publicId
            ? {
                ...photo,
                title: title.trim(),
                description: description.trim(),
                titleEn: titleEn.trim() || undefined,
                descriptionEn: descriptionEn.trim() || undefined,
                tags: normalizeTagsInput(tagsInput),
                takenAt: normalizedTakenAt || undefined,
                camera: {
                  model: cameraModel.trim() || undefined,
                  lens: lensModel.trim() || undefined,
                  focalLength: focalLength.trim() || undefined,
                  aperture: aperture.trim() || undefined,
                  shutter: shutter.trim() || undefined,
                  iso: iso.trim() || undefined
                }
              }
            : photo
        )
      );
      setSaved("Saved.");
    } catch {
      setError("Could not save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) {
      return;
    }
    const confirmed = window.confirm("Delete this photo permanently?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSaved("");

    try {
      const response = await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: selected.publicId })
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      const remaining = items.filter((photo) => photo.publicId !== selected.publicId);
      setItems(remaining);
      if (remaining.length > 0) {
        const next = remaining[0];
        setSelectedPublicId(next.publicId);
        setTitle(next.title);
        setDescription(next.description);
        setTitleEn(next.titleEn || "");
        setDescriptionEn(next.descriptionEn || "");
        setTagsInput(next.tags.join(", "));
        setTakenAtInput(toDateInputValue(next.takenAt));
        setCameraModel(next.camera?.model || "");
        setLensModel(next.camera?.lens || "");
        setFocalLength(next.camera?.focalLength || "");
        setAperture(next.camera?.aperture || "");
        setShutter(next.camera?.shutter || "");
        setIso(next.camera?.iso || "");
      } else {
        setSelectedPublicId("");
        setTitle("");
        setDescription("");
        setTitleEn("");
        setDescriptionEn("");
        setTagsInput("");
        setTakenAtInput("");
        setCameraModel("");
        setLensModel("");
        setFocalLength("");
        setAperture("");
        setShutter("");
        setIso("");
      }
      setSaved("Deleted.");
    } catch {
      setError("Could not delete photo.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!items.length) {
    return <p>No photos found in your Cloudinary folder yet.</p>;
  }

  return (
    <section className="admin-edit-shell">
      <aside className="admin-edit-sidebar card">
        <input
          className="input"
          type="search"
          placeholder="Search photos"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="admin-edit-list">
          {filtered.map((photo) => {
            const isActive = selected?.publicId === photo.publicId;
            return (
              <button
                key={photo.publicId}
                type="button"
                className={`admin-edit-row${isActive ? " is-active" : ""}`}
                onClick={() => selectPhoto(photo)}
              >
                <Image
                  src={getSidebarThumbnail(photo.secureUrl)}
                  alt={photo.title || "Untitled"}
                  width={96}
                  height={72}
                  unoptimized
                />
                <span>
                  <strong>{photo.title || "Untitled"}</strong>
                  <small>{formatPhotoDate(getPhotoDisplayDateValue(photo), "pt-PT", "Desconhecido")}</small>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {selected ? (
        <form className="admin-edit-detail card" onSubmit={handleSave}>
          <div className="admin-edit-preview">
            <Image
              src={selected.secureUrl}
              alt={selected.title || "Untitled"}
              width={1200}
              height={900}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>

          <label className="stack" style={{ gap: "0.35rem" }}>
            Titulo em portugues
            <input className="input" type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="stack" style={{ gap: "0.35rem" }}>
            Texto em portugues
            <textarea
              className="textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label className="stack" style={{ gap: "0.35rem" }}>
            Title in English (optional)
            <input className="input" type="text" value={titleEn} onChange={(event) => setTitleEn(event.target.value)} />
          </label>

          <label className="stack" style={{ gap: "0.35rem" }}>
            Text in English (optional)
            <textarea
              className="textarea"
              value={descriptionEn}
              onChange={(event) => setDescriptionEn(event.target.value)}
            />
          </label>

          <label className="stack" style={{ gap: "0.35rem" }}>
            Tags (optional, comma separated)
            <input
              className="input"
              type="text"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
            />
          </label>

          <label className="stack" style={{ gap: "0.35rem" }}>
            Data da foto (opcional)
            <input className="input" type="date" value={takenAtInput} onChange={(event) => setTakenAtInput(event.target.value)} />
          </label>

          <div className="stack" style={{ gap: "0.5rem" }}>
            <strong style={{ fontSize: "0.92rem" }}>Dados da camera (editavel)</strong>
            <input className="input" type="text" placeholder="Modelo da camera" value={cameraModel} onChange={(event) => setCameraModel(event.target.value)} />
            <input className="input" type="text" placeholder="Modelo da lente" value={lensModel} onChange={(event) => setLensModel(event.target.value)} />
            <input className="input" type="text" placeholder="Distancia focal (ex. 35mm)" value={focalLength} onChange={(event) => setFocalLength(event.target.value)} />
            <input className="input" type="text" placeholder="Abertura (ex. f/2.8)" value={aperture} onChange={(event) => setAperture(event.target.value)} />
            <input className="input" type="text" placeholder="Velocidade (ex. 1/125)" value={shutter} onChange={(event) => setShutter(event.target.value)} />
            <input className="input" type="text" placeholder="ISO" value={iso} onChange={(event) => setIso(event.target.value)} />
          </div>

          <div className="admin-meta-block">
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Data da foto: {formatPhotoDate(getPhotoDisplayDateValue(selected), "pt-PT", "Desconhecido")}
            </p>
            {selectedCameraRows.map((row) => (
              <p key={row.label} style={{ margin: 0, color: "var(--muted)" }}>
                {row.label}: {row.value}
              </p>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", alignItems: "center" }}>
            <button className="button" type="submit" disabled={isSaving || isDeleting}>
              {isSaving ? "Saving..." : "Save"}
            </button>
            <Link className="button secondary" href={toPhotoHref(selected.publicId)}>
              View
            </Link>
            <button
              className="button secondary"
              type="button"
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              style={{ borderColor: "#d9b4b4", color: "#7a2222" }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            {saved ? <span style={{ color: "#2f6944" }}>{saved}</span> : null}
            {error ? <span style={{ color: "#b62525" }}>{error}</span> : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
