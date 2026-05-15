import Link from "next/link";
import styles from "../app/admin/admin.module.css";

type AdminNavProps = {
  current: "upload" | "edit" | "order" | "featured" | "covers";
};

export function AdminNav({ current }: AdminNavProps) {
  return (
    <nav className={styles.nav} aria-label="Admin navigation">
      <Link
        className={`${styles.navLink} ${current === "upload" ? styles.active : ""}`}
        href="/admin/upload"
      >
        Upload
      </Link>
      <Link
        className={`${styles.navLink} ${current === "edit" ? styles.active : ""}`}
        href="/admin/edit"
      >
        Edit Photos
      </Link>
      <Link
        className={`${styles.navLink} ${current === "order" ? styles.active : ""}`}
        href="/admin/order"
      >
        Order
      </Link>
      <Link
        className={`${styles.navLink} ${current === "featured" ? styles.active : ""}`}
        href="/admin/featured"
      >
        Featured
      </Link>
      <Link
        className={`${styles.navLink} ${current === "covers" ? styles.active : ""}`}
        href="/admin/covers"
      >
        Covers
      </Link>
    </nav>
  );
}
