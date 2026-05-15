import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminBulkClassify } from "@/components/admin-bulk-classify";
import { getGalleryPhotos } from "@/lib/cloudinary";
import styles from "../admin.module.css";

export default async function AdminClassifyPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session) {
    redirect("/admin");
  }

  const photos = await getGalleryPhotos();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1 className={styles.title}>Admin</h1>
          <AdminLogoutButton />
        </header>

        <AdminNav current="classify" />

        <AdminBulkClassify photos={photos} />
      </div>
    </main>
  );
}
