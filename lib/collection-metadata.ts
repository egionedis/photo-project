import { get, put } from "@vercel/blob";

type CollectionCoverMap = Record<string, { coverPhotoId: string | null }>;

const METADATA_PATH = "gallery/collection-metadata.json";

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readCollectionMetadata(): Promise<CollectionCoverMap> {
  if (!hasBlobToken()) {
    console.warn("BLOB_READ_WRITE_TOKEN not configured, collection covers disabled");
    return {};
  }
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
  if (!hasBlobToken()) {
    console.warn("BLOB_READ_WRITE_TOKEN not configured, cannot save collection covers");
    return;
  }
  try {
    await put(METADATA_PATH, JSON.stringify(metadata), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
  } catch (error) {
    console.error("Failed to write collection metadata to Blob.", error);
  }
}

export async function setCollectionCover(
  slug: string,
  coverPhotoId: string | null
): Promise<void> {
  if (!hasBlobToken()) {
    console.warn("Cannot set collection cover: BLOB_READ_WRITE_TOKEN not configured");
    return;
  }
  const metadata = await readCollectionMetadata();
  metadata[slug] = { coverPhotoId };
  await writeCollectionMetadata(metadata);
}
