"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";
import { SimpleLightbox } from "@/components/simple-lightbox";
import { SelectedWorkStrip } from "@/components/selected-work-strip";
import styles from "@/app/page.module.css";

type HomeGalleryProps = {
  photos: Photo[];
};

export function HomeGallery({ photos }: HomeGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  function handlePhotoClick(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function handleClose() {
    setLightboxOpen(false);
  }

  return (
    <>
      <div className={styles.obsidianHeadingContainer}>
        <h1 className={styles.obsidianHeading}>Selected Work</h1>
      </div>
      <SelectedWorkStrip photos={photos} onPhotoClick={handlePhotoClick} />
      <SimpleLightbox
        photo={photos[lightboxIndex]}
        isOpen={lightboxOpen}
        onClose={handleClose}
      />
    </>
  );
}
