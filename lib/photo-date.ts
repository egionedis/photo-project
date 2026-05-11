import type { Photo } from "@/lib/types";

export function getPhotoDisplayDateValue(photo: Pick<Photo, "takenAt" | "createdAt">): string | undefined {
  return photo.takenAt || photo.createdAt || undefined;
}

export function formatPhotoDate(value: string | undefined, locale = "en-US", unknownLabel = "Unknown"): string {
  if (!value) {
    return unknownLabel;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}
