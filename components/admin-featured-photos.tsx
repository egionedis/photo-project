"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Photo } from "@/lib/types";
import { getPhotoTitle } from "@/lib/photo-text";
import { formatPhotoDate, getPhotoDisplayDateValue } from "@/lib/photo-date";
import styles from "../app/admin/admin.module.css";

type AdminFeaturedPhotosProps = {
  photos: Photo[];
};

type FeaturedTileProps = {
  photo: Photo;
  isRemoving: boolean;
  onRemove: (photo: Photo) => void;
};

function FeaturedTile({ photo, isRemoving, onRemove }: FeaturedTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.publicId
  });
  const photoTitle = getPhotoTitle(photo);

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: "grid",
        gap: "1rem",
        padding: "1rem",
        border: "1px solid var(--line)",
        borderRadius: "10px",
        background: "#ffffff",
        boxShadow: isDragging ? "0 6px 20px oklch(0% 0 0 / 0.12)" : undefined
      }}
    >
      <Link
        href={`/admin/edit?photo=${encodeURIComponent(photo.publicId)}`}
        style={{ display: "block", textDecoration: "none" }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            borderRadius: "8px",
            overflow: "hidden",
            background: "oklch(97% 0 0)",
            marginBottom: "0.75rem"
          }}
        >
          <Image
            src={photo.secureUrl}
            alt={photoTitle}
            width={560}
            height={420}
            unoptimized
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 400, color: "var(--text)" }}>
          {photoTitle}
        </h3>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
          {formatPhotoDate(getPhotoDisplayDateValue(photo), "en-US", "Unknown")}
        </p>
      </Link>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <button
          className={styles.button}
          type="button"
          {...attributes}
          {...listeners}
          style={{ cursor: "grab", padding: "0.75rem 1rem" }}
        >
          Drag
        </button>
        <button
          className={styles.button}
          type="button"
          onClick={() => onRemove(photo)}
          disabled={isRemoving}
          style={{ borderColor: "oklch(85% 0.03 25)", color: "oklch(40% 0.08 25)", padding: "0.75rem 1rem" }}
        >
          {isRemoving ? "Removing..." : "Remove from Featured"}
        </button>
      </div>
    </article>
  );
}

export function AdminFeaturedPhotos({ photos }: AdminFeaturedPhotosProps) {
  const [items, setItems] = useState<Photo[]>(photos);
  const [baselineIds, setBaselineIds] = useState<string[]>(photos.map((photo) => photo.publicId));
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const ids = useMemo(() => items.map((item) => item.publicId), [items]);
  const hasUnsavedChanges = useMemo(() => {
    if (ids.length !== baselineIds.length) {
      return true;
    }
    for (let index = 0; index < ids.length; index += 1) {
      if (ids[index] !== baselineIds[index]) {
        return true;
      }
    }
    return false;
  }, [ids, baselineIds]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${url.pathname}${url.search}`;
      if (url.origin === window.location.origin && next !== current) {
        const proceed = window.confirm("You have unsaved changes. Leave this page?");
        if (!proceed) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasUnsavedChanges]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.publicId === active.id);
      const newIndex = prev.findIndex((item) => item.publicId === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
    setError("");
    setSuccess("");
  }

  async function saveOrdering() {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = items.map((photo, index) => ({
        publicId: photo.publicId,
        featuredOrder: (index + 1) * 1000
      }));

      const response = await fetch("/api/cloudinary/batch-update-featured-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload })
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      const updated = items.map((photo, index) => ({
        ...photo,
        featuredOrder: (index + 1) * 1000
      }));
      setItems(updated);
      setBaselineIds(updated.map((item) => item.publicId));
      setSuccess("Featured order saved.");
    } catch {
      setError("Could not save featured order.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveFeatured(photo: Photo) {
    setRemovingId(photo.publicId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/cloudinary/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: photo.publicId,
          title: photo.title || "",
          description: photo.description || "",
          titleEn: photo.titleEn || "",
          descriptionEn: photo.descriptionEn || "",
          tags: photo.tags.join(","),
          featured: false,
          featuredOrder: null,
          takenAt: photo.takenAt || "",
          cameraModel: photo.camera?.model || "",
          lensModel: photo.camera?.lens || "",
          focalLength: photo.camera?.focalLength || "",
          aperture: photo.camera?.aperture || "",
          shutter: photo.camera?.shutter || "",
          iso: photo.camera?.iso || ""
        })
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      const nextItems = items.filter((item) => item.publicId !== photo.publicId);
      setItems(nextItems);
      setBaselineIds(nextItems.map((item) => item.publicId));
      setSuccess(`Removed "${getPhotoTitle(photo)}" from featured.`);
    } catch {
      setError("Could not remove featured status.");
    } finally {
      setRemovingId(null);
    }
  }

  if (!items.length) {
    return (
      <section>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          No featured photos yet. Mark photos as featured in Edit Photos to display them on the homepage.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className={styles.orderTopbar}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
          {items.length} {items.length === 1 ? "photo" : "photos"} featured on homepage
        </p>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            type="button"
            onClick={saveOrdering}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? "Saving..." : "Save Order"}
          </button>
          {hasUnsavedChanges ? <span className={styles.unsavedBanner}>Unsaved changes</span> : null}
        </div>
      </div>

      {success ? <p style={{ color: "oklch(35% 0.05 140)", margin: "0 0 1.5rem", fontSize: "0.95rem" }}>{success}</p> : null}
      {error ? <p style={{ color: "oklch(45% 0.15 25)", margin: "0 0 1.5rem", fontSize: "0.95rem" }}>{error}</p> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {items.map((photo) => (
              <FeaturedTile
                key={photo.publicId}
                photo={photo}
                isRemoving={removingId === photo.publicId}
                onRemove={handleRemoveFeatured}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
