import { get, put } from "@vercel/blob";

type CollectionCoverMap = Record<string, { coverPhotoId: string | null }>;

const METADATA_PATH = "gallery/collection-metadata.json";

export async function readCollectionMetadata(): Promise<CollectionCoverMap> {
  try {
    const result = await get(METADATA_PATH, { access: "private" });
    if (!result || !result.stream) {
      return {};
    }
    const text = await new Response(result.stream).text();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function writeCollectionMetadata(metadata: CollectionCoverMap): Promise<void> {
  await put(METADATA_PATH, JSON.stringify(metadata), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json"
  });
}

export async function setCollectionCover(
  slug: string,
  coverPhotoId: string | null
): Promise<void> {
  const metadata = await readCollectionMetadata();
  metadata[slug] = { coverPhotoId };
  await writeCollectionMetadata(metadata);
}
