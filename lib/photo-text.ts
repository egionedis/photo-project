import type { Photo } from "@/lib/types";
import { formatPhotoDate } from "@/lib/photo-date";

export function getPhotoTitle(photo: Pick<Photo, "title" | "titleEn">): string {
  return photo.titleEn?.trim() || photo.title?.trim() || "Untitled";
}

export function getPhotoDescription(photo: Pick<Photo, "description" | "descriptionEn">): string {
  return photo.descriptionEn?.trim() || photo.description?.trim() || "";
}

export function formatPortfolioDate(value: string | undefined): string {
  return formatPhotoDate(value, "en-US", "Unknown");
}
