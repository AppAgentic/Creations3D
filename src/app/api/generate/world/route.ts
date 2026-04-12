import { NextRequest, NextResponse } from "next/server";
import {
  generateWorld,
  getOperationStatus,
  getModelCreditCost,
  prepareMediaUpload,
  uploadMedia,
  WorldModel,
} from "@/lib/worldlabs";
import { authenticateRequest, isAuthError } from "@/lib/auth";
import { deductCredits } from "@/lib/credits";

export const maxDuration = 300; // 5 minutes for long-running generations

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await authenticateRequest(request);
    if (isAuthError(authResult)) return authResult;
    const { uid: userId } = authResult;

    const contentType = request.headers.get("content-type") || "";

    let type: "text" | "image";
    let prompt: string | undefined;
    let imageUrl: string | undefined;
    let model: "mini" | "plus";
    let displayName: string | undefined;

    if (contentType.includes("application/json")) {
      // JSON body
      const body = await request.json();
      // Type-safe narrowing: only accept "text" or "image"
      const rawType = body.type;
      type = rawType === "text" ? "text" : "image";
      prompt = body.prompt;
      imageUrl = body.imageUrl;
      model = body.model === "mini" ? "mini" : "plus";
      displayName = body.displayName;
    } else if (contentType.includes("multipart/form-data")) {
      // FormData with image file
      const formData = await request.formData();
      const rawType = formData.get("type") as string;
      type = rawType === "text" ? "text" : "image";
      prompt = formData.get("prompt") as string | undefined;
      model = (formData.get("model") as string) === "mini" ? "mini" : "plus";
      displayName = formData.get("displayName") as string | undefined;

      const imageFile = formData.get("image") as File | null;

      if (imageFile) {
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

    // Get credit cost
    const creditCost = getModelCreditCost(worldModel);

    // Check and deduct credits atomically before generation
    const creditResult = await deductCredits(userId, creditCost);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: "Insufficient credits", credits: creditResult.currentCredits },
        { status: 402 }
      );
    }

    // Start world generation
    const operationId = await generateWorld({
      displayName: displayName || `World - ${new Date().toISOString()}`,
      type,
      textPrompt: prompt,
      imageUrl,
      model: worldModel,
    });

    // P1 fix: For Plus model, return operation ID for client-side polling
    // instead of blocking the server connection for 10 minutes.
    // Mini model (30-45s) can still wait within the 5-min maxDuration.
    if (model === "plus") {
      return NextResponse.json({
        success: true,
        async: true,
        operationId,
        creditCost,
        message: "World generation started. Poll /api/generate/world/status for results.",
      });
    }

    // For mini model, poll server-side with a safe timeout (2 min)
    const maxWaitMs = 120000;
    const pollIntervalMs = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await getOperationStatus(operationId);

      if (status.error) {
        return NextResponse.json(
          { error: "World generation failed. Please try again." },
          { status: 500 }
        );
      }

      if (status.done && status.result) {
        return NextResponse.json({
          success: true,
          worldId: status.result.worldId,
          viewerUrl: status.result.viewerUrl,
          creditCost,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    // Timeout — return operation ID so client can continue polling
    return NextResponse.json({
      success: true,
      async: true,
      operationId,
      creditCost,
      message: "Generation in progress. Poll for status.",
    });
  } catch (error) {
    console.error("World generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate world. Please try again." },
      { status: 500 }
    );
  }
}
