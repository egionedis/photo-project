import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { rebuildGallerySnapshot } from "@/lib/snapshot-cache";
import { revalidateAfterPhotoMutation } from "@/lib/revalidation";

const schema = z.object({
  publicId: z.string().min(1)
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

  const { publicId } = parsed.data;
  await rebuildGallerySnapshot();

  revalidateAfterPhotoMutation({
    publicId,
    mutationType: "create"
  });

  return NextResponse.json({ ok: true });
}
