import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

// Verify Whop webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Credit amounts for each plan
const PLAN_CREDITS: Record<string, number> = {
  basic: 50,
  pro: 150,
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("whop-signature") || "";
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET || "";

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    const { action, data } = event;

    const db = adminDb();

    switch (action) {
      case "membership.went_valid": {
        // User subscribed or renewed
        const { user, plan } = data;
        const userId = user.id;
        const planId = plan?.id?.toLowerCase() || "basic";
        const credits = PLAN_CREDITS[planId] || 50;

        const userRef = db.collection("users").doc(userId);
        await userRef.set(
          {
            whopUserId: userId,
            email: user.email,
            plan: planId,
            credits: FieldValue.increment(credits),
            subscriptionStatus: "active",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(`User ${userId} subscribed to ${planId}, added ${credits} credits`);
        break;
      }

      case "membership.went_invalid": {
        // Subscription cancelled or expired
        const { user } = data;
        const userId = user.id;

        const userRef = db.collection("users").doc(userId);
        await userRef.update({
          subscriptionStatus: "cancelled",
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`User ${userId} subscription cancelled`);
        break;
      }

      case "payment.succeeded": {
        // One-time payment (e.g., credit pack purchase)
        const { user, product } = data;
        const userId = user.id;

        // Determine credits based on product
        let credits = 0;
        const productName = product?.name?.toLowerCase() || "";

        if (productName.includes("10 credits")) {
          credits = 10;
        } else if (productName.includes("50 credits")) {
          credits = 50;
        } else if (productName.includes("100 credits")) {
          credits = 100;
        }

        if (credits > 0) {
          const userRef = db.collection("users").doc(userId);
          await userRef.update({
            credits: FieldValue.increment(credits),
            updatedAt: FieldValue.serverTimestamp(),
          });

          console.log(`User ${userId} purchased ${credits} credits`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook action: ${action}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
