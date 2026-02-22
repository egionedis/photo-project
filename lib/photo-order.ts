import type { Photo } from "@/lib/types";

export function sortPhotosForGallery(photos: Photo[]): Photo[] {
  const automatic = photos
    .filter((photo) => photo.sortOrder === undefined)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const manual = photos
    .filter((photo) => photo.sortOrder !== undefined)
    .sort((a, b) => (a.sortOrder as number) - (b.sortOrder as number));

  // Show new imports first by default; manual-ordered items follow.
  return [...automatic, ...manual];
}
