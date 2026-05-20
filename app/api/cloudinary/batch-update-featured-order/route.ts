import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { batchUpdatePhotoFeaturedOrder } from "@/lib/cloudinary-client";
import { rebuildGallerySnapshot } from "@/lib/snapshot-cache";
import { COLLECTION_REVALIDATE_PATHS } from "@/lib/collections";

const itemSchema = z.object({
  publicId: z.string().min(1),
  featuredOrder: z.number().nullable()
});

const schema = z.object({
  items: z.array(itemSchema).min(1)
});

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
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

  const chunks = chunk(parsed.data.items, 25);
  for (const part of chunks) {
    await batchUpdatePhotoFeaturedOrder(part);
  }
  await rebuildGallerySnapshot();

  for (const path of COLLECTION_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  revalidatePath("/admin/featured");

  return NextResponse.json({ ok: true });
}
