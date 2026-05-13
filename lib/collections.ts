import type { Photo } from "@/lib/types";

export type CollectionSlug = "all" | "travel" | "life" | "architecture" | "street";

export type CollectionDefinition = {
  slug: CollectionSlug;
  name: string;
  description: string;
};

const COLLECTION_DEFINITIONS: CollectionDefinition[] = [
  {
    slug: "all",
    name: "All",
    description: "The full personal photobook."
  },
  {
    slug: "travel",
    name: "Travel",
    description: "Fragments from movement, cities, roads, stations, and passing places."
  },
  {
    slug: "life",
    name: "Life",
    description: "Personal moments, quiet scenes, and everyday details."
  },
  {
    slug: "architecture",
    name: "Architecture",
    description: "Lines, buildings, structures, and urban forms."
  },
  {
    slug: "street",
    name: "Street",
    description: "Public spaces, movement, and unscripted moments."
  }
];

export const TAGGED_COLLECTIONS = COLLECTION_DEFINITIONS.filter(
  (definition): definition is CollectionDefinition & { slug: Exclude<CollectionSlug, "all"> } => definition.slug !== "all"
);

export const COLLECTION_REVALIDATE_PATHS = [
  "/",
  "/collections",
  "/collections/all",
  "/collections/travel",
  "/collections/life",
  "/collections/architecture",
  "/collections/street",
  "/gallery"
] as const;

export function getCollectionDefinitions(): CollectionDefinition[] {
  return COLLECTION_DEFINITIONS;
}

export function getCollectionDefinition(slug: string): CollectionDefinition | undefined {
  return COLLECTION_DEFINITIONS.find((definition) => definition.slug === slug);
}

export function filterPhotosByCollection(photos: Photo[], slug: CollectionSlug): Photo[] {
  if (slug === "all") {
    return photos;
  }

  return photos.filter((photo) => photo.tags.includes(slug));
}

export function getCollectionCoverPhoto(photos: Photo[], slug: CollectionSlug): Photo | undefined {
  if (slug === "all") {
    return getFeaturedPhotos(photos)[0] || photos[0];
  }

  return filterPhotosByCollection(photos, slug)[0];
}

export function getFeaturedPhotos(photos: Photo[]): Photo[] {
  const featuredPhotos = photos.filter((photo) => photo.featured === true);

  if (featuredPhotos.length > 0) {
    return featuredPhotos
      .sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        if (a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== undefined) return 1;
        return 0;
      });
  }

  return photos.slice(0, 10);
}
