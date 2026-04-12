import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize R2 client
// Cloudflare R2 is S3-compatible, so we use the AWS SDK
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "creations3d-models";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

export interface UploadResult {
  key: string;
  url: string;
}

// Upload a file to R2
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<UploadResult> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);

  return {
    key,
    url: PUBLIC_URL ? `${PUBLIC_URL}/${key}` : await getSignedDownloadUrl(key),
  };
}

// Upload a 3D model from URL
export async function uploadModelFromUrl(
  modelUrl: string,
  userId: string,
  generationId: string
): Promise<UploadResult> {
  const response = await fetch(modelUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  const key = `models/${userId}/${generationId}.glb`;
  return uploadFile(key, buffer, "model/gltf-binary");
}

// Get a signed URL for downloading
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

// Delete a file from R2
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

// Generate a unique file key
export function generateFileKey(
  userId: string,
  type: "model" | "image",
  extension: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}s/${userId}/${timestamp}-${random}.${extension}`;
}

export { r2Client };
