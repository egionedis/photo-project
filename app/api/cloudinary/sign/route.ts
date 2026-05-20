import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { cloudinaryConstants, createUploadSignature } from "@/lib/cloudinary-client";
import { buildCloudinaryContext } from "@/lib/metadata";

const schema = z.object({
  context: z.string().optional(),
  tags: z.string().optional(),
  folder: z.string().optional(),
  publicId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  taken_at: z.string().optional(),
  camera_make: z.string().optional(),
  camera_model: z.string().optional(),
  lens_model: z.string().optional(),
  focal_length: z.string().optional(),
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

  const timestamp = Math.floor(Date.now() / 1000);
  const signParams: Record<string, string | number> = {
    timestamp,
    folder: parsed.data.folder || cloudinaryConstants.folder
  };

  const resolvedContext =
    parsed.data.context ||
    buildCloudinaryContext({
      title: parsed.data.title,
      description: parsed.data.description,
      taken_at: parsed.data.taken_at,
      camera_make: parsed.data.camera_make,
      camera_model: parsed.data.camera_model,
      lens_model: parsed.data.lens_model,
      focal_length: parsed.data.focal_length,
      aperture: parsed.data.aperture,
      shutter: parsed.data.shutter,
      iso: parsed.data.iso
    });

  if (resolvedContext) {
    signParams.context = resolvedContext;
  }
  if (parsed.data.tags) {
    signParams.tags = parsed.data.tags;
  }
  if (parsed.data.publicId) {
    signParams.public_id = parsed.data.publicId;
  }

  const signature = createUploadSignature(signParams);

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: cloudinaryConstants.cloudName,
    apiKey: cloudinaryConstants.apiKey,
    folder: signParams.folder,
    context: resolvedContext || undefined
  });
}
