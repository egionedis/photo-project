import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSessionFromCookies, isValidAdminSessionToken } from "@/lib/auth";
import { rebuildGallerySnapshot } from "@/lib/cloudinary";
import { TAGGED_COLLECTIONS } from "@/lib/collections";

export async function POST() {
  const token = await getAdminSessionFromCookies();
  if (!token || !isValidAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await rebuildGallerySnapshot();

    // Revalidate all gallery paths
    revalidatePath("/");
    revalidatePath("/gallery");
    revalidatePath("/collections");
    TAGGED_COLLECTIONS.forEach(collection => {
      revalidatePath(`/collections/${collection.slug}`);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to rebuild snapshot:", error);
    return NextResponse.json(
      { error: "Failed to rebuild snapshot" },
      { status: 500 }
    );
  }
}
