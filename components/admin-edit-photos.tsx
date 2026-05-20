"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Photo } from "@/lib/types";
import { formatPhotoDate, getPhotoDisplayDateValue } from "@/lib/photo-date";
import { TAGGED_COLLECTIONS } from "@/lib/collections";
import { getPhotoDescription, getPhotoTitle } from "@/lib/photo-text";
import { buildPhotoDetailPath } from "@/lib/urls";
import styles from "../app/admin/admin.module.css";

type AdminEditPhotosProps = {
  photos: Photo[];
  initialPhotoId?: string;
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
    { label: "Lens", value: camera.lens },
    { label: "Focal length", value: camera.focalLength },
    { label: "Aperture", value: camera.aperture },
    { label: "Shutter", value: camera.shutter },
    { label: "ISO", value: camera.iso }
  ];

  return rows.filter((row): row is { label: string; value: string } => Boolean(row.value));
}

function getSidebarThumbnail(url: string): string {
  return url.replace("/upload/", "/upload/c_fill,w_96,h_72,q_auto,f_auto/");
}

function normalizeSelectedCollectionTags(tags: string[]): string[] {
  return TAGGED_COLLECTIONS.map((collection) => collection.slug).filter((slug) => tags.includes(slug));
}

function toggleCollectionTag(tags: string[], tag: string): string[] {
  if (tags.includes(tag)) {
    return tags.filter((value) => value !== tag);
  }
  return normalizeSelectedCollectionTags([...tags, tag]);
}

