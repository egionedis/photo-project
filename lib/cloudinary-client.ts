/**
 * Cloudinary SDK adapter: queries, mutations, signature generation, error detection.
 *
 * Pure SDK interaction layer - no business logic or caching.
 */

import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";
import { CLOUDINARY_FOLDER } from "@/lib/constants";
import { env } from "@/lib/env";
import { buildCloudinaryContext } from "@/lib/metadata";
import { normalizeTagList } from "@/lib/tags";
import { mergePhotoMetadata, type PhotoMetadataFields } from "@/lib/photo-metadata";
import { mapResourceToPhoto, parseCloudinaryContext, normalizeFocalLength, type CloudinaryResource } from "@/lib/photo-normalization";
import type { Photo } from "@/lib/types";

const PHOTO_FOLDER = CLOUDINARY_FOLDER;

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true
});

/**
 * Cloudinary Search API result structure.
 */
export type CloudinarySearchResult = {
  resources: CloudinaryResource[];
  next_cursor?: string;
};

/**
 * Cloudinary API error structure.
 */
type CloudinaryApiError = {
  error?: {
    message?: string;
    http_code?: number;
  };
};

/**
 * Check if error is a Cloudinary rate limit error (420 or 429).
 */
export function isCloudinaryRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybeCloudinaryError = error as CloudinaryApiError;
  const code = maybeCloudinaryError.error?.http_code;
  return code === 420 || code === 429;
}

/**
 * Query all photos in the configured folder using Cloudinary Search API.
 *
 * Handles pagination via cursor. Rate-limit aware.
 * Returns unsorted array of Photo objects.
 */
export async function queryAllPhotosInFolder(): Promise<Photo[]> {
  const resources: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  do {
    let search = cloudinary.search
      .expression(`folder="${PHOTO_FOLDER}"`)
      .sort_by("uploaded_at", "desc")
      .max_results(500)
      .with_field("context")
      .with_field("tags");

    if (nextCursor) {
      search = search.next_cursor(nextCursor);
    }

    try {
      const result = (await search.execute()) as CloudinarySearchResult;
      resources.push(...(result.resources ?? []));
      nextCursor = result.next_cursor;
    } catch (error) {
      if (isCloudinaryRateLimitError(error)) {
        console.error("Cloudinary rate limit reached while fetching photos.");
        break;
      }
      throw error;
    }
  } while (nextCursor);

  return resources.map(mapResourceToPhoto);
}

/**
 * Query a single photo by publicId.
 *
 * Returns null if photo not found.
 */
async function queryPhotoByPublicId(publicId: string): Promise<Photo | null> {
  try {
    const resource = (await cloudinary.api.resource(publicId, {
      resource_type: "image",
      context: true,
      tags: true
    })) as CloudinaryResource;
    return mapResourceToPhoto(resource);
  } catch {
    return null;
  }
}

/**
 * Get photo by publicId with 60-second cache.
 *
 * Uses Next.js unstable_cache for per-photo caching.
 */
export async function getPhotoByPublicId(publicId: string): Promise<Photo | null> {
  const cachedFn = unstable_cache(
    async () => queryPhotoByPublicId(publicId),
    ["photo-by-id", publicId],
    { revalidate: 60 }
  );
  return cachedFn();
}

/**
 * Generate Cloudinary upload signature for client-side upload.
 *
 * Used by admin upload form to sign direct-to-Cloudinary uploads.
 */
export function createUploadSignature(params: Record<string, string | number>): string {
  return cloudinary.utils.api_sign_request(params, env.cloudinaryApiSecret);
}

/**
 * Update photo metadata in Cloudinary.
 *
 * Merges provided fields with existing metadata using null-handling semantics:
 * - undefined = preserve existing value
 * - null = delete field
 * - value = set to value
 *
 * Updates both context (custom metadata) and tags.
 */
export async function updatePhotoMetadata(fields: PhotoMetadataFields & {
  publicId: string;
  title: string;
  description: string;
  tags?: string[];
}): Promise<void> {
  const existing = (await cloudinary.api.resource(fields.publicId, {
    resource_type: "image",
    context: true,
    tags: true
  })) as CloudinaryResource;

  const existingContext = parseCloudinaryContext(existing);

  // Merge metadata using pure function
  const mergedContext = mergePhotoMetadata(existingContext, fields, normalizeFocalLength);

  await cloudinary.api.update(fields.publicId, {
    context: buildCloudinaryContext(mergedContext),
    tags: fields.tags ?? normalizeTagList(existing.tags ?? existingContext.tags),
    resource_type: "image",
    type: "upload"
  });
}

/**
 * Batch update sortOrder for multiple photos.
 *
 * Used by admin manual ordering interface.
 * Each item can set sortOrder to a number or null (to delete).
 */
export async function batchUpdatePhotoSortOrder(
  items: Array<{ publicId: string; sortOrder: number | null }>
): Promise<void> {
  for (const item of items) {
    const existing = (await cloudinary.api.resource(item.publicId, {
      resource_type: "image",
      context: true,
      tags: true
    })) as CloudinaryResource;

    const existingContext = parseCloudinaryContext(existing);
    const mergedContext = buildCloudinaryContext({
      ...existingContext,
      sort_order: item.sortOrder === null ? undefined : String(item.sortOrder)
    });

    await cloudinary.api.update(item.publicId, {
      context: mergedContext,
      tags: normalizeTagList(existing.tags ?? existingContext.tags),
      resource_type: "image",
      type: "upload"
    });
  }
}

/**
 * Batch update featuredOrder for multiple photos.
 *
 * Used by admin featured photo ordering interface.
 * Each item can set featuredOrder to a number or null (to delete).
 */
export async function batchUpdatePhotoFeaturedOrder(
  items: Array<{ publicId: string; featuredOrder: number | null }>
): Promise<void> {
  for (const item of items) {
    const existing = (await cloudinary.api.resource(item.publicId, {
      resource_type: "image",
      context: true,
      tags: true
    })) as CloudinaryResource;

    const existingContext = parseCloudinaryContext(existing);
    const mergedContext = buildCloudinaryContext({
      ...existingContext,
      featured_order: item.featuredOrder === null ? undefined : String(item.featuredOrder)
    });

    await cloudinary.api.update(item.publicId, {
      context: mergedContext,
      tags: normalizeTagList(existing.tags ?? existingContext.tags),
      resource_type: "image",
      type: "upload"
    });
  }
}

/**
 * Delete photo from Cloudinary.
 *
 * Permanently removes photo resource and invalidates CDN cache.
 */
export async function deletePhotoByPublicId(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    type: "upload",
    invalidate: true
  });
}

/**
 * Build Cloudinary image URL with auto quality and format.
 *
 * Returns CDN URL for displaying photo at original size.
 */
export function buildImageUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    quality: "auto",
    fetch_format: "auto"
  });
}

/**
 * Cloudinary configuration constants for client-side use.
 *
 * Exported for admin upload form (direct-to-Cloudinary uploads).
 */
export const cloudinaryConstants = {
  folder: PHOTO_FOLDER,
  cloudName: env.cloudinaryCloudName,
  apiKey: env.cloudinaryApiKey
};

// Re-export configured cloudinary instance for URL generation
export { cloudinary };
