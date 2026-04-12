import { NextRequest, NextResponse } from "next/server";
import {
  generateWorld,
  waitForWorldGeneration,
  getModelCreditCost,
  prepareMediaUpload,
  uploadMedia,
  WorldModel,
} from "@/lib/worldlabs";

export const maxDuration = 300; // 5 minutes for long-running generations

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let type: "text" | "image";
    let prompt: string | undefined;
    let imageUrl: string | undefined;
    let model: "mini" | "plus";
    let displayName: string | undefined;

    if (contentType.includes("application/json")) {
      // JSON body
      const body = await request.json();
      type = body.type;
      prompt = body.prompt;
      imageUrl = body.imageUrl;
      model = body.model || "plus";
      displayName = body.displayName;
    } else if (contentType.includes("multipart/form-data")) {
      // FormData with image file
      const formData = await request.formData();
      type = (formData.get("type") as string) || "image";
      prompt = formData.get("prompt") as string | undefined;
      model = (formData.get("model") as "mini" | "plus") || "plus";
      displayName = formData.get("displayName") as string | undefined;

      const imageFile = formData.get("image") as File | null;

      if (imageFile) {
        // Upload image to World Labs and get URL
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const { uploadUrl, mediaUrl } = await prepareMediaUpload(
          imageFile.name || "image.png",
          imageFile.type || "image/png"
        );
        await uploadMedia(uploadUrl, buffer, imageFile.type || "image/png");
        imageUrl = mediaUrl;
      }
    } else {
      return NextResponse.json(
        { error: "Invalid content type. Use application/json or multipart/form-data" },
        { status: 400 }
      );
    }

    // Validate input
    if (type === "text" && !prompt) {
      return NextResponse.json(
        { error: "Prompt is required for text-to-world generation" },
        { status: 400 }
      );
    }

    if (type === "image" && !imageUrl) {
      return NextResponse.json(
        { error: "Image is required for image-to-world generation" },
        { status: 400 }
      );
    }

    if (prompt && prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    // Map model shorthand to full name
    const worldModel: WorldModel =
      model === "mini" ? "Marble 0.1-mini" : "Marble 0.1-plus";

    // Get credit cost for logging/future use
    const creditCost = getModelCreditCost(worldModel);

    // TODO: Check user credits here when auth is integrated
    // const userId = ... // Get from auth
    // const hasCredits = await checkUserCredits(userId, creditCost);
    // if (!hasCredits) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });

    // Start world generation
    const operationId = await generateWorld({
      displayName: displayName || `World - ${new Date().toISOString()}`,
      type,
      textPrompt: prompt,
      imageUrl,
      model: worldModel,
    });

    // Wait for completion (this can take 30s to 5min depending on model)
    const result = await waitForWorldGeneration(
      operationId,
      model === "mini" ? 120000 : 600000 // 2 min for mini, 10 min for plus
    );

    // TODO: Deduct credits after successful generation
    // await deductCredits(userId, creditCost);

    return NextResponse.json({
      success: true,
      worldId: result.worldId,
      viewerUrl: result.viewerUrl,
      thumbnailUrl: result.thumbnailUrl,
      caption: result.caption,
      assets: result.assets,
      creditCost,
    });
  } catch (error) {
    console.error("World generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to generate world: ${errorMessage}` },
      { status: 500 }
    );
  }
}
