"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/types";
import { formatPhotoDate, getPhotoDisplayDateValue } from "@/lib/photo-date";

type LightboxProps = {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function Lightbox({ photos, currentIndex, isOpen, onClose, onPrevious, onNext }: LightboxProps) {
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        onPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose, onPrevious, onNext]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const activePhoto = photos[currentIndex];
  const title = activePhoto.title?.trim() || "Untitled";
  const description = activePhoto.description?.trim();
  const dateValue = getPhotoDisplayDateValue(activePhoto);
  const formattedDate = dateValue ? formatPhotoDate(dateValue) : undefined;
  const cameraRows = [
    {
      label: "Camera",
      value: activePhoto.camera?.model
    },
    { label: "Lens", value: activePhoto.camera?.lens },
    { label: "Focal length", value: activePhoto.camera?.focalLength },
    { label: "Aperture", value: activePhoto.camera?.aperture },
    { label: "Shutter", value: activePhoto.camera?.shutter },
    { label: "ISO", value: activePhoto.camera?.iso }
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  return (
    <div
      className="lightbox-overlay"
      onClick={onClose}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (!touch) {
          return;
        }
        touchStartXRef.current = touch.clientX;
        touchStartYRef.current = touch.clientY;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartXRef.current;
        const startY = touchStartYRef.current;
        const touch = event.changedTouches[0];

        touchStartXRef.current = null;
        touchStartYRef.current = null;

        if (!touch || startX === null || startY === null) {
          return;
        }

        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Only treat as swipe when horizontal movement is dominant.
        if (absX < 40 || absX <= absY) {
          return;
        }

        if (deltaX < 0) {
          onNext();
        } else {
          onPrevious();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      <button
        className="lightbox-close"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label="Close photo"
      >
        ×
      </button>

      <button
        className="lightbox-nav lightbox-nav-left"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPrevious();
        }}
        aria-label="Previous photo"
      >
        &#8249;
      </button>

      <button
        className="lightbox-nav lightbox-nav-right"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        aria-label="Next photo"
      >
        &#8250;
      </button>

      <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
        <div className="lightbox-image-wrap">
          <Image
            src={activePhoto.secureUrl}
            alt={activePhoto.title}
            fill
            sizes="100vw"
            className="lightbox-image"
            priority
          />
        </div>

        <div className="lightbox-meta">
          <h2>{title}</h2>
          {formattedDate ? <p className="lightbox-date">{formattedDate}</p> : null}
          {description ? <p className="lightbox-description">{description}</p> : null}
          {cameraRows.length ? (
            <div className="lightbox-camera">
              {cameraRows.map((row) => (
                <p key={row.label}>
                  {row.label}: {row.value}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
