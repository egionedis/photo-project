export type PhotoCamera = {
  make?: string;
  model?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
};

export type Photo = {
  publicId: string;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
  sortOrder?: number;
  featured?: boolean;
  takenAt?: string;
  createdAt: string;
  tags: string[];
  secureUrl: string;
  thumbnailUrl: string;
  uploadedAt: string;
  width: number;
  height: number;
  aspectRatio: number;
  camera?: PhotoCamera;
};
