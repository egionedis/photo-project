"use client";

import { useRouter } from "next/navigation";
import styles from "../app/admin/admin.module.css";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button className={styles.button} type="button" onClick={handleLogout}>
      Logout
    </button>
  );
}
