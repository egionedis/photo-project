import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminFeaturedPhotos } from "@/components/admin-featured-photos";
import { getGalleryPhotos } from "@/lib/cloudinary";
import styles from "../admin.module.css";

export default async function AdminFeaturedPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session) {
    redirect("/admin");
  }

  const allPhotos = await getGalleryPhotos();
  const featuredPhotos = allPhotos.filter((photo) => photo.featured);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>Admin</h1>
        </header>

        <AdminNav current="featured" />

        <AdminFeaturedPhotos photos={featuredPhotos} />
      </div>
    </main>
  );
}
