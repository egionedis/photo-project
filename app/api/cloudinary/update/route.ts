import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { rebuildGallerySnapshot, updatePhotoMetadata } from "@/lib/cloudinary";
import { COLLECTION_REVALIDATE_PATHS, TAGGED_COLLECTIONS } from "@/lib/collections";

function normalizeCollectionTags(input: string): string[] {
  const allowedTags = new Set(TAGGED_COLLECTIONS.map((collection) => collection.slug));
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag, index, tags) => tag && allowedTags.has(tag as (typeof TAGGED_COLLECTIONS)[number]["slug"]) && tags.indexOf(tag) === index);
}

const schema = z.object({
  publicId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  titleEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  tags: z.string().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().nullable().optional(),
  takenAt: z.string().optional(),
  cameraMake: z.string().optional(),
  cameraModel: z.string().optional(),
  lensModel: z.string().optional(),
  focalLength: z.string().optional(),
  aperture: z.string().optional(),
  shutter: z.string().optional(),
  iso: z.string().optional()
});

function toPhotoPath(publicId: string): string {
  return `/photo/${publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export async function POST(request: Request) {
  const token = await getAdminSessionFromCookies();
  if (!token || !isValidAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const data = parsed.data;
  await updatePhotoMetadata({
    publicId: data.publicId,
    title: data.title.trim(),
    description: data.description.trim(),
    titleEn: data.titleEn !== undefined ? (data.titleEn.trim() || null) : undefined,
    descriptionEn: data.descriptionEn !== undefined ? (data.descriptionEn.trim() || null) : undefined,
    tags: data.tags !== undefined ? normalizeCollectionTags(data.tags) : undefined,
    featured: data.featured,
    sortOrder: data.sortOrder,
    takenAt: data.takenAt !== undefined ? (data.takenAt.trim() || null) : undefined,
    cameraMake: data.cameraMake !== undefined ? (data.cameraMake.trim() || null) : undefined,
    cameraModel: data.cameraModel !== undefined ? (data.cameraModel.trim() || null) : undefined,
    lensModel: data.lensModel !== undefined ? (data.lensModel.trim() || null) : undefined,
    focalLength: data.focalLength !== undefined ? (data.focalLength.trim() || null) : undefined,
    aperture: data.aperture !== undefined ? (data.aperture.trim() || null) : undefined,
    shutter: data.shutter !== undefined ? (data.shutter.trim() || null) : undefined,
    iso: data.iso !== undefined ? (data.iso.trim() || null) : undefined
  });
  await rebuildGallerySnapshot();

  for (const path of COLLECTION_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  revalidatePath(toPhotoPath(data.publicId));
  revalidatePath("/admin/edit");
  revalidatePath("/admin/featured");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
