import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { refundCredits } from "@/lib/credits";
import { adminDb } from "@/lib/firebase-admin";
import {
  markGenerationFailed,
  updateGenerationRecord,
} from "@/lib/generation-records";
import { getTextTo3DPredictionResult } from "@/lib/replicate";
import { AuthError, requireUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get("generationId");

    if (!generationId) {
      return NextResponse.json(
        { error: "Generation ID is required." },
        { status: 400 }
      );
    }

    const db = adminDb();
    const generationRef = db.collection("generations").doc(generationId);
    const generationDoc = await generationRef.get();

    if (!generationDoc.exists) {
      return NextResponse.json(
        { error: "Generation not found." },
        { status: 404 }
      );
    }

    const generation = generationDoc.data() || {};

    if (generation.userId !== user.uid) {
      return NextResponse.json(
        { error: "Generation not found." },
        { status: 404 }
      );
    }

    if (generation.status === "generated" || generation.status === "saved") {
      return NextResponse.json({
        success: true,
        status: "generated",
        generationId,
        modelUrl: generation.modelUrl,
        format: generation.format || "glb",
        previewUrl: generation.previewUrl || null,
      });
    }

    if (generation.status === "failed") {
      return NextResponse.json({
        success: false,
        status: "failed",
        generationId,
        error:
          "We couldn't generate that model. Your credit was refunded automatically.",
      });
    }

    if (
      generation.type !== "text-to-3d" ||
      generation.provider !== "replicate" ||
      !generation.predictionId
    ) {
      return NextResponse.json({
        success: true,
        status: generation.status || "processing",
        generationId,
      });
    }

    const result = await getTextTo3DPredictionResult(generation.predictionId);

    if (result.status === "succeeded") {
      if (!result.modelUrl) {
        throw new Error("Prediction completed without a model URL.");
      }

      await updateGenerationRecord(generationId, {
        status: "generated",
        providerStatus: result.status,
        modelUrl: result.modelUrl,
        format: result.format,
        previewUrl: result.previewUrl || null,
        completedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        status: "generated",
        generationId,
        modelUrl: result.modelUrl,
        format: result.format,
        previewUrl: result.previewUrl || null,
      });
    }

    if (result.status === "failed" || result.status === "canceled") {
      await markGenerationFailed(
        generationId,
        result.error || "Prediction did not complete."
      );

      if (!generation.refundedAt && generation.creditsUsed > 0) {
        await refundCredits({
          userId: user.uid,
          amount: generation.creditsUsed,
          reason: "text-to-3d-failed",
          generationId,
        });
        await updateGenerationRecord(generationId, {
          refundedAt: FieldValue.serverTimestamp(),
        });
      }

      return NextResponse.json({
        success: false,
        status: "failed",
        generationId,
        error:
          "We couldn't generate that model. Your credit was refunded automatically.",
      });
    }

    await updateGenerationRecord(generationId, {
      providerStatus: result.status,
    });

    return NextResponse.json({
      success: true,
      status: "processing",
      providerStatus: result.status,
      generationId,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Generation status error:", error);
    return NextResponse.json(
      { error: "We couldn't check that generation. Try again in a moment." },
      { status: 500 }
    );
  }
}
