import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

// Verify Whop webhook signature — fail closed on missing secret or mismatched lengths
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Fail closed: reject if secret is not configured
  if (!secret) {
    console.error("WHOP_WEBHOOK_SECRET is not configured");
    return false;
  }

  // Reject empty or missing signatures
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // timingSafeEqual requires same-length buffers — check before calling
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
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
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

    // Fail closed: reject if no webhook secret is configured
    if (!webhookSecret) {
      console.error("WHOP_WEBHOOK_SECRET environment variable is not set");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

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

    // P1 fix: Idempotency — check if this event was already processed
    const eventId = event.id || event.event_id;
    if (eventId) {
      const eventRef = db.collection("processed_webhooks").doc(eventId);
      const eventDoc = await eventRef.get();
      if (eventDoc.exists) {
        console.log(`Webhook event ${eventId} already processed, skipping`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      // Mark as processed
      await eventRef.set({
        action,
        processedAt: FieldValue.serverTimestamp(),
      });
    }

    switch (action) {
      case "membership.went_valid": {
        // User subscribed or renewed
        const { user, plan } = data;
        const whopUserId = user.id;
        const planId = plan?.id?.toLowerCase() || "basic";
        const credits = PLAN_CREDITS[planId] || 50;

        // P1 fix: Use firebase_uid from metadata if available,
        // otherwise fall back to Whop user ID
        const firebaseUid = data.metadata?.firebase_uid || user.metadata?.firebase_uid;
        const docId = firebaseUid || whopUserId;

        const userRef = db.collection("users").doc(docId);
        await userRef.set(
          {
            whopUserId,
            firebaseUid: firebaseUid || null,
            email: user.email,
            plan: planId,
            credits: FieldValue.increment(credits),
            subscriptionStatus: "active",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(`User ${docId} subscribed to ${planId}, added ${credits} credits`);
        break;
      }

      case "membership.went_invalid": {
        // Subscription cancelled or expired
        const { user } = data;
        const whopUserId = user.id;
        const firebaseUid = data.metadata?.firebase_uid || user.metadata?.firebase_uid;
        const docId = firebaseUid || whopUserId;

        const userRef = db.collection("users").doc(docId);
        await userRef.update({
          subscriptionStatus: "cancelled",
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`User ${docId} subscription cancelled`);
        break;
      }

      case "payment.succeeded": {
        // One-time payment (e.g., credit pack purchase)
        const { user, product } = data;
        const whopUserId = user.id;
        const firebaseUid = data.metadata?.firebase_uid || user.metadata?.firebase_uid;
        const docId = firebaseUid || whopUserId;

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
          const userRef = db.collection("users").doc(docId);
          await userRef.set(
            {
              whopUserId,
              firebaseUid: firebaseUid || null,
              credits: FieldValue.increment(credits),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          console.log(`User ${docId} purchased ${credits} credits`);
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
