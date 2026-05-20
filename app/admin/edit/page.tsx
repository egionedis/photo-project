import { AdminEditPhotos } from "@/components/admin-edit-photos";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminNav } from "@/components/admin-nav";
import { isAdminAuthenticated } from "@/lib/auth";
import { getGalleryPhotos } from "@/lib/snapshot-cache";
import { redirect } from "next/navigation";
import styles from "../admin.module.css";

export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ photo?: string }>;
};

export default async function AdminEditPage({ searchParams }: PageProps) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect("/admin");
  }

  const photos = await getGalleryPhotos();
  const params = await searchParams;
  const initialPhotoId = params.photo;

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin</h1>
          <AdminLogoutButton />
        </div>
        <AdminNav current="edit" />
        <AdminEditPhotos photos={photos} initialPhotoId={initialPhotoId} />
      </div>
    </section>
  );
}
