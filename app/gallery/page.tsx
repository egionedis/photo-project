import type { Metadata } from "next";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { JustifiedGallery } from "@/components/JustifiedGallery";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery | Edgar Gionedis",
  description:
    "Photography portfolio of Edgar Gionedis, featuring travel, landscape, street, and personal photography.",
  alternates: {
    canonical: "/gallery"
  },
  openGraph: {
    title: "Gallery | Edgar Gionedis",
    description:
      "Photography portfolio of Edgar Gionedis, featuring travel, landscape, street, and personal photography.",
    url: "/gallery",
    type: "website"
  }
};

export default async function GalleryPage() {
  const photos = await getGalleryPhotos();
  return (
    <div className="max-w-screen-2xl mx-auto px-6">
      <JustifiedGallery photos={photos} />
    </div>
  );
}
