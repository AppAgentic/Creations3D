import { NextRequest, NextResponse } from "next/server";
import { generateFileKey, uploadFile } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelUrl, format = "glb", userId = "anonymous" } = body;

    if (!modelUrl) {
      return NextResponse.json(
        { error: "Model URL is required" },
        { status: 400 }
      );
    }

    // Generate a unique key for the model
    const generationId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Download the model from the temporary URL and upload to R2
    const response = await fetch(modelUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch model from URL" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = format === "obj" ? "model/obj" : "model/gltf-binary";
    const key = generateFileKey(userId, "model", format);

    const result = await uploadFile(key, buffer, contentType);

    return NextResponse.json({
      success: true,
      savedUrl: result.url,
      key: result.key,
      generationId,
    });
  } catch (error) {
    console.error("Save model error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to save model: ${errorMessage}` },
      { status: 500 }
    );
  }
}
