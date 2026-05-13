import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminNav } from "@/components/admin-nav";
import { AdminOrderGridDnD } from "@/components/AdminOrderGridDnD";
import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import styles from "../admin.module.css";

export const revalidate = 0;

export default async function AdminOrderPage() {
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
        <AdminNav current="order" />
        <AdminOrderGridDnD />
      </div>
    </section>
  );
}
