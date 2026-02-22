"use client";

import type { Photo } from "@/lib/types";
import { groupPhotosByYear } from "@/lib/timeline";
import { getPhotoDisplayDateValue } from "@/lib/photo-date";

type TimelineNavProps = {
  photos: Photo[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

function formatShortDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(parsed);
}

export function TimelineNav({ photos, activeIndex, onSelect }: TimelineNavProps) {
  const groups = groupPhotosByYear(photos);
  const photoIndexMap = new Map(photos.map((photo, index) => [photo.publicId, index]));
  const entries = photos.map((photo, index) => ({
    index,
    label: formatShortDate(getPhotoDisplayDateValue(photo) || photo.uploadedAt),
    title: photo.title
  }));

  return (
    <>
      <div className="timeline-mobile" aria-label="Photo timeline">
        {entries.map((entry) => (
          <button
            key={`${entry.index}-${entry.title}`}
            type="button"
            onClick={() => onSelect(entry.index)}
            className={`timeline-mobile-item${entry.index === activeIndex ? " is-active" : ""}`}
          >
            <span>{entry.label}</span>
          </button>
        ))}
      </div>

      <aside className="timeline-nav" aria-label="Photo timeline">
        {groups.map((group) => (
          <section key={group.year} className="timeline-group">
            <h3>{group.year}</h3>
            <div className="timeline-group-list">
              {group.items.map((photo) => {
                const index = photoIndexMap.get(photo.publicId);
                if (typeof index !== "number") {
                  return null;
                }

                const isActive = index === activeIndex;

                return (
                  <button
                    key={photo.publicId}
                    type="button"
                    onClick={() => onSelect(index)}
                    className={`timeline-item${isActive ? " is-active" : ""}`}
                  >
                    <span className="timeline-dot" aria-hidden="true" />
                    <span className="timeline-label">
                      {formatShortDate(getPhotoDisplayDateValue(photo) || photo.uploadedAt)} {photo.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </aside>
    </>
  );
}
