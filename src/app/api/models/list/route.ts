import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedDownloadUrl } from "@/lib/r2";
import { authenticateRequest, isAuthError } from "@/lib/auth";

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
    // Require authentication — derive userId server-side
    const authResult = await authenticateRequest(request);
    if (isAuthError(authResult)) return authResult;
    const { uid: userId } = authResult;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

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
    return NextResponse.json(
      { error: "Failed to list models" },
      { status: 500 }
    );
  }
}
