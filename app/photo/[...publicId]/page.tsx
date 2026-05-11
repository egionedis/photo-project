import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildImageUrl, getPhotoByPublicId } from "@/lib/cloudinary";
import { PhotoDetailClient } from "@/components/photo-detail-client";

type PhotoPageProps = {
  params: Promise<{
    publicId: string[];
  }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const joinedPublicId = (await params).publicId.join("/");
  const photo = await getPhotoByPublicId(joinedPublicId);
  if (!photo) {
    return { title: "Photo not found" };
  }

  return {
    title: `${photo.title} | Personal Photography`,
    description: photo.description || `Photo tagged: ${photo.tags.join(", ")}`,
    openGraph: {
      title: photo.title,
      description: photo.description || undefined,
      type: "article",
      images: [
        {
          url: buildImageUrl(photo.publicId),
          alt: photo.title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: photo.title,
      description: photo.description || undefined,
      images: [buildImageUrl(photo.publicId)]
    }
  };
}

export default async function PhotoDetailPage({ params }: PhotoPageProps) {
  const joinedPublicId = (await params).publicId.join("/");
  const photo = await getPhotoByPublicId(joinedPublicId);

  if (!photo) {
    notFound();
  }

  return <PhotoDetailClient photo={photo} />;
}
