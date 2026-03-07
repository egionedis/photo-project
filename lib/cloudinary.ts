import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";
import { CLOUDINARY_FOLDER } from "@/lib/constants";
import { env } from "@/lib/env";
import { buildCloudinaryContext } from "@/lib/metadata";
import { getPhotoDisplayDateValue } from "@/lib/photo-date";
import { sortPhotosForGallery } from "@/lib/photo-order";
import { normalizeTagList } from "@/lib/tags";
import type { Photo } from "@/lib/types";

const PHOTO_FOLDER = CLOUDINARY_FOLDER;

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true
});

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  uploaded_at?: string;
  created_at?: string;
  context?: {
    custom?: Record<string, string>;
  } & Record<string, string | Record<string, string> | undefined>;
  tags?: string[];
};

type CloudinarySearchResult = {
  resources: CloudinaryResource[];
  next_cursor?: string;
};

function getContextMap(resource: CloudinaryResource): Record<string, string> {
  const raw = resource.context;
  if (!raw) {
    return {};
  }
  const custom = raw.custom && typeof raw.custom === "object" ? raw.custom : undefined;
  if (custom && Object.keys(custom).length > 0) {
    return custom;
  }

  const flattened: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "custom") {
      continue;
    }
    if (typeof value === "string") {
      flattened[key] = value;
    }
  }
  return flattened;
}

