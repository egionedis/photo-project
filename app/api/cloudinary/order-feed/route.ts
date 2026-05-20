import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { searchPhotosForAdminOrder } from "@/lib/snapshot-cache";

const schema = z.object({
  query: z.string().optional().default(""),
  offset: z.number().int().min(0).optional().default(0),
  limit: z.number().int().min(1).max(120).optional().default(100)
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

  const { query, offset, limit } = parsed.data;
  const result = await searchPhotosForAdminOrder({ query, offset, limit });
  const nextOffset = offset + result.photos.length < result.total ? offset + result.photos.length : null;

  return NextResponse.json({
    items: result.photos,
    total: result.total,
    nextOffset
  });
}
