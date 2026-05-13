"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/types";
import { Lightbox } from "@/components/lightbox";
import { getPhotoTitle } from "@/lib/photo-text";
import styles from "./JustifiedGallery.module.css";

type JustifiedGalleryProps = {
  photos: Photo[];
};

type RowItem = {
  photo: Photo;
  index: number;
  width: number;
};

type Row = {
  height: number;
  items: RowItem[];
};

const GAP_PX = 6;

function getAspectRatio(photo: Photo): number {
  if (photo.width > 0 && photo.height > 0) {
    return photo.width / photo.height;
  }
  if (photo.aspectRatio > 0) {
    return photo.aspectRatio;
  }
  return 1.5;
}

function getTargetRowHeight(containerWidth: number): number {
  if (containerWidth >= 1280) {
    return 300;
  }
  if (containerWidth >= 1024) {
    return 270;
  }
  if (containerWidth >= 640) {
    return 220;
  }
  return 180;
}

function getRowLimits(containerWidth: number): { min: number; max: number } {
  if (containerWidth >= 1024) {
    return { min: 3, max: 4 };
  }
  if (containerWidth >= 640) {
    return { min: 2, max: 3 };
  }
  return { min: 1, max: 1 };
}

function buildRows(photos: Photo[], containerWidth: number): Row[] {
  if (!photos.length || containerWidth <= 0) {
    return [];
  }

  const rows: Row[] = [];
  const targetHeight = getTargetRowHeight(containerWidth);
  const limits = getRowLimits(containerWidth);

  let bucket: Array<{ photo: Photo; index: number; aspectRatio: number }> = [];

  function flushRow(justify = true) {
    if (!bucket.length) {
      return;
    }

    const totalAspect = bucket.reduce((sum, item) => sum + item.aspectRatio, 0);
    const gapsWidth = GAP_PX * Math.max(0, bucket.length - 1);
    const usableWidth = Math.max(1, containerWidth - gapsWidth);
    const justifiedHeight = usableWidth / totalAspect;
    const rowHeight = justify ? justifiedHeight : targetHeight;

    const widths = bucket.map((item) => Math.floor(rowHeight * item.aspectRatio));
    const currentWidth = widths.reduce((sum, width) => sum + width, 0);
    const diff = usableWidth - currentWidth;
    if (justify && widths.length > 0) {
      widths[widths.length - 1] = Math.max(1, widths[widths.length - 1] + diff);
    }

    rows.push({
      height: rowHeight,
      items: bucket.map((item, idx) => ({
        photo: item.photo,
        index: item.index,
        width: widths[idx] ?? Math.max(1, Math.floor(rowHeight * item.aspectRatio))
      }))
    });

    bucket = [];
  }

  for (const [index, photo] of photos.entries()) {
    const aspectRatio = getAspectRatio(photo);
    bucket.push({ photo, index, aspectRatio });

    if (bucket.length < limits.min) {
      continue;
    }

    const hasVertical = bucket.some((item) => item.aspectRatio < 0.95);
    const projectedWidth =
      bucket.reduce((sum, item) => sum + item.aspectRatio * targetHeight, 0) + GAP_PX * (bucket.length - 1);

    if (bucket.length >= limits.max) {
      flushRow(true);
      continue;
    }

    if (containerWidth >= 1024 && bucket.length === 3) {
      if (!hasVertical) {
        flushRow(true);
        continue;
      }
      if (projectedWidth >= containerWidth * 0.9) {
        flushRow(true);
        continue;
      }
      continue;
    }

    if (projectedWidth >= containerWidth * 0.95) {
      flushRow(true);
    }
  }

  if (bucket.length) {
    flushRow(false);
  }

  return rows;
}

export function JustifiedGallery({ photos }: JustifiedGalleryProps) {
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

  const rows = useMemo(() => buildRows(photos, containerWidth), [photos, containerWidth]);
  const isMobile = containerWidth > 0 && containerWidth < 640;

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

  function renderTile(photo: Photo, index: number, style: CSSProperties, sizes: string) {
    const title = getPhotoTitle(photo);

    return (
      <button
        key={photo.publicId}
        type="button"
        className={styles.tile}
        style={style}
        onClick={() => openLightbox(index)}
        aria-label={`Open ${title}`}
      >
        <div className={styles.tileFrame}>
          <Image src={photo.secureUrl} alt={title} fill sizes={sizes} className={styles.image} />
        </div>
      </button>
    );
  }

  if (!photos.length) {
    return (
      <section className="card" style={{ padding: "1rem" }}>
        <p style={{ margin: 0 }}>No photos yet.</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      {isMobile ? (
        <div className={styles.flex} ref={containerRef}>
          {photos.map((photo, index) =>
            renderTile(
              photo,
              index,
              {
                ["--w" as any]: photo.width || 1,
                ["--h" as any]: photo.height || 1
              } as CSSProperties,
              "100vw"
            )
          )}
        </div>
      ) : (
        <div className={styles.grid} ref={containerRef}>
          {rows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className={styles.row} style={{ height: `${row.height}px` }}>
              {row.items.map((item) =>
                renderTile(
                  item.photo,
                  item.index,
                  { width: `${item.width}px` },
                  "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                )
              )}
            </div>
          ))}
        </div>
      )}

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
