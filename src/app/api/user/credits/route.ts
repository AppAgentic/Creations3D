import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { authenticateRequest, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Authenticate and derive userId server-side
    const authResult = await authenticateRequest(request);
    if (isAuthError(authResult)) return authResult;
    const { uid: userId } = authResult;

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
    return NextResponse.json(
      { error: "Failed to get credits" },
      { status: 500 }
    );
  }
}

// Use a credit — atomic transaction to prevent race conditions
export async function POST(request: NextRequest) {
  try {
    // Authenticate and derive userId server-side
    const authResult = await authenticateRequest(request);
    if (isAuthError(authResult)) return authResult;
    const { uid: userId } = authResult;

    const body = await request.json();
    const { amount = 1 } = body;

    // P0 fix: Validate amount is a positive integer to prevent credit minting
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1 || amount > 100) {
      return NextResponse.json(
        { error: "Amount must be a positive integer between 1 and 100" },
        { status: 400 }
      );
    }

    const db = adminDb();
    const userRef = db.collection("users").doc(userId);

    // P1 fix: Use a Firestore transaction for atomic read-check-write
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const currentCredits = userDoc.exists ? userDoc.data()?.credits || 0 : 5;

      if (currentCredits < amount) {
        return { success: false, credits: currentCredits };
      }

      const { FieldValue } = await import("firebase-admin/firestore");
      transaction.set(
        userRef,
        {
          credits: FieldValue.increment(-amount),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { success: true, remainingCredits: currentCredits - amount };
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Insufficient credits", credits: result.credits },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      creditsUsed: amount,
      remainingCredits: result.remainingCredits,
    });
  } catch (error) {
    console.error("Use credits error:", error);
    return NextResponse.json(
      { error: "Failed to use credits" },
      { status: 500 }
    );
  }
}
