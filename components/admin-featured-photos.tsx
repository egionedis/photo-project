"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Photo } from "@/lib/types";
import { getPhotoTitle } from "@/lib/photo-text";
import { formatPhotoDate, getPhotoDisplayDateValue } from "@/lib/photo-date";
import styles from "../app/admin/admin.module.css";

type AdminFeaturedPhotosProps = {
  photos: Photo[];
};

export function AdminFeaturedPhotos({ photos }: AdminFeaturedPhotosProps) {
  const [items, setItems] = useState<Photo[]>(photos);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRemoveFeatured(photo: Photo) {
    setRemovingId(photo.publicId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/cloudinary/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: photo.publicId,
          title: photo.title || "",
          description: photo.description || "",
          titleEn: photo.titleEn || "",
          descriptionEn: photo.descriptionEn || "",
          tags: photo.tags.join(","),
          featured: false,
          takenAt: photo.takenAt || "",
          cameraModel: photo.camera?.model || "",
          lensModel: photo.camera?.lens || "",
          focalLength: photo.camera?.focalLength || "",
          aperture: photo.camera?.aperture || "",
          shutter: photo.camera?.shutter || "",
          iso: photo.camera?.iso || ""
        })
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      setItems((prev) => prev.filter((item) => item.publicId !== photo.publicId));
      setSuccess(`Removed "${getPhotoTitle(photo)}" from featured.`);
    } catch {
      setError("Could not remove featured status.");
    } finally {
      setRemovingId(null);
    }
  }

  if (!items.length) {
    return (
      <section>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          No featured photos yet. Mark photos as featured in Edit Photos to display them on the homepage.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
          {items.length} {items.length === 1 ? "photo" : "photos"} featured on homepage
        </p>
      </div>

      {success ? <p style={{ color: "oklch(35% 0.05 140)", margin: "0 0 1.5rem", fontSize: "0.95rem" }}>{success}</p> : null}
      {error ? <p style={{ color: "oklch(45% 0.15 25)", margin: "0 0 1.5rem", fontSize: "0.95rem" }}>{error}</p> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {items.map((photo) => {
          const photoTitle = getPhotoTitle(photo);
          const isRemoving = removingId === photo.publicId;

          return (
            <article
              key={photo.publicId}
              style={{
                display: "grid",
                gap: "1rem",
                padding: "1rem",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                background: "#ffffff"
              }}
            >
              <Link
                href={`/admin/edit?photo=${encodeURIComponent(photo.publicId)}`}
                style={{ display: "block", textDecoration: "none" }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "oklch(97% 0 0)",
                    marginBottom: "0.75rem"
                  }}
                >
                  <Image
                    src={photo.secureUrl}
                    alt={photoTitle}
                    width={560}
                    height={420}
                    unoptimized
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 400, color: "var(--text)" }}>
                  {photoTitle}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
                  {formatPhotoDate(getPhotoDisplayDateValue(photo), "en-US", "Unknown")}
                </p>
              </Link>
              <button
                className={styles.button}
                type="button"
                onClick={() => handleRemoveFeatured(photo)}
                disabled={isRemoving}
                style={{ borderColor: "oklch(85% 0.03 25)", color: "oklch(40% 0.08 25)" }}
              >
                {isRemoving ? "Removing..." : "Remove from Featured"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
