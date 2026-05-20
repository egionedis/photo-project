import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { updatePhotoMetadata } from "@/lib/cloudinary-client";
import { rebuildGallerySnapshot } from "@/lib/snapshot-cache";
import { validateCollectionTags } from "@/lib/collections";
import { revalidateAfterPhotoMutation } from "@/lib/revalidation";

const schema = z.object({
  publicId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  titleEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  tags: z.string().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().nullable().optional(),
  featuredOrder: z.number().nullable().optional(),
  takenAt: z.string().optional(),
  cameraMake: z.string().optional(),
  cameraModel: z.string().optional(),
  lensModel: z.string().optional(),
  focalLength: z.string().optional(),
  aperture: z.string().optional(),
  shutter: z.string().optional(),
  iso: z.string().optional()
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

  const data = parsed.data;
  await updatePhotoMetadata({
    publicId: data.publicId,
    title: data.title.trim(),
    description: data.description.trim(),
    titleEn: data.titleEn !== undefined ? (data.titleEn.trim() || null) : undefined,
    descriptionEn: data.descriptionEn !== undefined ? (data.descriptionEn.trim() || null) : undefined,
    tags: data.tags !== undefined ? validateCollectionTags(data.tags.split(",")) : undefined,
    featured: data.featured,
    sortOrder: data.sortOrder,
    featuredOrder: data.featured === false ? null : data.featuredOrder,
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

  revalidateAfterPhotoMutation({
    publicId: data.publicId,
    mutationType: "update"
  });

  return NextResponse.json({ ok: true });
}
