"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/types";
import styles from "./SimpleLightbox.module.css";

type SimpleLightboxProps = {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
};

export function SimpleLightbox({ photo, isOpen, onClose }: SimpleLightboxProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handleClick() {
      onClose();
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleClick);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.imageWrap}>
        <Image
          src={photo.secureUrl}
          alt={photo.title}
          fill
          sizes="95vw"
          className={styles.image}
          priority
        />
      </div>
    </div>
  );
}
