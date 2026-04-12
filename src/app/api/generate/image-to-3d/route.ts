import { NextRequest, NextResponse } from "next/server";
import { imageTo3D } from "@/lib/replicate";

export async function POST(request: NextRequest) {
  try {
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

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to generate 3D model: ${errorMessage}` },
      { status: 500 }
    );
  }
}
