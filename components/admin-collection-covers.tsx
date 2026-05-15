"use client";

import { useState } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/types";
import type { CollectionDefinition } from "@/lib/collections";
import { getPhotoTitle } from "@/lib/photo-text";
import styles from "../app/admin/admin.module.css";

type CollectionWithPhotos = CollectionDefinition & {
  photos: Photo[];
  currentCoverId: string | null;
};

type Props = {
  collections: CollectionWithPhotos[];
  allPhotos: Photo[];
};

export function AdminCollectionCovers({ collections, allPhotos }: Props) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    collections[0]?.slug || null
  );
  const [localCovers, setLocalCovers] = useState<Record<string, string | null>>(
    Object.fromEntries(collections.map(c => [c.slug, c.currentCoverId ?? null]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeCollection = collections.find(c => c.slug === selectedCollection);
  const currentCoverId = selectedCollection ? (localCovers[selectedCollection] ?? null) : null;

  async function handleSelectCover(photoId: string) {
    if (!selectedCollection) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/collections/set-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedCollection,
          coverPhotoId: photoId
        })
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      // Update local state
      setLocalCovers(prev => ({ ...prev, [selectedCollection]: photoId }));
      setSuccess(`Cover photo updated for ${activeCollection?.name}`);
    } catch {
      setError("Could not update cover photo.");
    } finally {
      setSaving(false);
    }
  }

  if (!activeCollection) {
    return <p>No collections found.</p>;
  }

  return (
    <section style={{ display: "grid", gap: "2rem" }}>
      {/* Collection tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {collections.map(collection => (
          <button
            key={collection.slug}
            className={`${styles.button} ${selectedCollection === collection.slug ? styles.buttonPrimary : ""}`}
            type="button"
            onClick={() => setSelectedCollection(collection.slug)}
          >
            {collection.name} ({collection.photos.length})
          </button>
        ))}
      </div>

      {/* Status messages */}
      {success && (
        <p style={{ color: "oklch(35% 0.05 140)", margin: 0 }}>{success}</p>
      )}
      {error && (
        <p style={{ color: "oklch(45% 0.15 25)", margin: 0 }}>{error}</p>
      )}

      {/* Current cover preview */}
      {currentCoverId && (
        <div>
          <p style={{ margin: "0 0 0.75rem", color: "var(--muted)", fontSize: "0.95rem" }}>
            Current cover:
          </p>
          {(() => {
            const coverPhoto = allPhotos.find(
              p => p.publicId === currentCoverId
            );
            return coverPhoto ? (
              <div
                style={{
                  width: "200px",
                  aspectRatio: "1",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "2px solid var(--accent)"
                }}
              >
                <Image
                  src={coverPhoto.secureUrl}
                  alt={getPhotoTitle(coverPhoto)}
                  width={400}
                  height={400}
                  unoptimized
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Photo grid for selection */}
      <div>
        <p style={{ margin: "0 0 1rem", color: "var(--muted)", fontSize: "0.95rem" }}>
          Select cover photo for {activeCollection.name}:
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "1rem"
          }}
        >
          {activeCollection.photos.map(photo => {
            const isCurrent = photo.publicId === currentCoverId;
            return (
              <button
                key={photo.publicId}
                type="button"
                onClick={() => handleSelectCover(photo.publicId)}
                disabled={saving}
                style={{
                  all: "unset",
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "block",
                  aspectRatio: "1",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: isCurrent
                    ? "3px solid oklch(60% 0.12 145)"
                    : "1px solid var(--line)",
                  opacity: saving ? 0.5 : 1,
                  transition: "all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                  boxShadow: isCurrent ? "0 0 0 1px oklch(60% 0.12 145)" : "none"
                }}
              >
                <Image
                  src={photo.secureUrl}
                  alt={getPhotoTitle(photo)}
                  width={280}
                  height={280}
                  unoptimized
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
