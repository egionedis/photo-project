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
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);

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
    setSelectedIds(new Set(filteredPhotos.map(p => p.publicId)));
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

  function handleApplyClick() {
    if (mode === "replace") {
      setShowConfirmReplace(true);
    } else {
      handleApply();
    }
  }

  async function handleApply() {
    if (selectedIds.size === 0 || selectedTags.size === 0) return;

    setSaving(true);
    setError("");
    setSuccess("");
    setShowMobileSheet(false);
    setShowConfirmReplace(false);

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
      setSuccess(`Updated ${data.updated} photo${data.updated !== 1 ? "s" : ""}. Refresh page to see changes.`);
    } catch (err) {
      const errorMessage = err instanceof Error && err.message
        ? err.message
        : "Network error. Check your connection and try again.";
      setError(errorMessage);
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
        <div className={styles.filterSection}>
          <p className={styles.filterLabel}>Show photos tagged with:</p>
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
        </div>
        <span className={styles.photoCount} data-selection={`${selectedIds.size} selected`}>
          {filteredPhotos.length} of {photos.length} photos
        </span>
      </div>

      {/* Action Bar - Desktop */}
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
            onClick={handleApplyClick}
            disabled={!canApply}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {saving ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Mobile Trigger */}
      <div className={styles.mobileTrigger}>
        <button
          type="button"
          onClick={selectAll}
          disabled={filteredPhotos.length === 0}
          className={styles.button}
        >
          Select All
        </button>
        <button
          type="button"
          onClick={deselectAll}
          disabled={selectedIds.size === 0}
          className={styles.button}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setShowMobileSheet(true)}
          disabled={selectedIds.size === 0}
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Tag {selectedIds.size} photo{selectedIds.size !== 1 ? "s" : ""}
        </button>
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
                onClick={handleApplyClick}
                disabled={selectedTags.size === 0 || saving}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {saving ? "Applying..." : `Apply to ${selectedIds.size} photo${selectedIds.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Replace Dialog */}
      {showConfirmReplace && (
        <div className={styles.confirmDialog}>
          <div className={styles.dialogBackdrop} onClick={() => setShowConfirmReplace(false)} />
          <div className={styles.dialogContent}>
            <h2 className={styles.dialogTitle}>Replace all collection tags?</h2>
            <p className={styles.dialogMessage}>
              This will remove all existing collection tags from {selectedIds.size} photo{selectedIds.size !== 1 ? "s" : ""} and replace them with the tags you selected. You cannot undo this action.
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                onClick={() => setShowConfirmReplace(false)}
                className={styles.button}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className={`${styles.button} ${styles.buttonDanger}`}
              >
                Replace Tags
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status messages */}
      {success && (
        <div className={styles.statusMessage} data-type="success">
          {success}
        </div>
      )}
      {error && (
        <div className={styles.statusMessage} data-type="error">
          {error}
        </div>
      )}

      {/* Photo grid */}
      {filteredPhotos.length === 0 && filterTags.size > 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No photos with selected tags</p>
          <p className={styles.emptyHint}>Clear filters to see all photos</p>
        </div>
      ) : (
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
                onChange={() => togglePhoto(photo.publicId)}
                className={styles.checkbox}
                aria-label={`Select ${getPhotoTitle(photo)}`}
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
      )}
    </div>
  );
}
