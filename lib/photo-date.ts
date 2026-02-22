import type { Photo } from "@/lib/types";

export function getPhotoDisplayDateValue(photo: Pick<Photo, "takenAt" | "createdAt">): string | undefined {
  return photo.takenAt || photo.createdAt || undefined;
}

export function formatPhotoDate(value: string | undefined): string {
  if (!value) {
    return "Unknown";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}
