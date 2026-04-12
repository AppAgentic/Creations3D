import { NextRequest, NextResponse } from "next/server";
import { textTo3D } from "@/lib/replicate";

export async function POST(request: NextRequest) {
  try {
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

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to generate 3D model: ${errorMessage}` },
      { status: 500 }
    );
  }
}
