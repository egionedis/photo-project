import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildImageUrl, getPhotoByPublicId } from "@/lib/cloudinary";
import { formatPhotoDate, getPhotoDisplayDateValue } from "@/lib/photo-date";

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

  const cameraRows = [
    { label: "Camera", value: photo.camera?.model },
    { label: "Lens", value: photo.camera?.lens },
    { label: "Focal length", value: photo.camera?.focalLength },
    { label: "Aperture", value: photo.camera?.aperture },
    { label: "Shutter", value: photo.camera?.shutter },
    { label: "ISO", value: photo.camera?.iso }
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  return (
    <article className="stack" style={{ gap: "1.2rem" }}>
      <h1 style={{ margin: 0 }}>{photo.title}</h1>
      <div className="card" style={{ overflow: "hidden" }}>
        <Image
          src={photo.secureUrl}
          alt={photo.title}
          width={1600}
          height={1200}
          priority
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
      <div className="card" style={{ padding: "1rem" }}>
        <p style={{ marginTop: 0 }}>{photo.description || "No description provided."}</p>
        <p>
          <strong>Date:</strong> {formatPhotoDate(getPhotoDisplayDateValue(photo))}
        </p>
        {cameraRows.map((row) => (
          <p key={row.label}>
            <strong>{row.label}:</strong> {row.value}
          </p>
        ))}
        <p style={{ marginBottom: 0 }}>
          <strong>Tags:</strong> {photo.tags.length ? photo.tags.join(", ") : "None"}
        </p>
      </div>
    </article>
  );
}
