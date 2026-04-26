import { NextRequest, NextResponse } from "next/server";
import { getSignedDownloadUrl } from "@/lib/r2";
import { adminDb } from "@/lib/firebase-admin";
import { AuthError, getErrorMessage, requireUser } from "@/lib/server-auth";

type FirestoreTimestampLike = {
  toDate?: () => Date;
  seconds?: number;
};

function toIsoDate(value: unknown): string | null {
  if (!value) return null;

  const timestamp = value as FirestoreTimestampLike;

  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }

  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const snapshot = await adminDb()
      .collection("generations")
      .where("userId", "==", user.uid)
      .limit(Math.max(limit, 1))
      .get();

    const models = await Promise.all(
      snapshot.docs
        .map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          return {
            id: doc.id,
            ...data,
          } as Record<string, unknown> & { id: string };
        })
        .filter((item) => {
          return (
            item.status !== "deleted" &&
            item.type !== "world" &&
            (item.savedKey || item.savedUrl || item.modelUrl)
          );
        })
        .map(async (item) => {
          const key = (item.savedKey as string | undefined) || "";
          const url = key
            ? await getSignedDownloadUrl(key)
            : ((item.savedUrl || item.modelUrl) as string);
          const createdAt = toIsoDate(item.createdAt);
          const savedAt = toIsoDate(item.savedAt);
          const completedAt = toIsoDate(item.completedAt);

          return {
            generationId: item.id,
            key: key || item.id,
            url,
            size: item.size || null,
            lastModified: savedAt || completedAt || createdAt,
            format: item.format || "glb",
            status: item.status || "generated",
            prompt: item.prompt || null,
            type: item.type,
            creditsUsed: item.creditsUsed || 0,
          };
        })
    );

    models.sort((a, b) => {
      const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      models: models.slice(0, limit),
      count: models.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("List models error:", error);

    return NextResponse.json(
      { error: `Failed to list models: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
