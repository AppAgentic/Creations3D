import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { deleteFile } from "@/lib/r2";
import { AuthError, getErrorMessage, requireUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { generationId } = await request.json();

    if (!generationId || typeof generationId !== "string") {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    const generationRef = adminDb().collection("generations").doc(generationId);
    const generationDoc = await generationRef.get();

    if (!generationDoc.exists || generationDoc.data()?.userId !== user.uid) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      );
    }

    const data = generationDoc.data();
    const savedKey = data?.savedKey;

    if (typeof savedKey === "string" && savedKey) {
      await deleteFile(savedKey);
    }

    await generationRef.set(
      {
        status: "deleted",
        deletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      generationId,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Delete model error:", error);

    return NextResponse.json(
      { error: `Failed to delete model: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
