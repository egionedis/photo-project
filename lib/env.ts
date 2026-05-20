const requiredEnv = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "ADMIN_PASSWORD"
] as const;

type RequiredEnv = (typeof requiredEnv)[number];

function readEnv(name: RequiredEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function readBooleanEnv(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

const allowSelfSignedTls = readBooleanEnv("ALLOW_SELF_SIGNED_TLS");

if (allowSelfSignedTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export const env = {
  cloudinaryCloudName: readEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: readEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: readEnv("CLOUDINARY_API_SECRET"),
  adminPassword: readEnv("ADMIN_PASSWORD"),
  allowSelfSignedTls
};
