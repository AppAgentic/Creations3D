import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getFileObject } from "@/lib/r2";
import { verifyModelFileToken } from "@/lib/model-file-token";

type RouteContext = {
  params: Promise<{ generationId: string }>;
};

type BodyWithWebStream = {
  transformToWebStream?: () => ReadableStream;
};

function getFallbackContentType(format: unknown) {
  if (format === "obj") return "model/obj";
  if (format === "gltf") return "model/gltf+json";
  return "model/gltf-binary";
}

function toReadableStream(body: unknown) {
  if (!body) return null;

  if (body instanceof ReadableStream) {
    return body;
  }

  const webBody = body as BodyWithWebStream;
  if (webBody.transformToWebStream) {
    return webBody.transformToWebStream();
  }

  return Readable.toWeb(body as Readable) as ReadableStream;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { generationId } = await context.params;
    const token =
      request.cookies.get(`model_file_${generationId}`)?.value || null;

    const doc = await adminDb()
      .collection("generations")
      .doc(generationId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const data = doc.data() || {};
    const key = typeof data.savedKey === "string" ? data.savedKey : "";
    const userId = typeof data.userId === "string" ? data.userId : "";

    if (!key || !userId || data.status === "deleted") {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    if (!verifyModelFileToken({ token, generationId, userId })) {
      return NextResponse.json({ error: "Link expired" }, { status: 401 });
    }

    const object = await getFileObject(key);
    const stream = toReadableStream(object.Body);

    if (!stream) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return new NextResponse(stream, {
      headers: {
        "Content-Type":
          object.ContentType || getFallbackContentType(data.format),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Model file stream error:", error);

    return NextResponse.json(
      { error: "We couldn't load that model. Try again in a moment." },
      { status: 500 }
    );
  }
}
