/**
 * Gallery snapshot cache: Blob read/write, rebuild orchestration, fallback chain.
 *
 * Provides snapshot-backed gallery queries to avoid rate-limiting Cloudinary Search API.
 */

import { get, put } from "@vercel/blob";
import { queryAllPhotosInFolder, isCloudinaryRateLimitError } from "@/lib/cloudinary-client";
import { sortPhotosForGallery } from "@/lib/photo-order";
import { getPhotoDisplayDateValue } from "@/lib/photo-date";
import type { Photo } from "@/lib/types";

const GALLERY_SNAPSHOT_PATH = "gallery/gallery-snapshot.json";

/**
 * Check if Vercel Blob token is configured.
 */
function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Read gallery snapshot from Vercel Blob.
 *
 * Returns null if:
 * - Blob token not configured
 * - Snapshot doesn't exist
 * - Read fails
 * - Snapshot is invalid JSON or not an array
 */
async function readGallerySnapshot(): Promise<Photo[] | null> {
  if (!hasBlobToken()) {
    return null;
  }

  try {
    const result = await get(GALLERY_SNAPSHOT_PATH, { access: "private" });
    if (!result || !result.stream) {
      return null;
    }

    const raw = await new Response(result.stream).text();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed as Photo[];
  } catch (error) {
    console.error("Failed to read gallery snapshot from Blob.", error);
    return null;
  }
}

/**
 * Write gallery snapshot to Vercel Blob.
 *
 * Overwrites existing snapshot with new photo array.
 * No-op if Blob token not configured.
 */
async function writeGallerySnapshot(photos: Photo[]): Promise<void> {
  if (!hasBlobToken()) {
    return;
  }

  try {
    await put(GALLERY_SNAPSHOT_PATH, JSON.stringify(photos), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
  } catch (error) {
    console.error("Failed to write gallery snapshot to Blob.", error);
  }
}

/**
 * Rebuild gallery snapshot from Cloudinary Search API.
 *
 * Queries all photos, sorts for gallery display, writes to Blob.
 * Returns sorted photo array.
 *
 * Called after photo mutations (upload, edit, delete, reorder).
 */
export async function rebuildGallerySnapshot(): Promise<Photo[]> {
  const photos = sortPhotosForGallery(await queryAllPhotosInFolder());
  await writeGallerySnapshot(photos);
  return photos;
}

/**
 * Query gallery photos with fallback chain.
 *
 * Fallback order:
 * 1. Read from Blob snapshot (fast, cached)
 * 2. Rebuild snapshot from Cloudinary (if Blob read fails)
 * 3. Direct Cloudinary query (if rebuild fails)
 *
 * Returns unsorted photo array.
 */
async function queryGalleryPhotos(): Promise<Photo[]> {
  const snapshot = await readGallerySnapshot();
  if (snapshot) {
    return snapshot;
  }

  try {
    const rebuilt = await rebuildGallerySnapshot();
    return rebuilt;
  } catch (error) {
    console.error("Failed to rebuild gallery snapshot, falling back to direct query.", error);
    return sortPhotosForGallery(await queryAllPhotosInFolder());
  }
}

/**
 * Get all gallery photos, sorted for display.
 *
 * Public interface for gallery pages. Uses snapshot cache with fallback chain.
 * Always returns sorted array (by sortOrder, takenAt, createdAt).
 */
export async function getGalleryPhotos(): Promise<Photo[]> {
  const photos = await queryGalleryPhotos();
  return sortPhotosForGallery(photos);
}

/**
 * Search and paginate photos for admin ordering interface.
 *
 * Filters by query string (title/description match), sorts, paginates.
 * Uses snapshot cache when available.
 *
 * Returns paginated slice and total count.
 */
export async function searchPhotosForAdminOrder(options: {
  query: string;
  offset: number;
  limit: number;
}): Promise<{ photos: Photo[]; total: number }> {
  let all: Photo[] = [];
  try {
    const snapshot = await readGallerySnapshot();
    if (snapshot) {
      all = snapshot;
    } else if (hasBlobToken()) {
      all = await rebuildGallerySnapshot();
    } else {
      all = await queryAllPhotosInFolder();
    }
  } catch (error) {
    if (isCloudinaryRateLimitError(error)) {
      console.error("Cloudinary rate limit reached while fetching admin ordering photos.");
    } else {
      throw error;
    }
  }

  const normalizedQuery = options.query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? all.filter((photo) => {
        const title = photo.title.toLowerCase();
        const description = photo.description.toLowerCase();
        return title.includes(normalizedQuery) || description.includes(normalizedQuery);
      })
    : all;

  const sorted = sortPhotosForGallery(filtered);
  const sliced = sorted.slice(options.offset, options.offset + options.limit);

  return {
    photos: sliced,
    total: sorted.length
  };
}

/**
 * Get display date for photo (takenAt → createdAt fallback).
 *
 * Helper for photo detail and lightbox display.
 */
export function getPhotoDisplayDate(photo: Pick<Photo, "takenAt" | "createdAt">): string {
  return getPhotoDisplayDateValue(photo) || "";
}
