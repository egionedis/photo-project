import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { getGalleryPhotos, rebuildGallerySnapshot, updatePhotoMetadata } from "@/lib/cloudinary";
import { TAGGED_COLLECTIONS } from "@/lib/collections";

const schema = z.object({
  photoIds: z.array(z.string()),
  tags: z.array(z.string()),
  mode: z.enum(["add", "replace"])
});

export async function POST(request: Request) {
  const token = await getAdminSessionFromCookies();
  if (!token || !isValidAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { photoIds, tags, mode } = parsed.data;

  // Validate tags against allowed collection tags
  const allowedTags = new Set<string>(TAGGED_COLLECTIONS.map(c => c.slug));
  const validTags = tags.filter(t => allowedTags.has(t));

  if (validTags.length === 0) {
    return NextResponse.json({ error: "No valid tags provided" }, { status: 400 });
  }

  // Fetch all photos directly from Cloudinary (bypass cache)
  const photos = await rebuildGallerySnapshot();

  // Process in chunks of 25
  for (let i = 0; i < photoIds.length; i += 25) {
    const chunk = photoIds.slice(i, i + 25);

    await Promise.all(chunk.map(async (publicId) => {
      const photo = photos.find(p => p.publicId === publicId);
      if (!photo) return;

      // Compute new tags
      const currentTags = photo.tags || [];
      const newTags = mode === "replace"
        ? validTags
        : [...new Set([...currentTags, ...validTags])];

      // Update photo - only tags changed, keep everything else
      await updatePhotoMetadata({
        publicId,
        title: photo.title || "",
        description: photo.description || "",
        titleEn: photo.titleEn || null,
        descriptionEn: photo.descriptionEn || null,
        tags: newTags,
        featured: photo.featured,
        sortOrder: photo.sortOrder,
        takenAt: photo.takenAt || null,
        cameraMake: photo.camera?.make || null,
        cameraModel: photo.camera?.model || null,
        lensModel: photo.camera?.lens || null,
        focalLength: photo.camera?.focalLength || null,
        aperture: photo.camera?.aperture || null,
        shutter: photo.camera?.shutter || null,
        iso: photo.camera?.iso || null
      });
    }));
  }

  // Rebuild gallery snapshot again to pick up tag changes
  await rebuildGallerySnapshot();

  // Revalidate all affected pages
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/collections");
  revalidatePath("/admin/classify");
  TAGGED_COLLECTIONS.forEach(collection => {
    revalidatePath(`/collections/${collection.slug}`);
  });

  return NextResponse.json({ ok: true, updated: photoIds.length });
}
