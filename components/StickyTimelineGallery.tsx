"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/types";
import { TimelineNav } from "@/components/TimelineNav";
import { getPhotoDisplayDateValue } from "@/lib/photo-date";

type StickyTimelineGalleryProps = {
  photos: Photo[];
};

function formatLongDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(parsed);
}

export function StickyTimelineGallery({ photos }: StickyTimelineGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  const heroPhoto = photos[0];
  const activePhoto = photos[activeIndex] ?? photos[0];

  const sectionIds = useMemo(
    () => photos.map((photo, index) => `places-section-${index}-${photo.publicId.replaceAll("/", "-")}`),
    [photos]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const index = Number((visible.target as HTMLElement).dataset.index || "0");
        if (!Number.isNaN(index)) {
          setActiveIndex(index);
        }
      },
      {
        root: null,
        rootMargin: "-35% 0px -35% 0px",
        threshold: [0.2, 0.5, 0.8]
      }
    );

    for (const section of sectionRefs.current) {
      if (section) {
        observer.observe(section);
      }
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  function scrollToSection(index: number) {
    const section = sectionRefs.current[index];
    if (!section) {
      return;
    }
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!photos.length) {
    return (
      <section className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0 }}>Places</h1>
        <p style={{ marginBottom: 0 }}>No photos found.</p>
      </section>
    );
  }

  return (
    <div className="places-shell">
      <section className="places-hero">
        <Image src={heroPhoto.secureUrl} alt={heroPhoto.title} fill priority className="places-hero-image" />
        <div className="places-hero-overlay">
          <p>Places</p>
          <h1>{heroPhoto.title}</h1>
        </div>
      </section>

      <div className="places-toolbar">
        <button type="button" className={`button${snapEnabled ? "" : " secondary"}`} onClick={() => setSnapEnabled((s) => !s)}>
          {snapEnabled ? "Snap: On" : "Snap: Off"}
        </button>
      </div>

      <div className="places-grid">
        <TimelineNav photos={photos} activeIndex={activeIndex} onSelect={scrollToSection} />

        <section className={`places-sections${snapEnabled ? " snap-enabled" : ""}`}>
          <div className="places-sticky-frame">
            <div className="places-frame-inner card">
              {photos.map((photo, index) => {
                const isActive = index === activeIndex;
                return (
                  <figure key={photo.publicId} className={`places-frame-photo${isActive ? " is-active" : ""}`}>
                    <Image
                      src={photo.secureUrl}
                      alt={photo.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 62vw"
                      className="places-frame-image"
                    />
                  </figure>
                );
              })}

              <div className="places-frame-caption">
                <p>{formatLongDate(getPhotoDisplayDateValue(activePhoto) || activePhoto.uploadedAt)}</p>
                <h2>{activePhoto.title}</h2>
                <p>{activePhoto.description || "No description provided."}</p>
              </div>
            </div>
          </div>

          {photos.map((photo, index) => (
            <article
              id={sectionIds[index]}
              key={photo.publicId}
              ref={(node) => {
                sectionRefs.current[index] = node;
              }}
              data-index={index}
              className="places-section"
            >
              <div className="places-section-content card">
                <p>{formatLongDate(getPhotoDisplayDateValue(photo) || photo.uploadedAt)}</p>
                <h3>{photo.title}</h3>
                <p>{photo.description || "No description provided."}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
