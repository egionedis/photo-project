import { revalidatePath } from "next/cache";
import { buildPhotoDetailPath, buildCollectionPath, buildAdminPath, buildHomePath } from "@/lib/urls";
import { TAGGED_COLLECTIONS } from "@/lib/collections";

type PhotoMutationType = "create" | "update" | "delete" | "reorder";

type RevalidationOptions = {
  /**
   * Photo publicId (if mutation affects a specific photo).
   * Triggers revalidation of photo detail page.
   */
  publicId?: string;

  /**
   * Collection slugs affected by this mutation.
   * If omitted, revalidates ALL collections (safe default).
   */
  collectionsAffected?: string[];

  /**
   * Type of mutation performed.
   */
  mutationType: PhotoMutationType;
};

/**
 * Revalidate Next.js paths after a photo mutation.
 *
 * Centralizes revalidation logic to ensure consistent cache invalidation.
 * Always revalidates homepage. Optionally revalidates photo detail page and collections.
 *
 * @example
 * // After uploading new photo tagged "travel"
 * revalidateAfterPhotoMutation({
 *   publicId: "new-photo",
 *   collectionsAffected: ["travel"],
 *   mutationType: "create"
 * });
 *
 * @example
 * // After deleting photo (unknown which collections it was in)
 * revalidateAfterPhotoMutation({
 *   publicId: "deleted-photo",
 *   mutationType: "delete"
 *   // collectionsAffected omitted → revalidates all collections
 * });
 */
export function revalidateAfterPhotoMutation(options: RevalidationOptions): void {
  // Always revalidate homepage
  revalidatePath(buildHomePath());

  // Revalidate photo detail page (if publicId provided)
  if (options.publicId) {
    revalidatePath(buildPhotoDetailPath(options.publicId));
  }

  // Revalidate collections
  // If specific collections provided, only revalidate those
  // Otherwise, revalidate all collections (safe default when collection membership unknown)
  const collectionsToRevalidate = options.collectionsAffected || [
    "all",
    ...TAGGED_COLLECTIONS.map(c => c.slug)
  ];

  revalidatePath("/collections"); // Collection index page
  revalidatePath("/gallery"); // Gallery page

  for (const slug of collectionsToRevalidate) {
    revalidatePath(buildCollectionPath(slug));
  }

  // Revalidate relevant admin pages
  revalidatePath(buildAdminPath("edit"));
  revalidatePath(buildAdminPath("upload"));

  if (options.mutationType === "reorder") {
    revalidatePath(buildAdminPath("order"));
    revalidatePath(buildAdminPath("featured"));
  }
}
