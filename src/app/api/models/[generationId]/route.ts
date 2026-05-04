import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getSignedDownloadUrl } from "@/lib/r2";
import { AuthError, requireUser } from "@/lib/server-auth";
import { createModelTitle } from "@/lib/model-metadata";
import { createModelFileToken } from "@/lib/model-file-token";

type FirestoreTimestampLike = {
  toDate?: () => Date;
  seconds?: number;
};

function toIsoDate(value: unknown): string | null {
  if (!value) return null;

  const timestamp = value as FirestoreTimestampLike;

  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp.seconds)
    return new Date(timestamp.seconds * 1000).toISOString();
  if (typeof value === "string") return value;

  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ generationId: string }> }
) {
  try {
    const user = await requireUser(request);
    const { generationId } = await context.params;

    const doc = await adminDb()
      .collection("generations")
      .doc(generationId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const data = doc.data() || {};

    if (data.userId !== user.uid || data.status === "deleted") {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const key = typeof data.savedKey === "string" ? data.savedKey : "";
    const url = key
      ? await getSignedDownloadUrl(key)
      : ((data.savedUrl || data.modelUrl) as string | undefined);
    const viewerUrl = key ? `/api/models/${generationId}/file` : url;

    if (!url) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      model: {
        generationId,
        key: key || generationId,
        url,
        viewerUrl,
        size: data.size || null,
        format: data.format || "glb",
        status: data.status || "generated",
        title: data.title || createModelTitle(data.prompt, "3D model"),
        prompt: data.prompt || null,
        type: data.type || null,
        providerModel: data.providerModel || null,
        previewUrl: data.previewUrl || null,
        creditsUsed: data.creditsUsed || 0,
        createdAt: toIsoDate(data.createdAt),
        savedAt: toIsoDate(data.savedAt),
        completedAt: toIsoDate(data.completedAt),
      },
    });

    if (key) {
      response.cookies.set({
        name: `model_file_${generationId}`,
        value: createModelFileToken({
          generationId,
          userId: user.uid,
        }),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: `/api/models/${generationId}/file`,
        maxAge: 60 * 60,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Model detail error:", error);

    return NextResponse.json(
      { error: "We couldn't load that model. Try again in a moment." },
      { status: 500 }
    );
  }
}
