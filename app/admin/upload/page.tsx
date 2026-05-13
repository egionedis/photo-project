import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminNav } from "@/components/admin-nav";
import { AdminUploadForm } from "@/components/admin-upload-form";
import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "../admin.module.css";

export default async function AdminUploadPage() {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect("/admin");
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin</h1>
          <AdminLogoutButton />
        </div>
        <AdminNav current="upload" />
        <AdminUploadForm />
      </div>
    </section>
  );
}
