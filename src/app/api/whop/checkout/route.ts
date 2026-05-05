import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { AuthError, requireUser } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase-admin";
import { createWhopCheckout, getWhopCheckoutPlan } from "@/lib/whop";

function getRequestOrigin(request: NextRequest): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");

  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  return forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : "https://creations3d--creations3d-dev.us-central1.hosted.app";
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const planKey = typeof body.plan === "string" ? body.plan : "";
    const plan = getWhopCheckoutPlan(planKey);

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const origin = getRequestOrigin(request);
    const checkout = await createWhopCheckout({
      planKey: plan.key,
      userId: user.uid,
      email: user.email || undefined,
      redirectUrl: `${origin}/dashboard?checkout=return&plan=${plan.key}`,
      sourceUrl: request.headers.get("referer") || `${origin}/pricing`,
    });

    await adminDb()
      .collection("whopCheckouts")
      .doc(checkout.checkoutId)
      .set({
        provider: "whop",
        userId: user.uid,
        email: user.email || null,
        plan: plan.key,
        credits: plan.credits,
        priceUsd: plan.priceUsd,
        purchaseType: plan.kind,
        purchaseId: checkout.purchaseId,
        checkoutId: checkout.checkoutId,
        planId: checkout.planId,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      purchaseUrl: checkout.purchaseUrl,
      checkoutId: checkout.checkoutId,
      purchaseId: checkout.purchaseId,
      planId: checkout.planId,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Whop checkout creation failed", error);
    return NextResponse.json(
      { error: "We couldn't open checkout. Try again in a moment." },
      { status: 500 }
    );
  }
}
