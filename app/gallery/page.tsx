import { getGalleryPhotos } from "@/lib/cloudinary";
import { JustifiedGallery } from "@/components/JustifiedGallery";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const photos = await getGalleryPhotos();
  return (
    <div className="max-w-screen-2xl mx-auto px-6">
      <JustifiedGallery photos={photos} />
    </div>
  );
}
