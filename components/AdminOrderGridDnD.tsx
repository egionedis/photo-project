"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import styles from "../app/admin/admin.module.css";
import { formatPhotoDate, getPhotoDisplayDateValue } from "@/lib/photo-date";

const PAGE_SIZE = 100;

type FeedResponse = {
  items: Photo[];
  total: number;
  nextOffset: number | null;
};

function getThumb(url: string): string {
  return url.replace("/upload/", "/upload/c_fill,w_420,h_300,q_auto,f_auto/");
}

function sortChronologicalDesc(photos: Photo[]): Photo[] {
  return [...photos].sort((a, b) => {
    const aDate = new Date(getPhotoDisplayDateValue(a) || a.uploadedAt || a.createdAt || 0).getTime();
    const bDate = new Date(getPhotoDisplayDateValue(b) || b.uploadedAt || b.createdAt || 0).getTime();
    return bDate - aDate;
  });
}

type TileProps = {
  photo: Photo;
};

function SortableTile({ photo }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.publicId
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      className={`${styles.orderTile} ${isDragging ? styles.active : ""}`}
    >
      <Image
        src={getThumb(photo.secureUrl)}
        alt={photo.title || "Untitled"}
        width={420}
        height={300}
        unoptimized
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div className={styles.orderMeta}>
        <button type="button" {...attributes} {...listeners} aria-label="Drag to reorder" style={{ all: "unset", cursor: "grab", marginRight: "0.5rem" }}>
          ⋮⋮
        </button>
        <span>{photo.title || "Untitled"}</span>
      </div>
    </article>
  );
}

export function AdminOrderGridDnD() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<Photo[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [baselineIds, setBaselineIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 220);
    return () => clearTimeout(timer);
  }, [query]);

  async function fetchFeed(offset: number, append: boolean) {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cloudinary/order-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: debouncedQuery,
          offset,
          limit: PAGE_SIZE
        })
      });

      if (!response.ok) {
        throw new Error("Could not load photos");
      }
      const data = (await response.json()) as FeedResponse;
      const nextItems = append ? [...items, ...data.items] : data.items;
      setItems(nextItems);
      setTotal(data.total);
      setNextOffset(data.nextOffset);
      setBaselineIds(nextItems.map((item) => item.publicId));
      if (!append) {
        
      }
      setStatus("");
    } catch {
      setError("Failed to load photos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchFeed(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

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
    setStatus("");
  }

  async function saveOrdering() {
    setIsSaving(true);
    setError("");
    setStatus("");
    try {
      const payload = items.map((photo, index) => ({
        publicId: photo.publicId,
        sortOrder: (index + 1) * 1000
      }));

      const response = await fetch("/api/cloudinary/batch-update-sort-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload })
      });
      if (!response.ok) {
        throw new Error("Failed");
      }
      const updated = items.map((photo, index) => ({
        ...photo,
        sortOrder: (index + 1) * 1000
      }));
      setItems(updated);
      setBaselineIds(updated.map((item) => item.publicId));
      setStatus("Ordering saved.");
    } catch {
      setError("Could not save ordering.");
    } finally {
      setIsSaving(false);
    }
  }

  function applyChronologicalOrder() {
    setItems((prev) => sortChronologicalDesc(prev));
    setStatus("");
    setError("");
  }

  return (
    <section>
      <div className={styles.orderTopbar}>
        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 400 }}>Gallery Order</h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            className={styles.input}
            type="search"
            placeholder="Search photos"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ minWidth: "220px" }}
          />
          <button className={styles.button} type="button" onClick={applyChronologicalOrder} disabled={isLoading || !items.length}>
            Chronological
          </button>
          <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={saveOrdering} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          {hasUnsavedChanges ? <span className={styles.unsavedBanner}>Unsaved changes</span> : null}
        </div>
      </div>

      <p className={styles.orderSummary}>
        Showing {items.length} of {total} photos
      </p>

      {status ? <p style={{ color: "oklch(35% 0.05 140)", margin: 0, fontSize: "0.95rem" }}>{status}</p> : null}
      {error ? <p style={{ color: "oklch(45% 0.15 25)", margin: 0, fontSize: "0.95rem" }}>{error}</p> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className={styles.orderGrid}>
            {items.map((photo) => (
              <SortableTile key={photo.publicId} photo={photo} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {nextOffset !== null ? (
        <button className={styles.button} type="button" onClick={() => fetchFeed(nextOffset, true)} disabled={isLoading}>
          {isLoading ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </section>
  );
}
