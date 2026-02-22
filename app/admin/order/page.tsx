import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminNav } from "@/components/admin-nav";
import { AdminOrderGridDnD } from "@/components/AdminOrderGridDnD";
import { isAdminAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AdminOrderPage() {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect("/admin");
  }

  return (
    <section className="stack admin-upload-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <AdminLogoutButton />
      </div>
      <AdminNav current="order" />
      <AdminOrderGridDnD />
    </section>
  );
}
