import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { setCollectionCover } from "@/lib/collection-metadata";

const schema = z.object({
  slug: z.string(),
  coverPhotoId: z.string().nullable()
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

  const { slug, coverPhotoId } = parsed.data;
  await setCollectionCover(slug, coverPhotoId);

  // Revalidate collections page
  revalidatePath("/collections");
  revalidatePath(`/collections/${slug}`);

  return NextResponse.json({ ok: true });
}
