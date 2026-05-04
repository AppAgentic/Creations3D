import { NextRequest, NextResponse } from "next/server";
import {
  createTextTo3DPrediction,
  TEXT_TO_3D_PROVIDER_MODEL,
} from "@/lib/replicate";
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

const CREDIT_COST = 1;

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let generationId: string | null = null;
  let userId: string | null = null;
  let creditsReserved = false;

  try {
    const user = await requireUser(request);
    userId = user.uid;

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt too long (max 500 characters)" },
        { status: 400 }
      );
    }

    generationId = adminDb().collection("generations").doc().id;

    const creditReservation = await reserveCredits({
      userId,
      amount: CREDIT_COST,
      reason: "text-to-3d",
      generationId,
    });
    creditsReserved = true;

    await createGenerationRecord({
      generationId,
      userId,
      type: "text-to-3d",
      prompt,
      provider: "replicate",
      creditsUsed: CREDIT_COST,
      input: { promptLength: prompt.length },
    });

    const prediction = await createTextTo3DPrediction({ prompt });

    await updateGenerationRecord(generationId, {
      predictionId: prediction.predictionId,
      providerStatus: prediction.status,
      providerModel: TEXT_TO_3D_PROVIDER_MODEL,
    });

    return NextResponse.json(
      {
        success: true,
        status: "processing",
        generationId,
        predictionId: prediction.predictionId,
        creditsUsed: CREDIT_COST,
        remainingCredits: creditReservation.remainingCredits,
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
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
    console.error("Text to 3D error:", error);

    if (generationId) {
      await markGenerationFailed(generationId, errorMessage);
    }

    if (creditsReserved && userId) {
      await refundCredits({
        userId,
        amount: CREDIT_COST,
        reason: "text-to-3d-failed",
        generationId: generationId || undefined,
      });
    }

    return NextResponse.json(
      {
        error:
          "We couldn't generate that 3D model. Your credit was refunded automatically. Try again with a simpler prompt or contact support if it keeps happening.",
      },
      { status: 500 }
    );
  }
}
