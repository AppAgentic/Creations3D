import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { generateFileKey, uploadFile } from "@/lib/r2";
import { adminDb } from "@/lib/firebase-admin";
import { updateGenerationRecord } from "@/lib/generation-records";
import { AuthError, requireUser } from "@/lib/server-auth";
import { createModelTitle } from "@/lib/model-metadata";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { modelUrl, generationId } = body;
    const format =
      body.format === "obj" || body.format === "gltf" ? body.format : "glb";

    if (!modelUrl) {
      return NextResponse.json(
        { error: "Model URL is required" },
        { status: 400 }
      );
    }

    let targetGenerationId = generationId as string | undefined;

    if (targetGenerationId) {
      const generationDoc = await adminDb()
        .collection("generations")
        .doc(targetGenerationId)
        .get();

      if (!generationDoc.exists || generationDoc.data()?.userId !== user.uid) {
        return NextResponse.json(
          { error: "Generation not found" },
          { status: 404 }
        );
      }
    } else {
      const generationRef = adminDb().collection("generations").doc();
      targetGenerationId = generationRef.id;
      await generationRef.set({
        userId: user.uid,
        type: "text-to-3d",
        provider: "replicate",
        status: "generated",
        title: createModelTitle(body.prompt),
        modelUrl,
        format,
        creditsUsed: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const response = await fetch(modelUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch model from URL" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType =
      format === "obj"
        ? "model/obj"
        : format === "gltf"
          ? "model/gltf+json"
          : "model/gltf-binary";
    const key = generateFileKey(user.uid, "model", format);

    const result = await uploadFile(key, buffer, contentType);

    await updateGenerationRecord(targetGenerationId, {
      status: "saved",
      savedKey: result.key,
      savedUrl: result.url,
      format,
      size: buffer.length,
      savedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      savedUrl: result.url,
      key: result.key,
      generationId: targetGenerationId,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Save model error:", error);

    return NextResponse.json(
      { error: "We couldn't save that model. Try again in a moment." },
      { status: 500 }
    );
  }
}
