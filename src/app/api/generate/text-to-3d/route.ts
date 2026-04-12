import { NextRequest, NextResponse } from "next/server";
import { textTo3D } from "@/lib/replicate";
import { authenticateRequest, isAuthError } from "@/lib/auth";
import { deductCredits } from "@/lib/credits";

const CREDIT_COST = 1;

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await authenticateRequest(request);
    if (isAuthError(authResult)) return authResult;
    const { uid: userId } = authResult;

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

    // Check and deduct credits atomically before generation
    const creditResult = await deductCredits(userId, CREDIT_COST);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: "Insufficient credits", credits: creditResult.currentCredits },
        { status: 402 }
      );
    }

    // Generate 3D model using Replicate
    const result = await textTo3D({ prompt });

    if (!result.modelUrl) {
      return NextResponse.json(
        { error: "Failed to generate model - no output received" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      modelUrl: result.modelUrl,
      format: result.format,
    });
  } catch (error) {
    console.error("Text to 3D error:", error);
    return NextResponse.json(
      { error: "Failed to generate 3D model. Please try again." },
      { status: 500 }
    );
  }
}
