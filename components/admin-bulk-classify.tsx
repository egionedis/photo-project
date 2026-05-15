"use client";

import { useState } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/types";
import { TAGGED_COLLECTIONS } from "@/lib/collections";
import { getPhotoTitle } from "@/lib/photo-text";
import styles from "./admin-bulk-classify.module.css";

type Props = {
  photos: Photo[];
};

export function AdminBulkClassify({ photos }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [filterTags, setFilterTags] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  function togglePhoto(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(photos.map(p => p.publicId)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function toggleFilterTag(tag: string) {
    setFilterTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  async function handleApply() {
    if (selectedIds.size === 0 || selectedTags.size === 0) return;

    setSaving(true);
    setError("");
    setSuccess("");
    setShowMobileSheet(false);

    try {
      const response = await fetch("/api/cloudinary/bulk-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: Array.from(selectedIds),
          tags: Array.from(selectedTags),
          mode
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update photos");
      }

      const data = await response.json();
      setSuccess(`Updated ${data.updated} photos`);

      // Reload page to show updated tags
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      setError("Could not update photos. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const canApply = selectedIds.size > 0 && selectedTags.size > 0 && !saving;

  // Filter photos by selected filter tags
  const filteredPhotos = filterTags.size > 0
    ? photos.filter(photo =>
        photo.tags && photo.tags.some(tag => filterTags.has(tag))
      )
    : photos;

  return (
    <div className={styles.container}>
      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterButtons}>
          {TAGGED_COLLECTIONS.map(collection => (
            <button
              key={collection.slug}
              type="button"
              onClick={() => toggleFilterTag(collection.slug)}
              className={`${styles.filterButton} ${filterTags.has(collection.slug) ? styles.filterButtonActive : ""}`}
            >
              {collection.name}
            </button>
          ))}
        </div>
        <span className={styles.photoCount} data-selection={`${selectedIds.size} selected`}>
          {filteredPhotos.length} of {photos.length} photos
        </span>
      </div>

      {/* Action Bar */}
      <div className={styles.actionBar}>
        <div className={styles.selectionGroup}>
          <div className={styles.selectionButtons}>
            <button
              type="button"
              onClick={selectAll}
              className={styles.button}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className={styles.button}
            >
              Clear
            </button>
          </div>
          <span className={styles.selectedCount}>
            {selectedIds.size} photo{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
        </div>

        <div className={styles.tagGroup}>
          {TAGGED_COLLECTIONS.map(collection => (
            <label key={collection.slug} className={styles.tagLabel}>
              <input
                type="checkbox"
                checked={selectedTags.has(collection.slug)}
                onChange={() => toggleTag(collection.slug)}
              />
              <span>{collection.name}</span>
            </label>
          ))}
        </div>

        <div className={styles.applyGroup}>
          <div className={styles.modeControls}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="mode"
                checked={mode === "add"}
                onChange={() => setMode("add")}
              />
              <span>Add</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              <span>Replace</span>
            </label>
          </div>
          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {saving ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Mobile Tagging Sheet */}
      {showMobileSheet && (
        <div className={styles.mobileSheet}>
          <div className={styles.sheetBackdrop} onClick={() => setShowMobileSheet(false)} />
          <div className={styles.sheetContent}>
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>Apply Tags</h2>
              <button
                type="button"
                onClick={() => setShowMobileSheet(false)}
                className={styles.sheetClose}
              >
                ✕
              </button>
            </div>

            <div className={styles.sheetBody}>
              <div className={styles.sheetSection}>
                <p className={styles.sheetLabel}>Select Collections</p>
                <div className={styles.sheetTags}>
                  {TAGGED_COLLECTIONS.map(collection => (
                    <label key={collection.slug} className={styles.sheetTagLabel}>
                      <input
                        type="checkbox"
                        checked={selectedTags.has(collection.slug)}
                        onChange={() => toggleTag(collection.slug)}
                      />
                      <span>{collection.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.sheetSection}>
                <p className={styles.sheetLabel}>Mode</p>
                <div className={styles.sheetModes}>
                  <label className={styles.sheetModeLabel}>
                    <input
                      type="radio"
                      name="mobileMode"
                      checked={mode === "add"}
                      onChange={() => setMode("add")}
                    />
                    <span>Add Tags</span>
                  </label>
                  <label className={styles.sheetModeLabel}>
                    <input
                      type="radio"
                      name="mobileMode"
                      checked={mode === "replace"}
                      onChange={() => setMode("replace")}
                    />
                    <span>Replace Tags</span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.sheetFooter}>
              <button
                type="button"
                onClick={handleApply}
                disabled={selectedTags.size === 0 || saving}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {saving ? "Applying..." : `Apply to ${selectedIds.size} photo${selectedIds.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status messages */}
      {success && (
        <p style={{ color: "oklch(35% 0.05 140)", margin: "1rem 0" }}>{success}</p>
      )}
      {error && (
        <p style={{ color: "oklch(45% 0.15 25)", margin: "1rem 0" }}>{error}</p>
      )}

      {/* Photo grid */}
      <div className={styles.photoGrid}>
        {filteredPhotos.map(photo => {
          const isSelected = selectedIds.has(photo.publicId);
          return (
            <div
              key={photo.publicId}
              className={`${styles.photoTile} ${isSelected ? styles.selected : ""}`}
              onClick={() => togglePhoto(photo.publicId)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className={styles.checkbox}
                onClick={(e) => e.stopPropagation()}
              />
              <Image
                src={photo.secureUrl.replace("/upload/", "/upload/w_200,h_200,c_fill,f_auto,q_auto/")}
                alt={getPhotoTitle(photo)}
                width={200}
                height={200}
                unoptimized
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {photo.tags && photo.tags.length > 0 && (
                <div className={styles.tagBadges}>
                  {photo.tags.map(tag => (
                    <span key={tag} className={styles.badge}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
