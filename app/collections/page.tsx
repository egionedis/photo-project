import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getGalleryPhotos } from "@/lib/cloudinary";
import {
  filterPhotosByCollection,
  getCollectionCoverPhoto,
  getCollectionDefinitions
} from "@/lib/collections";
import styles from "./page.module.css";

const SITE_DESCRIPTION = "A personal photobook of places, people, and quiet movements.";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections | Edgar Gionedis",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/collections"
  },
  openGraph: {
    title: "Collections | Edgar Gionedis",
    description: SITE_DESCRIPTION,
    url: "/collections",
    type: "website"
  }
};

export default async function CollectionsPage() {
  const photos = await getGalleryPhotos();
  const collections = getCollectionDefinitions().filter((collection) => {
    if (collection.slug === "all") {
      return true;
    }
    return filterPhotosByCollection(photos, collection.slug).length > 0;
  });

  return (
    <section className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.kicker}>Collections</p>

      </div>

      <div className={styles.grid}>
        {await Promise.all(collections.map(async (collection) => {
          const coverPhoto = await getCollectionCoverPhoto(photos, collection.slug);

          return (
            <Link key={collection.slug} href={`/collections/${collection.slug}`} className={styles.tile}>
              {coverPhoto ? (
                <>
                  <Image
                    src={coverPhoto.secureUrl}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 20vw"
                    className={styles.tileImage}
                  />
                  <div className={styles.tileOverlay}>
                    <h2 className={styles.tileName}>{collection.name}</h2>
                  </div>
                </>
              ) : (
                <div className={styles.tileEmpty}>
                  <span>No photos</span>
                </div>
              )}
            </Link>
          );
        }))}
      </div>
    </section>
  );
}