function normalizeAperture(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const numeric = Number(value.replace(/^f\//i, "").trim());
  if (Number.isNaN(numeric) || numeric <= 0) {
    return value;
  }
  return `f/${numeric.toFixed(1)}`;
}

function normalizeFocalLength(value: string | undefined | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const numericMatch = trimmed.match(/-?\d+(?:[.,]\d+)?/);
  if (!numericMatch) {
    return trimmed;
  }

  const parsed = Number(numericMatch[0].replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }

  return `${parsed.toFixed(2)}mm`;
}

function normalizeTags(tags: string[] | string | undefined): string[] {
  return normalizeTagList(tags);
}

function mapResourceToPhoto(resource: CloudinaryResource): Photo {
  const context = getContextMap(resource);
  const tags = normalizeTags(resource.tags ?? context.tags);
  const title = context.title?.trim() || resource.public_id.split("/").pop() || resource.public_id;
  const description = context.description?.trim() || "";
  const sortOrderRaw = context.sort_order?.trim() || context.display_order?.trim();
  const parsedSortOrder = sortOrderRaw !== undefined ? Number(sortOrderRaw) : undefined;
  const sortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : undefined;
  const createdAt = resource.created_at || resource.uploaded_at || "";
  const uploadedAt = resource.uploaded_at || resource.created_at || "";
  const takenAt = context.taken_at?.trim() || undefined;
  const width = resource.width && resource.width > 0 ? resource.width : 1200;
  const height = resource.height && resource.height > 0 ? resource.height : 800;
  const aspectRatio = width / height;
  const camera = {
    make: context.camera_make?.trim() || undefined,
    model: context.camera_model?.trim() || undefined,
    lens: context.lens_model?.trim() || undefined,
    focalLength: normalizeFocalLength(context.focal_length),
    aperture: normalizeAperture(context.aperture?.trim()),
    shutter: context.shutter?.trim() || undefined,
    iso: context.iso?.trim() || undefined
  };

  return {
    publicId: resource.public_id,
    title,
    description,
    sortOrder,
    takenAt,
    createdAt,
    tags,
    secureUrl: resource.secure_url,
    thumbnailUrl: cloudinary.url(resource.public_id, {
      width: 600,
      quality: "auto",
      fetch_format: "auto",
      crop: "fill",
      gravity: "auto"
    }),
    uploadedAt,
    width,
    height,
    aspectRatio,
    camera
  };
}

async function queryGalleryPhotos(): Promise<Photo[]> {
  return queryAllPhotosInFolder();
}

async function queryAllPhotosInFolder(): Promise<Photo[]> {
  const resources: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  do {
    let search = cloudinary.search
      .expression(`folder="${PHOTO_FOLDER}"`)
      .sort_by("uploaded_at", "desc")
      .max_results(500)
      .with_field("context")
      .with_field("tags");

    if (nextCursor) {
      search = search.next_cursor(nextCursor);
    }

    const result = (await search.execute()) as CloudinarySearchResult;
    resources.push(...(result.resources ?? []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources.map(mapResourceToPhoto);
}

const cachedGalleryPhotos = unstable_cache(queryGalleryPhotos, ["gallery-photos"], {
  revalidate: 60
});

export async function getGalleryPhotos(): Promise<Photo[]> {
  const photos = await cachedGalleryPhotos();
  return sortPhotosForGallery(photos);
}

async function queryPhotoByPublicId(publicId: string): Promise<Photo | null> {
  try {
    const resource = (await cloudinary.api.resource(publicId, {
      resource_type: "image",
      context: true,
      tags: true
    })) as CloudinaryResource;
    return mapResourceToPhoto(resource);
  } catch {
    return null;
  }
}

export async function getPhotoByPublicId(publicId: string): Promise<Photo | null> {
  const cachedFn = unstable_cache(
    async () => queryPhotoByPublicId(publicId),
    ["photo-by-id", publicId],
    { revalidate: 60 }
  );
  return cachedFn();
}

export function createUploadSignature(params: Record<string, string | number>): string {
  return cloudinary.utils.api_sign_request(params, env.cloudinaryApiSecret);
}

export async function updatePhotoMetadata(fields: {
  publicId: string;
  title: string;
  description: string;
  tags?: string[];
  sortOrder?: number | null;
  takenAt?: string | null;
  cameraMake?: string | null;
  cameraModel?: string | null;
  lensModel?: string | null;
  focalLength?: string | null;
  aperture?: string | null;
  shutter?: string | null;
  iso?: string | null;
}): Promise<void> {
  const existing = (await cloudinary.api.resource(fields.publicId, {
    resource_type: "image",
    context: true,
    tags: true
  })) as CloudinaryResource;

  const existingContext = getContextMap(existing);
  const nextContextFields: Record<string, string | undefined> = {
    ...existingContext,
    title: fields.title,
    description: fields.description
  };

  if (fields.sortOrder !== undefined) {
    nextContextFields.sort_order = fields.sortOrder === null ? undefined : fields.sortOrder.toString();
  }
  if (fields.takenAt !== undefined) {
    nextContextFields.taken_at = fields.takenAt === null ? undefined : fields.takenAt;
  }
  if (fields.cameraMake !== undefined) {
    nextContextFields.camera_make = fields.cameraMake === null ? undefined : fields.cameraMake;
  }
  if (fields.cameraModel !== undefined) {
    nextContextFields.camera_model = fields.cameraModel === null ? undefined : fields.cameraModel;
  }
  if (fields.lensModel !== undefined) {
    nextContextFields.lens_model = fields.lensModel === null ? undefined : fields.lensModel;
  }
  if (fields.focalLength !== undefined) {
    nextContextFields.focal_length = fields.focalLength === null ? undefined : normalizeFocalLength(fields.focalLength);
  }
  if (fields.aperture !== undefined) {
    nextContextFields.aperture = fields.aperture === null ? undefined : fields.aperture;
  }
  if (fields.shutter !== undefined) {
    nextContextFields.shutter = fields.shutter === null ? undefined : fields.shutter;
  }
  if (fields.iso !== undefined) {
    nextContextFields.iso = fields.iso === null ? undefined : fields.iso;
  }

  const mergedContext = buildCloudinaryContext(nextContextFields);

  await cloudinary.api.update(fields.publicId, {
    context: mergedContext,
    tags: fields.tags ?? normalizeTags(existing.tags ?? existingContext.tags),
    resource_type: "image",
    type: "upload"
  });
}

export async function batchUpdatePhotoSortOrder(
  items: Array<{ publicId: string; sortOrder: number | null }>
): Promise<void> {
  for (const item of items) {
    const existing = (await cloudinary.api.resource(item.publicId, {
      resource_type: "image",
      context: true,
      tags: true
    })) as CloudinaryResource;

    const existingContext = getContextMap(existing);
    const mergedContext = buildCloudinaryContext({
      ...existingContext,
      sort_order: item.sortOrder === null ? undefined : String(item.sortOrder)
    });

    await cloudinary.api.update(item.publicId, {
      context: mergedContext,
      tags: normalizeTags(existing.tags ?? existingContext.tags),
      resource_type: "image",
      type: "upload"
    });
  }
}

export async function searchPhotosForAdminOrder(options: {
  query: string;
  offset: number;
  limit: number;
}): Promise<{ photos: Photo[]; total: number }> {
  const all = await queryAllPhotosInFolder();
  const normalizedQuery = options.query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? all.filter((photo) => {
        const title = photo.title.toLowerCase();
        const description = photo.description.toLowerCase();
        return title.includes(normalizedQuery) || description.includes(normalizedQuery);
      })
    : all;

  const sorted = sortPhotosForGallery(filtered);
  const sliced = sorted.slice(options.offset, options.offset + options.limit);

  return {
    photos: sliced,
    total: sorted.length
  };
}

export async function deletePhotoByPublicId(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    type: "upload",
    invalidate: true
  });
}

export function getPhotoDisplayDate(photo: Pick<Photo, "takenAt" | "createdAt">): string {
  return getPhotoDisplayDateValue(photo) || "";
}

export function buildImageUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    quality: "auto",
    fetch_format: "auto"
  });
}

export const cloudinaryConstants = {
  folder: PHOTO_FOLDER,
  cloudName: env.cloudinaryCloudName,
  apiKey: env.cloudinaryApiKey
};
