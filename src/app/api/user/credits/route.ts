import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const db = adminDb();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      // New user - return default credits
      return NextResponse.json({
        credits: 5, // Free trial credits
        plan: "free",
        subscriptionStatus: null,
      });
    }

    const userData = userDoc.data();

    return NextResponse.json({
      credits: userData?.credits || 0,
      plan: userData?.plan || "free",
      subscriptionStatus: userData?.subscriptionStatus || null,
    });
  } catch (error) {
    console.error("Get credits error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to get credits: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Use a credit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount = 1 } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const db = adminDb();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    const currentCredits = userDoc.exists ? userDoc.data()?.credits || 0 : 5;

    if (currentCredits < amount) {
      return NextResponse.json(
        { error: "Insufficient credits", credits: currentCredits },
        { status: 402 }
      );
    }

    // Deduct credits
    const { FieldValue } = await import("firebase-admin/firestore");
    await userRef.set(
      {
        credits: FieldValue.increment(-amount),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      creditsUsed: amount,
      remainingCredits: currentCredits - amount,
    });
  } catch (error) {
    console.error("Use credits error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to use credits: ${errorMessage}` },
      { status: 500 }
    );
  }
}
