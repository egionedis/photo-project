/**
 * Photo metadata field types and merging logic.
 *
 * Handles the semantics of updating photo metadata:
 * - undefined = don't change existing value
 * - null = delete field (set to undefined in Cloudinary context)
 * - value = set to value
 */

export type PhotoMetadataFields = {
  title?: string;
  description?: string;
  titleEn?: string | null;
  descriptionEn?: string | null;
  featured?: boolean;
  sortOrder?: number | null;
  featuredOrder?: number | null;
  takenAt?: string | null;
  cameraMake?: string | null;
  cameraModel?: string | null;
  lensModel?: string | null;
  focalLength?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  iso?: string | null;
};

/**
 * Merge photo metadata updates with existing values.
 *
 * Null-handling semantics:
 * - `undefined` in updates = preserve existing value
 * - `null` in updates = delete field (returns undefined)
 * - value in updates = set to value
 *
 * Returns a flat object suitable for buildCloudinaryContext().
 *
 * @example
 * mergePhotoMetadata(
 *   { title: "Old", description: "Old desc" },
 *   { title: "New", description: null, titleEn: "English" }
 * )
 * → { title: "New", description: undefined, titleEn: "English" }
 */
export function mergePhotoMetadata(
  existing: Record<string, string | undefined>,
  updates: PhotoMetadataFields,
  normalizeFocalLength: (value: string | null | undefined) => string | undefined
): Record<string, string | undefined> {
  const merged: Record<string, string | undefined> = { ...existing };

  // Title and description are always set (never null)
  if (updates.title !== undefined) {
    merged.title = updates.title;
  }
  if (updates.description !== undefined) {
    merged.description = updates.description;
  }

  // Bilingual fields: null = delete, undefined = preserve, value = set
  if (updates.titleEn !== undefined) {
    merged.title_en = updates.titleEn === null ? undefined : updates.titleEn;
  }
  if (updates.descriptionEn !== undefined) {
    merged.description_en = updates.descriptionEn === null ? undefined : updates.descriptionEn;
  }

  // Boolean featured: true = "true", false/null = delete
  if (updates.featured !== undefined) {
    merged.featured = updates.featured ? "true" : undefined;
  }

  // Numeric fields: null = delete, undefined = preserve, value = stringify
  if (updates.sortOrder !== undefined) {
    merged.sort_order = updates.sortOrder === null ? undefined : updates.sortOrder.toString();
  }
  if (updates.featuredOrder !== undefined) {
    merged.featured_order = updates.featuredOrder === null ? undefined : updates.featuredOrder.toString();
  }

  // Date field: null = delete, undefined = preserve, value = set
  if (updates.takenAt !== undefined) {
    merged.taken_at = updates.takenAt === null ? undefined : updates.takenAt;
  }

  // Camera EXIF fields: null = delete, undefined = preserve, value = set
  if (updates.cameraMake !== undefined) {
    merged.camera_make = updates.cameraMake === null ? undefined : updates.cameraMake;
  }
  if (updates.cameraModel !== undefined) {
    merged.camera_model = updates.cameraModel === null ? undefined : updates.cameraModel;
  }
  if (updates.lensModel !== undefined) {
    merged.lens_model = updates.lensModel === null ? undefined : updates.lensModel;
  }
  if (updates.focalLength !== undefined) {
    merged.focal_length = updates.focalLength === null ? undefined : normalizeFocalLength(updates.focalLength);
  }
  if (updates.aperture !== undefined) {
    merged.aperture = updates.aperture === null ? undefined : updates.aperture;
  }
  if (updates.shutter !== undefined) {
    merged.shutter = updates.shutter === null ? undefined : updates.shutter;
  }
  if (updates.iso !== undefined) {
    merged.iso = updates.iso === null ? undefined : updates.iso;
  }

  return merged;
}
