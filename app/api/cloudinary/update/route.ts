import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { updatePhotoMetadata } from "@/lib/cloudinary";
import { normalizeTagsInput } from "@/lib/tags";

const schema = z.object({
  publicId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  tags: z.string().optional(),
  sortOrder: z.number().nullable().optional(),
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
    tags: data.tags !== undefined ? normalizeTagsInput(data.tags) : undefined,
    sortOrder: data.sortOrder,
    cameraMake: data.cameraMake !== undefined ? (data.cameraMake.trim() || null) : undefined,
    cameraModel: data.cameraModel !== undefined ? (data.cameraModel.trim() || null) : undefined,
    lensModel: data.lensModel !== undefined ? (data.lensModel.trim() || null) : undefined,
    focalLength: data.focalLength !== undefined ? (data.focalLength.trim() || null) : undefined,
    aperture: data.aperture !== undefined ? (data.aperture.trim() || null) : undefined,
    shutter: data.shutter !== undefined ? (data.shutter.trim() || null) : undefined,
    iso: data.iso !== undefined ? (data.iso.trim() || null) : undefined
  });

  revalidatePath("/gallery");
  revalidatePath(toPhotoPath(data.publicId));
  revalidatePath("/admin/edit");

  return NextResponse.json({ ok: true });
}
