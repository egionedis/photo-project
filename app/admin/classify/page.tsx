import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminBulkClassify } from "@/components/admin-bulk-classify";
import { AdminRebuildButton } from "@/components/admin-rebuild-button";
import { getGalleryPhotos } from "@/lib/cloudinary";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <AdminRebuildButton />
            <AdminLogoutButton />
          </div>
        </header>

        <AdminNav current="classify" />

        <AdminBulkClassify photos={photos} />
      </div>
    </main>
  );
}
