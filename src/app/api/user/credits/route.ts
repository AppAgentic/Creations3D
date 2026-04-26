import { NextRequest, NextResponse } from "next/server";
import {
  getCreditState,
  InsufficientCreditsError,
  reserveCredits,
} from "@/lib/credits";
import { AuthError, getErrorMessage, requireUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const creditState = await getCreditState(user.uid);

    return NextResponse.json(creditState);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Get credits error:", error);

    return NextResponse.json(
      { error: `Failed to get credits: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const amount = Number(body.amount || 1);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Credit amount must be a positive number" },
        { status: 400 }
      );
    }

    const result = await reserveCredits({
      userId: user.uid,
      amount,
      reason: body.reason || "manual-credit-use",
      generationId: body.generationId,
    });

    return NextResponse.json({
      success: true,
      creditsUsed: amount,
      remainingCredits: result.remainingCredits,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: error.message,
          credits: error.currentCredits,
          requiredCredits: error.requiredCredits,
        },
        { status: 402 }
      );
    }

    console.error("Use credits error:", error);

    return NextResponse.json(
      { error: `Failed to use credits: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
