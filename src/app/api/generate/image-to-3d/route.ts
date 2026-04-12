import { NextRequest, NextResponse } from "next/server";
import { imageTo3D } from "@/lib/replicate";
import { authenticateRequest, isAuthError } from "@/lib/auth";
import { deductCredits } from "@/lib/credits";

const CREDIT_COST = 1;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await authenticateRequest(request);
    if (isAuthError(authResult)) return authResult;
    const { uid: userId } = authResult;

    // Handle both JSON and FormData
    const contentType = request.headers.get("content-type") || "";

    let imageUrl: string;

    if (contentType.includes("application/json")) {
      // JSON body with image URL
      const body = await request.json();
      imageUrl = body.imageUrl;
    } else if (contentType.includes("multipart/form-data")) {
      // FormData with image file - convert to base64 data URL
      const formData = await request.formData();
      const imageFile = formData.get("image") as File | null;

      if (!imageFile) {
        return NextResponse.json(
          { error: "Image file is required" },
          { status: 400 }
        );
      }

      // Validate file size
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Image file too large (max 10MB)" },
          { status: 400 }
        );
      }

      // Validate MIME type
      if (!imageFile.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "File must be an image" },
          { status: 400 }
        );
      }

      // Convert file to base64 data URL for Replicate
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = imageFile.type || "image/png";
      imageUrl = `data:${mimeType};base64,${base64}`;
    } else {
      return NextResponse.json(
        { error: "Invalid content type. Use application/json or multipart/form-data" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL or file is required" },
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

    // Generate 3D model using Replicate (TRELLIS)
    const result = await imageTo3D({ imageUrl });

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
      previewUrl: result.previewUrl,
    });
  } catch (error) {
    console.error("Image to 3D error:", error);
    return NextResponse.json(
      { error: "Failed to generate 3D model. Please try again." },
      { status: 500 }
    );
  }
}
