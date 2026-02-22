import { AdminEditPhotos } from "@/components/admin-edit-photos";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminNav } from "@/components/admin-nav";
import { isAdminAuthenticated } from "@/lib/auth";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AdminEditPage() {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect("/admin");
  }

  const photos = await getGalleryPhotos();

  return (
    <section className="stack admin-upload-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <AdminLogoutButton />
      </div>
      <AdminNav current="edit" />
      <AdminEditPhotos photos={photos} />
    </section>
  );
}