export function AdminEditPhotos({ photos, initialPhotoId }: AdminEditPhotosProps) {
  const [items, setItems] = useState<Photo[]>(photos);
  const [query, setQuery] = useState("");
  const initialPhoto = initialPhotoId && photos.find((p) => p.publicId === initialPhotoId);
  const startingPhoto = initialPhoto || photos[0];
  const [selectedPublicId, setSelectedPublicId] = useState(startingPhoto?.publicId || "");
  const [title, setTitle] = useState(getPhotoTitle(startingPhoto || { title: "", titleEn: "" }));
  const [description, setDescription] = useState(getPhotoDescription(startingPhoto || { description: "", descriptionEn: "" }));
  const [selectedTags, setSelectedTags] = useState(normalizeSelectedCollectionTags(startingPhoto?.tags || []));
  const [featured, setFeatured] = useState(startingPhoto?.featured || false);
  const [takenAtInput, setTakenAtInput] = useState(toDateInputValue(startingPhoto?.takenAt));
  const [cameraModel, setCameraModel] = useState(startingPhoto?.camera?.model || "");
  const [lensModel, setLensModel] = useState(startingPhoto?.camera?.lens || "");
  const [focalLength, setFocalLength] = useState(startingPhoto?.camera?.focalLength || "");
  const [aperture, setAperture] = useState(startingPhoto?.camera?.aperture || "");
  const [shutter, setShutter] = useState(startingPhoto?.camera?.shutter || "");
  const [iso, setIso] = useState(startingPhoto?.camera?.iso || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [deleteConfirmFor, setDeleteConfirmFor] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return items;
    }

    return items.filter((photo) => {
      const titleText = getPhotoTitle(photo).toLowerCase();
      const descriptionText = getPhotoDescription(photo).toLowerCase();
      return titleText.includes(term) || descriptionText.includes(term);
    });
  }, [items, query]);

  const selected = useMemo(
    () => items.find((item) => item.publicId === selectedPublicId) || filtered[0] || null,
    [items, selectedPublicId, filtered]
  );
  const selectedCameraRows = selected ? getCameraRows(selected) : [];

  const isDirty = useMemo(() => {
    if (!selected) {
      return false;
    }
    const originalTitle = getPhotoTitle(selected);
    const originalDescription = getPhotoDescription(selected);
    const originalTags = normalizeSelectedCollectionTags(selected.tags);
    const originalFeatured = selected.featured || false;
    const originalTakenAt = toDateInputValue(selected.takenAt);
    const originalCamera = selected.camera || {};

    return (
      title !== originalTitle ||
      description !== originalDescription ||
      JSON.stringify(selectedTags) !== JSON.stringify(originalTags) ||
      featured !== originalFeatured ||
      takenAtInput !== originalTakenAt ||
      cameraModel !== (originalCamera.model || "") ||
      lensModel !== (originalCamera.lens || "") ||
      focalLength !== (originalCamera.focalLength || "") ||
      aperture !== (originalCamera.aperture || "") ||
      shutter !== (originalCamera.shutter || "") ||
      iso !== (originalCamera.iso || "")
    );
  }, [selected, title, description, selectedTags, featured, takenAtInput, cameraModel, lensModel, focalLength, aperture, shutter, iso]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  function selectPhoto(photo: Photo) {
    if (isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Discard them?");
      if (!confirmed) {
        return;
      }
    }
    setSelectedPublicId(photo.publicId);
    setTitle(getPhotoTitle(photo));
    setDescription(getPhotoDescription(photo));
    setSelectedTags(normalizeSelectedCollectionTags(photo.tags));
    setFeatured(photo.featured || false);
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
      const normalizedTags = normalizeSelectedCollectionTags(selectedTags);
      const response = await fetch("/api/cloudinary/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: selected.publicId,
          title: title.trim(),
          description: description.trim(),
          titleEn: title.trim(),
          descriptionEn: description.trim(),
          tags: normalizedTags.join(","),
          featured,
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
        const errorText = await response.text();
        throw new Error(errorText || "Failed");
      }

      setItems((prev) =>
        prev.map((photo) =>
          photo.publicId === selected.publicId
            ? {
                ...photo,
                title: title.trim(),
                description: description.trim(),
                titleEn: title.trim() || undefined,
                descriptionEn: description.trim() || undefined,
                tags: normalizedTags,
                featured,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save changes.";
      setError(message.includes("Network") ? "Network error. Check connection and retry." : message);
    } finally {
      setIsSaving(false);
    }
  }

  function promptDelete() {
    if (!selected) {
      return;
    }
    setDeleteConfirmFor(selected.publicId);
  }

  function cancelDelete() {
    setDeleteConfirmFor(null);
  }

  async function confirmDelete() {
    if (!selected || deleteConfirmFor !== selected.publicId) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSaved("");
    setDeleteConfirmFor(null);

    try {
      const response = await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: selected.publicId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed");
      }

      const remaining = items.filter((photo) => photo.publicId !== selected.publicId);
      setItems(remaining);
      if (remaining.length > 0) {
        const next = remaining[0];
        setSelectedPublicId(next.publicId);
        setTitle(getPhotoTitle(next));
        setDescription(getPhotoDescription(next));
        setSelectedTags(normalizeSelectedCollectionTags(next.tags));
        setFeatured(next.featured || false);
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
        setSelectedTags([]);
        setFeatured(false);
        setTakenAtInput("");
        setCameraModel("");
        setLensModel("");
        setFocalLength("");
        setAperture("");
        setShutter("");
        setIso("");
      }
      setSaved("Deleted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete photo.";
      setError(message.includes("Network") ? "Network error. Check connection and retry." : message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!items.length) {
    return <p>No photos found in your Cloudinary folder yet.</p>;
  }

  return (
    <section className={styles.editShell}>
      <aside className={styles.editSidebar}>
        <input
          className={styles.input}
          type="search"
          placeholder="Search photos"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className={styles.editListHeader}>
          <p className={styles.editListCount}>
            {filtered.length} {filtered.length === 1 ? "photo" : "photos"}
          </p>
        </div>

        <div className={styles.editList}>
          {filtered.map((photo) => {
            const isActive = selected?.publicId === photo.publicId;
            const photoTitle = getPhotoTitle(photo);

            return (
              <button
                key={photo.publicId}
                type="button"
                className={`${styles.editRow} ${isActive ? styles.active : ""}`}
                onClick={() => selectPhoto(photo)}
              >
                <div className={styles.editRowThumb}>
                  <Image
                    src={photo.secureUrl}
                    alt={photoTitle}
                    width={88}
                    height={64}
                    unoptimized
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <div className={styles.editRowMeta}>
                  <h3 className={styles.editRowTitle}>{photoTitle}</h3>
                  <p className={styles.editRowDate}>{formatPhotoDate(getPhotoDisplayDateValue(photo), "en-US", "Unknown")}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {selected ? (
        <form className={styles.editDetail} onSubmit={handleSave}>
          <Image
            src={selected.secureUrl}
            alt={getPhotoTitle(selected)}
            width={1200}
            height={900}
            className={styles.editPreview}
          />

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="edit-title">Title</label>
            <input id="edit-title" className={styles.input} type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              className={styles.textarea}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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

          <label className={styles.tagOption}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
            />
            <span>Show on home page (Featured)</span>
          </label>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="edit-date">Photo date (optional)</label>
            <input id="edit-date" className={styles.input} type="date" value={takenAtInput} onChange={(event) => setTakenAtInput(event.target.value)} />
          </div>

          <div style={{ display: "grid", gap: "2rem" }}>
            <div>
              <p className={styles.metaLabel} style={{ marginBottom: "1rem" }}>Camera and Lens</p>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-camera-model">Camera model</label>
                  <input id="edit-camera-model" className={styles.input} type="text" placeholder="Canon EOS R5" value={cameraModel} onChange={(event) => setCameraModel(event.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-lens-model">Lens</label>
                  <input id="edit-lens-model" className={styles.input} type="text" placeholder="RF 50mm f/1.2" value={lensModel} onChange={(event) => setLensModel(event.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <p className={styles.metaLabel} style={{ marginBottom: "1rem" }}>Exposure Settings</p>
              <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-focal-length">Focal length</label>
                  <input id="edit-focal-length" className={styles.input} type="text" placeholder="50mm" value={focalLength} onChange={(event) => setFocalLength(event.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-aperture">Aperture</label>
                  <input id="edit-aperture" className={styles.input} type="text" placeholder="f/2.8" value={aperture} onChange={(event) => setAperture(event.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-shutter">Shutter speed</label>
                  <input id="edit-shutter" className={styles.input} type="text" placeholder="1/125" value={shutter} onChange={(event) => setShutter(event.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-iso">ISO</label>
                  <input id="edit-iso" className={styles.input} type="text" placeholder="400" value={iso} onChange={(event) => setIso(event.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>
              Photo date: {formatPhotoDate(getPhotoDisplayDateValue(selected), "en-US", "Unknown")}
            </p>
            {selectedCameraRows.map((row) => (
              <p key={row.label} className={styles.metaLabel}>
                {row.label}: {row.value}
              </p>
            ))}
          </div>

          <div className={styles.editActions}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={isSaving || isDeleting}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={promptDelete}
                disabled={isSaving || isDeleting}
                style={{ borderColor: "oklch(85% 0.03 25)", color: "oklch(40% 0.08 25)" }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              {isDirty ? <p className={styles.editFeedback} style={{ color: "oklch(45% 0.08 40)", margin: 0 }}>Unsaved changes</p> : null}
              {saved ? <p className={styles.editFeedback} style={{ color: "oklch(35% 0.05 140)", margin: 0 }}>{saved}</p> : null}
              {error ? <p className={styles.editFeedback} style={{ color: "oklch(45% 0.15 25)", margin: 0 }}>{error}</p> : null}
            </div>
          </div>
        </form>
      ) : null}

      {deleteConfirmFor && selected && deleteConfirmFor === selected.publicId ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "oklch(0% 0 0 / 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem"
          }}
          onClick={cancelDelete}
        >
          <div
            style={{
              background: "var(--card)",
              borderRadius: "10px",
              padding: "2rem",
              maxWidth: "420px",
              width: "100%",
              display: "grid",
              gap: "1.5rem"
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 400 }}>Delete Photo?</h2>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
              Permanently delete <strong style={{ color: "var(--text)" }}>{getPhotoTitle(selected)}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button className={styles.button} type="button" onClick={cancelDelete}>
                Cancel
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={confirmDelete}
                style={{ borderColor: "oklch(85% 0.03 25)", color: "oklch(40% 0.08 25)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
