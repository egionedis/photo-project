"use client";

import Image from "next/image";
import type { Photo } from "@/lib/types";
import { getPhotoDisplayDateValue } from "@/lib/photo-date";
import { useLanguage } from "@/components/language-provider";
import { formatPortfolioDate, getPhotoDescription, getPhotoTitle } from "@/lib/photo-text";

type PhotoDetailClientProps = {
  photo: Photo;
};

export function PhotoDetailClient({ photo }: PhotoDetailClientProps) {
  const { t } = useLanguage();
  const title = getPhotoTitle(photo);
  const description = getPhotoDescription(photo) || t("noDescription");

  return (
    <article className="stack" style={{ gap: "1.2rem" }}>
      <h1 style={{ margin: 0 }}>{title}</h1>
      <div className="card" style={{ overflow: "hidden" }}>
        <Image
          src={photo.secureUrl}
          alt={title}
          width={1600}
          height={1200}
          priority
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
      <div className="card" style={{ padding: "1rem" }}>
        <p style={{ marginTop: 0 }}>{description}</p>
        <p>
          <strong>{t("date")}:</strong> {formatPortfolioDate(getPhotoDisplayDateValue(photo))}
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>{t("tags")}:</strong> {photo.tags.length ? photo.tags.join(", ") : t("none")}
        </p>
      </div>
    </article>
  );
}
