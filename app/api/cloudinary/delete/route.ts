import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { deletePhotoByPublicId } from "@/lib/cloudinary";

const schema = z.object({
  publicId: z.string().min(1)
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

  const { publicId } = parsed.data;
  await deletePhotoByPublicId(publicId);

  revalidatePath("/gallery");
  revalidatePath("/admin/edit");
  revalidatePath(toPhotoPath(publicId));

  return NextResponse.json({ ok: true });
}
