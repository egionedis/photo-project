/**
 * URL path building utilities.
 *
 * Centralizes path construction to ensure consistent encoding across the app.
 */

/**
 * Build photo detail page path from Cloudinary publicId.
 * Handles nested folders and special characters via encodeURIComponent.
 *
 * @example
 * buildPhotoDetailPath("sunset") → "/photo/sunset"
 * buildPhotoDetailPath("travel/paris") → "/photo/travel/paris"
 * buildPhotoDetailPath("my photo!") → "/photo/my%20photo%21"
 */
export function buildPhotoDetailPath(publicId: string): string {
  return `/photo/${publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

/**
 * Build collection page path from collection slug.
 */
export function buildCollectionPath(slug: string): string {
  return `/collections/${slug}`;
}

/**
 * Build about page path.
 */
export function buildAboutPath(): string {
  return "/about";
}

/**
 * Build admin page paths.
 */
export function buildAdminPath(page?: "edit" | "order" | "upload" | "featured"): string {
  return page ? `/admin/${page}` : "/admin";
}

/**
 * Build homepage path.
 */
export function buildHomePath(): string {
  return "/";
}
