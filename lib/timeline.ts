import type { Photo } from "@/lib/types";
import { getPhotoDisplayDateValue } from "@/lib/photo-date";

export type TimelineGroup = {
  year: string;
  items: Photo[];
};

function parsePhotoDate(photo: Photo): Date | null {
  const value = getPhotoDisplayDateValue(photo) || photo.uploadedAt;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export function getPhotoYear(photo: Photo): string {
  const parsed = parsePhotoDate(photo);
  if (!parsed) {
    return "Unknown";
  }
  return String(parsed.getFullYear());
}

export function groupPhotosByYear(photos: Photo[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [];

  for (const photo of photos) {
    const year = getPhotoYear(photo);
    const existing = groups.find((group) => group.year === year);
    if (existing) {
      existing.items.push(photo);
      continue;
    }
    groups.push({
      year,
      items: [photo]
    });
  }

  return groups;
}
