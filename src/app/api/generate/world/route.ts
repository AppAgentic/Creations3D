import { NextRequest, NextResponse } from "next/server";
import {
  generateWorld,
  waitForWorldGeneration,
  getModelCreditCost,
  prepareMediaUpload,
  uploadMedia,
  WorldModel,
} from "@/lib/worldlabs";
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

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let generationId: string | null = null;
  let userId: string | null = null;
  let creditsReserved = false;
  let creditCost = 0;

  try {
    if (!process.env.WORLDLABS_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "3D world generation is not available yet. Text and image model generation are available.",
        },
        { status: 503 }
      );
    }

    const user = await requireUser(request);
    userId = user.uid;

    const contentType = request.headers.get("content-type") || "";

    let type: "text" | "image";
    let prompt: string | undefined;
    let imageUrl: string | undefined;
    let model: "mini" | "plus";
    let displayName: string | undefined;
    let imageFile: File | null = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      type = body.type === "image" ? "image" : "text";
      prompt = body.prompt;
      imageUrl = body.imageUrl;
      model = body.model === "mini" ? "mini" : "plus";
      displayName = body.displayName;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const formType = formData.get("type");
      type = formType === "text" ? "text" : "image";
      prompt = formData.get("prompt") as string | undefined;
      model = formData.get("model") === "mini" ? "mini" : "plus";
      displayName = formData.get("displayName") as string | undefined;
      imageFile = formData.get("image") as File | null;
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid content type. Use application/json or multipart/form-data",
        },
        { status: 400 }
      );
    }

    if (type === "text" && !prompt) {
      return NextResponse.json(
        { error: "Prompt is required for text-to-world generation" },
        { status: 400 }
      );
    }

    if (type === "image" && !imageUrl && !imageFile) {
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

    const worldModel: WorldModel =
      model === "mini" ? "Marble 0.1-mini" : "Marble 0.1-plus";
    creditCost = getModelCreditCost(worldModel);
    generationId = adminDb().collection("generations").doc().id;

    const creditReservation = await reserveCredits({
      userId,
      amount: creditCost,
      reason: "world",
      generationId,
    });
    creditsReserved = true;

    await createGenerationRecord({
      generationId,
      userId,
      type: "world",
      prompt,
      provider: "worldlabs",
      creditsUsed: creditCost,
      input: {
        type,
        model,
        displayName: displayName || null,
        imageFileName: imageFile?.name || null,
        imageFileSize: imageFile?.size || null,
      },
    });

    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const { uploadUrl, mediaUrl } = await prepareMediaUpload(
        imageFile.name || "image.png",
        imageFile.type || "image/png"
      );
      await uploadMedia(uploadUrl, buffer, imageFile.type || "image/png");
      imageUrl = mediaUrl;
    }

    const operationId = await generateWorld({
      displayName: displayName || `World - ${new Date().toISOString()}`,
      type,
      textPrompt: prompt,
      imageUrl,
      model: worldModel,
    });

    await updateGenerationRecord(generationId, {
      operationId,
    });

    const result = await waitForWorldGeneration(
      operationId,
      model === "mini" ? 120000 : 300000
    );

    await updateGenerationRecord(generationId, {
      status: "generated",
      worldId: result.worldId,
      viewerUrl: result.viewerUrl,
      thumbnailUrl: result.thumbnailUrl || null,
      caption: result.caption || null,
      assets: result.assets,
      completedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      generationId,
      worldId: result.worldId,
      viewerUrl: result.viewerUrl,
      thumbnailUrl: result.thumbnailUrl,
      caption: result.caption,
      assets: result.assets,
      creditCost,
      creditsUsed: creditCost,
      remainingCredits: creditReservation.remainingCredits,
    });
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
    console.error("World generation error:", error);

    if (generationId) {
      await markGenerationFailed(generationId, errorMessage);
    }

    if (creditsReserved && userId && creditCost > 0) {
      await refundCredits({
        userId,
        amount: creditCost,
        reason: "world-failed",
        generationId: generationId || undefined,
      });
    }

    return NextResponse.json(
      {
        error:
          "We couldn't generate that 3D world. Your credits were refunded automatically. Try again with a simpler prompt or contact support if it keeps happening.",
      },
      { status: 500 }
    );
  }
}
