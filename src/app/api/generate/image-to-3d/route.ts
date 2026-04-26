import { NextRequest, NextResponse } from "next/server";
import { imageTo3D } from "@/lib/replicate";
import {
  InsufficientCreditsError,
  refundCredits,
  reserveCredits,
} from "@/lib/credits";
import {
  createGenerationRecord,
  markGenerationFailed,
  updateGenerationRecord,
} from "@/lib/generation-records";
import { adminDb } from "@/lib/firebase-admin";
import { AuthError, getErrorMessage, requireUser } from "@/lib/server-auth";
import { FieldValue } from "firebase-admin/firestore";

const CREDIT_COST = 1;

export async function POST(request: NextRequest) {
  let generationId: string | null = null;
  let userId: string | null = null;
  let creditsReserved = false;

  try {
    const user = await requireUser(request);
    userId = user.uid;

    const contentType = request.headers.get("content-type") || "";
    let imageUrl: string;
    let imageMetadata: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageUrl = body.imageUrl;
      imageMetadata = { inputType: "url" };
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const imageFile = formData.get("image") as File | null;

      if (!imageFile) {
        return NextResponse.json(
          { error: "Image file is required" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = imageFile.type || "image/png";
      imageUrl = `data:${mimeType};base64,${base64}`;
      imageMetadata = {
        inputType: "upload",
        fileName: imageFile.name || null,
        fileSize: imageFile.size,
        mimeType,
      };
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid content type. Use application/json or multipart/form-data",
        },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL or file is required" },
        { status: 400 }
      );
    }

    generationId = adminDb().collection("generations").doc().id;

    const creditReservation = await reserveCredits({
      userId,
      amount: CREDIT_COST,
      reason: "image-to-3d",
      generationId,
    });
    creditsReserved = true;

    await createGenerationRecord({
      generationId,
      userId,
      type: "image-to-3d",
      provider: "replicate",
      creditsUsed: CREDIT_COST,
      input: imageMetadata,
    });

    const result = await imageTo3D({ imageUrl });

    if (!result.modelUrl) {
      throw new Error("Failed to generate model - no output received");
    }

    await updateGenerationRecord(generationId, {
      status: "generated",
      modelUrl: result.modelUrl,
      format: result.format,
      previewUrl: result.previewUrl || null,
      completedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      generationId,
      modelUrl: result.modelUrl,
      format: result.format,
      previewUrl: result.previewUrl,
      creditsUsed: CREDIT_COST,
      remainingCredits: creditReservation.remainingCredits,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: error.message,
          credits: error.currentCredits,
          requiredCredits: error.requiredCredits,
        },
        { status: error.status }
      );
    }

    const errorMessage = getErrorMessage(error);
    console.error("Image to 3D error:", error);

    if (generationId) {
      await markGenerationFailed(generationId, errorMessage);
    }

    if (creditsReserved && userId) {
      await refundCredits({
        userId,
        amount: CREDIT_COST,
        reason: "image-to-3d-failed",
        generationId: generationId || undefined,
      });
    }

    return NextResponse.json(
      { error: `Failed to generate 3D model: ${errorMessage}` },
      { status: 500 }
    );
  }
}
