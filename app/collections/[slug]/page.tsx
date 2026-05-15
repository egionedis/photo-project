import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JustifiedGallery } from "@/components/JustifiedGallery";
import { getGalleryPhotos } from "@/lib/cloudinary";
import {
  filterPhotosByCollection,
  getCollectionDefinition,
  getCollectionDefinitions,
  type CollectionSlug
} from "@/lib/collections";
import styles from "./page.module.css";

type CollectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const TITLE_BY_SLUG: Record<CollectionSlug, string> = {
  all: "All Photos",
  travel: "Travel",
  life: "Life",
  architecture: "Architecture",
  nature: "Nature",
  objects: "Objects"
};

export const revalidate = 60;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getCollectionDefinitions().map((collection) => ({
    slug: collection.slug
  }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollectionDefinition(slug);

  if (!collection) {
    return {
      title: "Collection not found | Edgar Gionedis"
    };
  }

  const title = `${TITLE_BY_SLUG[collection.slug]} | Edgar Gionedis`;

  return {
    title,
    description: collection.description,
    alternates: {
      canonical: `/collections/${collection.slug}`
    },
    openGraph: {
      title,
      description: collection.description,
      url: `/collections/${collection.slug}`,
      type: "website"
    }
  };
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = getCollectionDefinition(slug);

  if (!collection) {
    notFound();
  }

  const photos = await getGalleryPhotos();
  const filteredPhotos = filterPhotosByCollection(photos, collection.slug);

  return (
    <section className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.kicker}>Collection</p>
        <h1>{collection.name}</h1>
        <p>{collection.description}</p>
      </div>

      <JustifiedGallery photos={filteredPhotos} />
    </section>
  );
}
