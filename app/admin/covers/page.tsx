import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminCollectionCovers } from "@/components/admin-collection-covers";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { getCollectionDefinitions, filterPhotosByCollection } from "@/lib/collections";
import { readCollectionMetadata } from "@/lib/collection-metadata";
import styles from "../admin.module.css";

export default async function AdminCoversPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session) {
    redirect("/admin");
  }

  const photos = await getGalleryPhotos();
  const collections = getCollectionDefinitions().filter(c => c.slug !== "all");
  const metadata = await readCollectionMetadata();

  // Build collection data with photo counts and current cover
  const collectionData = collections.map(collection => ({
    ...collection,
    photos: filterPhotosByCollection(photos, collection.slug),
    currentCoverId: metadata[collection.slug]?.coverPhotoId || null
  }));

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>Admin</h1>
          <AdminLogoutButton />
        </header>

        <AdminNav current="covers" />

        <AdminCollectionCovers collections={collectionData} allPhotos={photos} />
      </div>
    </main>
  );
}
