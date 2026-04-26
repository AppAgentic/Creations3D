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
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Credit amounts for each plan
const PLAN_CREDITS: Record<string, number> = {
  basic: 50,
  creator: 50,
  pro: 150,
  studio: 150,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function getFirebaseUid(data: Record<string, unknown>): string | null {
  const metadata = asRecord(data.metadata);
  const checkoutMetadata = asRecord(data.checkoutMetadata);
  const checkoutMetadataSnake = asRecord(data.checkout_metadata);
  const membership = asRecord(data.membership);
  const membershipMetadata = asRecord(membership.metadata);
  const user = asRecord(data.user);
  const userMetadata = asRecord(user.metadata);

  return (
    readString(metadata.firebase_uid) ||
    readString(metadata.firebaseUid) ||
    readString(checkoutMetadataSnake.firebase_uid) ||
    readString(checkoutMetadata.firebaseUid) ||
    readString(membershipMetadata.firebase_uid) ||
    readString(userMetadata.firebase_uid) ||
    readString(userMetadata.firebaseUid) ||
    readString(user.external_id) ||
    readString(data.firebase_uid) ||
    null
  );
}

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
        const firebaseUid = getFirebaseUid(data);

        if (!firebaseUid) {
          console.error("Whop webhook missing Firebase UID metadata");
          return NextResponse.json(
            { error: "Missing Firebase UID metadata" },
            { status: 400 }
          );
        }

        const whopUserId = user.id;
        const planId = plan?.id?.toLowerCase() || "basic";
        const credits = PLAN_CREDITS[planId] || 50;

        const userRef = db.collection("users").doc(firebaseUid);
        await userRef.set(
          {
            whopUserId,
            email: user.email,
            plan: planId,
            credits: FieldValue.increment(credits),
            subscriptionStatus: "active",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        await db.collection("creditEvents").add({
          userId: firebaseUid,
          whopUserId,
          type: "credit",
          amount: credits,
          reason: "whop-membership-valid",
          plan: planId,
          createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`User ${firebaseUid} subscribed to ${planId}, added ${credits} credits`);
        break;
      }

      case "membership.went_invalid": {
        // Subscription cancelled or expired
        const { user } = data;
        const firebaseUid = getFirebaseUid(data);

        if (!firebaseUid) {
          console.error("Whop webhook missing Firebase UID metadata");
          return NextResponse.json(
            { error: "Missing Firebase UID metadata" },
            { status: 400 }
          );
        }

        const userRef = db.collection("users").doc(firebaseUid);
        await userRef.update({
          whopUserId: user.id,
          subscriptionStatus: "cancelled",
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`User ${firebaseUid} subscription cancelled`);
        break;
      }

      case "payment.succeeded": {
        // One-time payment (e.g., credit pack purchase)
        const { user, product } = data;
        const firebaseUid = getFirebaseUid(data);

        if (!firebaseUid) {
          console.error("Whop webhook missing Firebase UID metadata");
          return NextResponse.json(
            { error: "Missing Firebase UID metadata" },
            { status: 400 }
          );
        }

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
          const userRef = db.collection("users").doc(firebaseUid);
          await userRef.set({
            whopUserId: user.id,
            email: user.email,
            credits: FieldValue.increment(credits),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          await db.collection("creditEvents").add({
            userId: firebaseUid,
            whopUserId: user.id,
            type: "credit",
            amount: credits,
            reason: "whop-payment-succeeded",
            productName,
            createdAt: FieldValue.serverTimestamp(),
          });

          console.log(`User ${firebaseUid} purchased ${credits} credits`);
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
