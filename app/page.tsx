import type { Metadata } from "next";
import { getGalleryPhotos } from "@/lib/snapshot-cache";
import { getFeaturedPhotos } from "@/lib/collections";
import { HomeGallery } from "@/components/home-gallery";
import styles from "./page.module.css";

const SITE_DESCRIPTION = "A personal photobook of places, people, and quiet movements.";

export const metadata: Metadata = {
  title: "Edgar Gionedis | Photography",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Edgar Gionedis | Photography",
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website"
  }
};

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const photos = await getGalleryPhotos();
  const featuredPhotos = getFeaturedPhotos(photos);

  return (
    <section className={`${styles.obsidianHomePage} obsidian-home-page`}>
      <HomeGallery photos={featuredPhotos} />
    </section>
  );
}
