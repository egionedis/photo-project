"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Photo } from "@/lib/types";
import { buildPhotoDetailPath } from "@/lib/urls";

type GalleryClientProps = {
  photos: Photo[];
};

export function GalleryClient({ photos }: GalleryClientProps) {
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const photo of photos) {
      for (const tag of photo.tags) {
        set.add(tag);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [photos]);

  const [activeTag, setActiveTag] = useState<string>("all");

  const filtered = useMemo(() => {
    if (activeTag === "all") {
      return photos;
    }
    return photos.filter((photo) => photo.tags.includes(activeTag));
  }, [activeTag, photos]);

  return (
    <section className="stack" style={{ gap: "1.25rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        <button
          type="button"
          className={`button${activeTag === "all" ? "" : " secondary"}`}
          onClick={() => setActiveTag("all")}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`button${activeTag === tag ? "" : " secondary"}`}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <p>No photos for this tag.</p> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem"
        }}
      >
        {filtered.map((photo) => (
          <Link
            key={photo.publicId}
            className="card"
            href={buildPhotoDetailPath(photo.publicId)}
            style={{ overflow: "hidden", display: "block" }}
          >
            <Image
              src={photo.thumbnailUrl}
              alt={photo.title}
              width={600}
              height={450}
              loading="lazy"
              style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
            />
            <div style={{ padding: "0.8rem" }}>
              <h2 style={{ margin: 0, fontSize: "1rem" }}>{photo.title}</h2>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
