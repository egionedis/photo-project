"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/types";
import { Lightbox } from "@/components/lightbox";

type GalleryJustifiedProps = {
  photos: Photo[];
};

type JustifiedRowItem = {
  photo: Photo;
  index: number;
  width: number;
};

type JustifiedRow = {
  height: number;
  items: JustifiedRowItem[];
};

const IMAGE_GAP = 8;

function normalizeAspectRatio(photo: Photo): number {
  if (photo.aspectRatio > 0) {
    return photo.aspectRatio;
  }
  if (photo.width > 0 && photo.height > 0) {
    return photo.width / photo.height;
  }
  return 1.5;
}

function buildRows(photos: Photo[], containerWidth: number, targetRowHeight: number): JustifiedRow[] {
  if (!photos.length) {
    return [];
  }
  if (containerWidth <= 0) {
    return [
      {
        height: targetRowHeight,
        items: photos.map((photo, index) => ({
          photo,
          index,
          width: targetRowHeight * normalizeAspectRatio(photo)
        }))
      }
    ];
  }

  const rows: JustifiedRow[] = [];
  let bucket: Array<{ photo: Photo; index: number; aspectRatio: number }> = [];
  let bucketWidthAtTarget = 0;

  for (const [index, photo] of photos.entries()) {
    const aspectRatio = normalizeAspectRatio(photo);
    bucket.push({ photo, index, aspectRatio });
    bucketWidthAtTarget += targetRowHeight * aspectRatio;

    const rowGapWidth = IMAGE_GAP * (bucket.length - 1);
    if (bucketWidthAtTarget + rowGapWidth >= containerWidth) {
      const rowHeight = (containerWidth - rowGapWidth) / bucket.reduce((sum, item) => sum + item.aspectRatio, 0);
      const rawWidths = bucket.map((item) => rowHeight * item.aspectRatio);
      const roundedWidths = rawWidths.map((width) => Math.floor(width));
      const filledWidth = roundedWidths.reduce((sum, width) => sum + width, 0);
      const expectedWidth = containerWidth - rowGapWidth;
      const remainder = expectedWidth - filledWidth;

      if (roundedWidths.length > 0) {
        const lastIndex = roundedWidths.length - 1;
        roundedWidths[lastIndex] = Math.max(1, roundedWidths[lastIndex] + remainder);
      }

      rows.push({
        height: rowHeight,
        items: bucket.map((item, idx) => ({
          photo: item.photo,
          index: item.index,
          width: roundedWidths[idx] ?? Math.floor(rowHeight * item.aspectRatio)
        }))
      });
      bucket = [];
      bucketWidthAtTarget = 0;
    }
  }

  if (bucket.length) {
    rows.push({
      height: targetRowHeight,
      items: bucket.map((item) => ({
        photo: item.photo,
        index: item.index,
        width: targetRowHeight * item.aspectRatio
      }))
    });
  }

  return rows;
}

export function GalleryJustified({ photos }: GalleryJustifiedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setContainerWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const targetRowHeight = containerWidth < 768 ? 200 : 280;
  const rows = useMemo(() => buildRows(photos, containerWidth, targetRowHeight), [photos, containerWidth, targetRowHeight]);

  function openLightbox(index: number) {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
  }

  function closeLightbox() {
    setIsLightboxOpen(false);
  }

  function goNext() {
    setCurrentIndex((index) => (index + 1) % photos.length);
  }

  function goPrevious() {
    setCurrentIndex((index) => (index - 1 + photos.length) % photos.length);
  }

  if (!photos.length) {
    return (
      <section className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0 }}>Gallery</h1>
        <p style={{ marginBottom: 0 }}>No photos yet.</p>
      </section>
    );
  }

  return (
    <section className="gallery-justified-page">
      <div className="gallery-justified-grid" ref={containerRef}>
        {rows.map((row, rowIndex) => (
          <div key={`fragment-${rowIndex}`} className="gallery-row-fragment">
            {row.items.map((item) => (
              <button
                key={item.photo.publicId}
                type="button"
                className="gallery-justified-tile"
                style={{ width: `${item.width}px`, height: `${row.height}px` }}
                onClick={() => openLightbox(item.index)}
                aria-label={`Open ${item.photo.title}`}
              >
                <Image
                  src={item.photo.secureUrl}
                  alt={item.photo.title}
                  width={item.photo.width}
                  height={item.photo.height}
                  sizes="(max-width: 767px) 100vw, 50vw"
                  className="gallery-justified-image"
                />
              </button>
            ))}
            <div className="gallery-row-break" aria-hidden="true" />
          </div>
        ))}
      </div>

      <Lightbox
        photos={photos}
        currentIndex={currentIndex}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onPrevious={goPrevious}
        onNext={goNext}
      />
    </section>
  );
}
