import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedDownloadUrl } from "@/lib/r2";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "creations3d-models";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "anonymous";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `models/${userId}/`,
      MaxKeys: limit,
    });

    const response = await r2Client.send(command);

    const models = await Promise.all(
      (response.Contents || []).map(async (item) => {
        const key = item.Key || "";
        const url = await getSignedDownloadUrl(key);

        return {
          key,
          url,
          size: item.Size,
          lastModified: item.LastModified,
          format: key.endsWith(".obj") ? "obj" : "glb",
        };
      })
    );

    // Sort by most recent first
    models.sort((a, b) => {
      const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      models,
      count: models.length,
    });
  } catch (error) {
    console.error("List models error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to list models: ${errorMessage}` },
      { status: 500 }
    );
  }
}
