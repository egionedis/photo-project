import Link from "next/link";

type AdminNavProps = {
  current: "upload" | "edit" | "order";
};

export function AdminNav({ current }: AdminNavProps) {
  return (
    <nav style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }} aria-label="Admin navigation">
      <Link className={`button${current === "upload" ? "" : " secondary"}`} href="/admin/upload">
        Upload
      </Link>
      <Link className={`button${current === "edit" ? "" : " secondary"}`} href="/admin/edit">
        Edit Photos
      </Link>
      <Link className={`button${current === "order" ? "" : " secondary"}`} href="/admin/order">
        Order
      </Link>
    </nav>
  );
}
