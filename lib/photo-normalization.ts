/**
 * Photo normalization: Resource-to-Photo mapping, context parsing, EXIF normalization.
 *
 * Handles transformation of Cloudinary API responses into our Photo domain type.
 */

import { cloudinary } from "@/lib/cloudinary-client";
import { normalizeTagList } from "@/lib/tags";
import type { Photo } from "@/lib/types";

/**
 * Cloudinary Search API resource structure.
 */
export type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  uploaded_at?: string;
  created_at?: string;
  context?: {
    custom?: Record<string, string>;
  } & Record<string, string | Record<string, string> | undefined>;
  tags?: string[];
};

/**
 * Parse Cloudinary context field into flat key-value map.
 *
 * Handles both object format (context.custom) and pipe-delimited format.
 * Returns flattened map of custom metadata fields.
 */
export function parseCloudinaryContext(resource: CloudinaryResource): Record<string, string> {
  const raw = resource.context;
  if (!raw) {
    return {};
  }

  // Prefer context.custom if present (object format)
  const custom = raw.custom && typeof raw.custom === "object" ? raw.custom : undefined;
  if (custom && Object.keys(custom).length > 0) {
    return custom;
  }

  // Fall back to flattened context (pipe-delimited format)
  const flattened: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "custom") {
      continue;
    }
    if (typeof value === "string") {
      flattened[key] = value;
    }
  }
  return flattened;
}

/**
 * Normalize aperture value to standard f/X.X format.
 *
 * Handles variations like "f/2.8", "2.8", "F2.8".
 * Returns undefined if value is invalid.
 */
export function normalizeAperture(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const numeric = Number(value.replace(/^f\//i, "").trim());
  if (Number.isNaN(numeric) || numeric <= 0) {
    return value;
  }
  return `f/${numeric.toFixed(1)}`;
}

/**
 * Normalize focal length to standard XXmm format.
 *
 * Handles variations like "50mm", "50", "50.0", "50,0".
 * Returns undefined if value is empty or invalid.
 */
export function normalizeFocalLength(value: string | undefined | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const numericMatch = trimmed.match(/-?\d+(?:[.,]\d+)?/);
  if (!numericMatch) {
    return trimmed;
  }

  const parsed = Number(numericMatch[0].replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }

  return `${parsed.toFixed(2)}mm`;
}

/**
 * Normalize tags from various formats to lowercase string array.
 *
 * Handles comma-separated strings, arrays, or undefined.
 * Trims, deduplicates, filters empty strings.
 */
function normalizeTags(tags: string[] | string | undefined): string[] {
  return normalizeTagList(tags);
}

/**
 * Map Cloudinary API resource to Photo domain type.
 *
 * Handles:
 * - Context parsing (custom metadata fields)
 * - Tag normalization
 * - EXIF data extraction and normalization
 * - Date resolution (takenAt → createdAt → uploadedAt fallback)
 * - Sort order parsing (sortOrder and legacy displayOrder)
 * - Aspect ratio calculation
 * - Thumbnail URL generation
 */
export function mapResourceToPhoto(resource: CloudinaryResource): Photo {
  const context = parseCloudinaryContext(resource);
  const tags = normalizeTags(resource.tags ?? context.tags);

  // Title: context.title or last segment of publicId
  const title = context.title?.trim() || resource.public_id.split("/").pop() || resource.public_id;
  const description = context.description?.trim() || "";
  const titleEn = context.title_en?.trim() || undefined;
  const descriptionEn = context.description_en?.trim() || undefined;

  // Featured flag
  const featured = context.featured?.trim() === "true" ? true : undefined;

  // Sort order (supports legacy display_order field)
  const sortOrderRaw = context.sort_order?.trim() || context.display_order?.trim();
  const parsedSortOrder = sortOrderRaw !== undefined ? Number(sortOrderRaw) : undefined;
  const sortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : undefined;

  // Featured order
  const featuredOrderRaw = context.featured_order?.trim();
  const parsedFeaturedOrder = featuredOrderRaw !== undefined ? Number(featuredOrderRaw) : undefined;
  const featuredOrder = Number.isFinite(parsedFeaturedOrder) ? parsedFeaturedOrder : undefined;

  // Dates: prefer created_at, fall back to uploaded_at
  const createdAt = resource.created_at || resource.uploaded_at || "";
  const uploadedAt = resource.uploaded_at || resource.created_at || "";
  const takenAt = context.taken_at?.trim() || undefined;

  // Dimensions and aspect ratio
  const width = resource.width && resource.width > 0 ? resource.width : 1200;
  const height = resource.height && resource.height > 0 ? resource.height : 800;
  const aspectRatio = width / height;

  // Camera EXIF metadata
  const camera = {
    make: context.camera_make?.trim() || undefined,
    model: context.camera_model?.trim() || undefined,
    lens: context.lens_model?.trim() || undefined,
    focalLength: normalizeFocalLength(context.focal_length),
    aperture: normalizeAperture(context.aperture?.trim()),
    shutter: context.shutter?.trim() || undefined,
    iso: context.iso?.trim() || undefined
  };

  return {
    publicId: resource.public_id,
    title,
    description,
    titleEn,
    descriptionEn,
    sortOrder,
    featuredOrder,
    featured,
    takenAt,
    createdAt,
    tags,
    secureUrl: resource.secure_url,
    thumbnailUrl: cloudinary.url(resource.public_id, {
      width: 600,
      quality: "auto",
      fetch_format: "auto",
      crop: "fill",
      gravity: "auto"
    }),
    uploadedAt,
    width,
    height,
    aspectRatio,
    camera
  };
}
