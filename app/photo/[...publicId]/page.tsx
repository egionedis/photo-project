import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildImageUrl, getPhotoByPublicId } from "@/lib/cloudinary-client";
import { PhotoDetailClient } from "@/components/photo-detail-client";
import { getPhotoDescription, getPhotoTitle } from "@/lib/photo-text";

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

  const title = getPhotoTitle(photo);
  const description = getPhotoDescription(photo);

  return {
    title: `${title} | Edgar Gionedis`,
    description: description || `Photo tagged: ${photo.tags.join(", ")}`,
    openGraph: {
      title,
      description: description || undefined,
      type: "article",
      images: [
        {
          url: buildImageUrl(photo.publicId),
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
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
