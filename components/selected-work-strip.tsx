"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import { getPhotoTitle } from "@/lib/photo-text";
import styles from "@/app/page.module.css";

type SelectedWorkStripProps = {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
};

export function SelectedWorkStrip({ photos, onPhotoClick }: SelectedWorkStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; scrollLeft: number } | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || !photos.length) {
      return;
    }

    const updateProgress = () => {
      if (!strip) return;
      const { scrollLeft, scrollWidth, clientWidth } = strip;
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setScrollProgress(progress);
    };

    const handleWheel = (event: WheelEvent) => {
      if (!strip || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }
      event.preventDefault();
      strip.scrollLeft += event.deltaY * 2.5;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!strip) {
        return;
      }
      dragStartRef.current = {
        x: event.clientX,
        scrollLeft: strip.scrollLeft
      };
      strip.style.cursor = "grabbing";
      strip.style.scrollBehavior = "auto";
    };

    const handlePointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start || !strip) {
        return;
      }
      strip.scrollLeft = start.scrollLeft - (event.clientX - start.x);
    };

    const handlePointerUp = () => {
      if (!strip) {
        return;
      }
      dragStartRef.current = null;
      strip.style.cursor = "grab";
      strip.style.scrollBehavior = "smooth";
    };

    strip.addEventListener("wheel", handleWheel, { passive: false });
    strip.addEventListener("pointerdown", handlePointerDown);
    strip.addEventListener("pointermove", handlePointerMove);
    strip.addEventListener("pointerup", handlePointerUp);
    strip.addEventListener("pointercancel", handlePointerUp);
    strip.addEventListener("scroll", updateProgress);

    updateProgress();

    return () => {
      strip.removeEventListener("wheel", handleWheel);
      strip.removeEventListener("pointerdown", handlePointerDown);
      strip.removeEventListener("pointermove", handlePointerMove);
      strip.removeEventListener("pointerup", handlePointerUp);
      strip.removeEventListener("pointercancel", handlePointerUp);
      strip.removeEventListener("scroll", updateProgress);
    };
  }, [photos]);

  if (!photos.length) {
    return null;
  }

  return (
    <>
      <div ref={stripRef} className={styles.obsidianStrip} aria-label="Selected work">
        {photos.map((photo, index) => {
          const title = getPhotoTitle(photo);
          const photoNumber = String(index + 1).padStart(2, '0');
          return (
            <div key={photo.publicId} className={styles.obsidianTileWrapper}>
              <button
                type="button"
                className={styles.obsidianTile}
                aria-label={`View ${title} in lightbox`}
                onClick={(event) => {
                  event.stopPropagation();
                  onPhotoClick(index);
                }}
              >
                <Image
                  src={photo.secureUrl}
                  alt={title}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 767px) 90vw, 50vw"
                  className={styles.obsidianImage}
                  priority
                />
              </button>
              <p className={styles.obsidianCaption}>
                / {photoNumber} {title}
              </p>
            </div>
          );
        })}
      </div>
      <div className={styles.obsidianProgressBar}>
        <div
          className={styles.obsidianProgressFill}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </>
  );
}
