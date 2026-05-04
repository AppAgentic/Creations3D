import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { PLAN_CREDIT_COUNTS } from "@/lib/generation-costs";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import crypto from "crypto";

const STANDARD_WEBHOOK_SECRET_PREFIX = "whsec_";
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

const ACTIVE_MEMBERSHIP_EVENTS = new Set([
  "membership.went_valid",
  "membership.activated",
  "membership_activated",
]);

const INACTIVE_MEMBERSHIP_EVENTS = new Set([
  "membership.went_invalid",
  "membership.deactivated",
  "membership_deactivated",
]);

const PLAN_CREDITS: Record<string, number> = {
  basic: PLAN_CREDIT_COUNTS.creator,
  creator: PLAN_CREDIT_COUNTS.creator,
  pro: PLAN_CREDIT_COUNTS.studio,
  studio: PLAN_CREDIT_COUNTS.studio,
};

type WhopEvent = {
  id?: unknown;
  type?: unknown;
  action?: unknown;
  data?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function headersToObject(headers: Headers): Record<string, string> {
  return Object.fromEntries(
    Array.from(headers.entries()).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ])
  );
}

function getWebhookSecretBytes(secret: string): Buffer {
  if (secret.startsWith(STANDARD_WEBHOOK_SECRET_PREFIX)) {
    return Buffer.from(
      secret.slice(STANDARD_WEBHOOK_SECRET_PREFIX.length),
      "base64"
    );
  }

  return Buffer.from(secret, "utf8");
}

function timingSafeEqualString(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyStandardWebhookSignature(
  payload: string,
  headers: Record<string, string>,
  secret: string
): boolean {
  const webhookId = headers["webhook-id"];
  const webhookTimestamp = headers["webhook-timestamp"];
  const webhookSignature = headers["webhook-signature"];

  if (!webhookId || !webhookTimestamp || !webhookSignature || !secret) {
    return false;
  }

  const timestamp = Number(webhookTimestamp);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    now - timestamp > WEBHOOK_TOLERANCE_SECONDS ||
    timestamp > now + WEBHOOK_TOLERANCE_SECONDS
  ) {
    return false;
  }

  const signedPayload = `${webhookId}.${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", getWebhookSecretBytes(secret))
    .update(signedPayload)
    .digest("base64");

  return webhookSignature.split(" ").some((signature) => {
    const [version, value] = signature.split(",");
    return (
      version === "v1" &&
      Boolean(value) &&
      timingSafeEqualString(value, expectedSignature)
    );
  });
}

function verifyLegacyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return timingSafeEqualString(signature, expectedSignature);
}

function verifyWebhookSignature(
  payload: string,
  headers: Headers,
  secret: string
): boolean {
  const headerObject = headersToObject(headers);

  return (
    verifyStandardWebhookSignature(payload, headerObject, secret) ||
    verifyLegacyWebhookSignature(
      payload,
      headerObject["whop-signature"] || headerObject["x-whop-signature"],
      secret
    )
  );
}

function getEventType(event: WhopEvent): string {
  return readString(event.type) || readString(event.action) || "";
}

function getEventId(
  event: WhopEvent,
  data: Record<string, unknown>,
  headers: Headers,
  payload: string
): string {
  return (
    headers.get("webhook-id") ||
    readString(event.id) ||
    readString(data.id) ||
    crypto.createHash("sha256").update(payload).digest("hex")
  );
}

function getWebhookDocId(eventId: string): string {
  return `whop_${crypto.createHash("sha256").update(eventId).digest("hex")}`;
}

function getCreditEventDocId(eventId: string): string {
  return `whop_${crypto.createHash("sha256").update(`credit:${eventId}`).digest("hex")}`;
}

async function claimWebhookEvent(
  db: Firestore,
  eventId: string,
  eventType: string
): Promise<{ claimed: boolean; docId: string }> {
  const docId = getWebhookDocId(eventId);
  const eventRef = db.collection("webhookEvents").doc(docId);

  const claimed = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(eventRef);
    if (existing.exists) {
      return false;
    }

    transaction.create(eventRef, {
      provider: "whop",
      eventId,
      eventType,
      status: "processing",
      receivedAt: FieldValue.serverTimestamp(),
    });

    return true;
  });

  return { claimed, docId };
}

async function markWebhookEvent(
  db: Firestore,
  docId: string,
  status: "processed" | "failed",
  details?: Record<string, unknown>
): Promise<void> {
  await db
    .collection("webhookEvents")
    .doc(docId)
    .set(
      {
        status,
        ...details,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

function getMetadata(data: Record<string, unknown>): Record<string, unknown> {
  const metadata = asRecord(data.metadata);
  const checkoutMetadata = asRecord(data.checkoutMetadata);
  const checkoutMetadataSnake = asRecord(data.checkout_metadata);
  const membership = asRecord(data.membership);
  const membershipMetadata = asRecord(membership.metadata);
  const checkout = asRecord(data.checkout);
  const checkoutMetadataNested = asRecord(checkout.metadata);
  const checkoutConfiguration = asRecord(data.checkout_configuration);
  const checkoutConfigurationMetadata = asRecord(
    checkoutConfiguration.metadata
  );

  return {
    ...checkoutMetadataNested,
    ...checkoutConfigurationMetadata,
    ...checkoutMetadata,
    ...checkoutMetadataSnake,
    ...membershipMetadata,
    ...metadata,
  };
}

function getFirebaseUid(data: Record<string, unknown>): string | null {
  const metadata = getMetadata(data);
  const membership = asRecord(data.membership);
  const membershipMetadata = asRecord(membership.metadata);
  const user = asRecord(data.user);
  const userMetadata = asRecord(user.metadata);

  return (
    readString(metadata.firebase_uid) ||
    readString(metadata.firebaseUid) ||
    readString(membershipMetadata.firebase_uid) ||
    readString(userMetadata.firebase_uid) ||
    readString(userMetadata.firebaseUid) ||
    readString(user.external_id) ||
    readString(data.firebase_uid) ||
    null
  );
}

function getWhopUser(data: Record<string, unknown>): Record<string, unknown> {
  const user = asRecord(data.user);
  const member = asRecord(data.member);
  const customer = asRecord(data.customer);

  return Object.keys(user).length
    ? user
    : Object.keys(member).length
      ? member
      : customer;
}

function getPlanKey(data: Record<string, unknown>): string {
  const metadata = getMetadata(data);
  const plan = asRecord(data.plan);
  const currentPlan = asRecord(data.current_plan);
  const membershipPlan = asRecord(asRecord(data.membership).plan);
  const product = asRecord(data.product);
  const membershipProduct = asRecord(asRecord(data.membership).product);

  const planText = [
    metadata.creations3d_plan,
    metadata.plan,
    metadata.plan_key,
    metadata.tier,
    plan.id,
    plan.name,
    plan.title,
    currentPlan.id,
    currentPlan.name,
    currentPlan.title,
    membershipPlan.id,
    membershipPlan.name,
    membershipPlan.title,
    product.name,
    product.title,
    membershipProduct.name,
    membershipProduct.title,
  ]
    .map((value) => readString(value))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (planText.includes("studio") || planText.includes("pro")) {
    return "studio";
  }

  return "creator";
}

function getPlanCredits(data: Record<string, unknown>): number {
  const metadata = getMetadata(data);
  const metadataCredits =
    readNumber(metadata.creations3d_credits) ||
    readNumber(metadata.credits) ||
    readNumber(metadata.plan_credits);

  if (metadataCredits && metadataCredits > 0) {
    return metadataCredits;
  }

  return PLAN_CREDITS[getPlanKey(data)] || PLAN_CREDITS.creator;
}

function getEmail(data: Record<string, unknown>): string | null {
  const user = getWhopUser(data);
  const metadata = getMetadata(data);

  return (
    readString(user.email) ||
    readString(data.email) ||
    readString(metadata.email) ||
    null
  );
}

function getWhopUserId(data: Record<string, unknown>): string | null {
  const user = getWhopUser(data);

  return (
    readString(user.id) ||
    readString(data.user_id) ||
    readString(data.member_id) ||
    null
  );
}

function getMembershipId(data: Record<string, unknown>): string | null {
  const membership = asRecord(data.membership);

  return (
    readString(membership.id) ||
    readString(data.membership_id) ||
    readString(data.id) ||
    null
  );
}

function getProductName(data: Record<string, unknown>): string {
  const product = asRecord(data.product);
  const metadata = getMetadata(data);

  return (
    readString(product.name) ||
    readString(product.title) ||
    readString(metadata.product_name) ||
    ""
  ).toLowerCase();
}

async function handleMembershipActivated(
  db: Firestore,
  data: Record<string, unknown>,
  eventId: string
): Promise<Record<string, unknown>> {
  const firebaseUid = getFirebaseUid(data);

  if (!firebaseUid) {
    throw new Error("missing_firebase_uid_metadata");
  }

  const plan = getPlanKey(data);
  const credits = getPlanCredits(data);
  const whopUserId = getWhopUserId(data);
  const email = getEmail(data);
  const membershipId = getMembershipId(data);
  const creditEventRef = db
    .collection("creditEvents")
    .doc(getCreditEventDocId(eventId));

  await db.runTransaction(async (transaction) => {
    const existingCreditEvent = await transaction.get(creditEventRef);
    if (existingCreditEvent.exists) {
      return;
    }

    transaction.set(
      db.collection("users").doc(firebaseUid),
      {
        whopUserId,
        whopMembershipId: membershipId,
        email,
        plan,
        credits: FieldValue.increment(credits),
        subscriptionStatus: "active",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.create(creditEventRef, {
      userId: firebaseUid,
      whopUserId,
      whopMembershipId: membershipId,
      type: "credit",
      amount: credits,
      reason: "whop-membership-active",
      plan,
      sourceEventId: eventId,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { updated: true, firebaseUid, plan, credits };
}

async function handleMembershipDeactivated(
  db: Firestore,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const firebaseUid = getFirebaseUid(data);

  if (!firebaseUid) {
    throw new Error("missing_firebase_uid_metadata");
  }

  await db
    .collection("users")
    .doc(firebaseUid)
    .set(
      {
        whopUserId: getWhopUserId(data),
        whopMembershipId: getMembershipId(data),
        subscriptionStatus: "cancelled",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return { updated: true, firebaseUid, active: false };
}

async function handlePaymentSucceeded(
  db: Firestore,
  data: Record<string, unknown>,
  eventId: string
): Promise<Record<string, unknown>> {
  const metadata = getMetadata(data);
  const firebaseUid = getFirebaseUid(data);

  if (!firebaseUid) {
    throw new Error("missing_firebase_uid_metadata");
  }

  if (readString(metadata.creations3d_purchase_type) !== "credit_pack") {
    return { ignored: true, reason: "not_a_credit_pack_payment" };
  }

  let credits = readNumber(metadata.creations3d_credits) || 0;
  const productName = getProductName(data);

  if (!credits && productName.includes("10 credits")) {
    credits = 10;
  } else if (!credits && productName.includes("40 credits")) {
    credits = 40;
  } else if (!credits && productName.includes("50 credits")) {
    credits = 50;
  } else if (!credits && productName.includes("100 credits")) {
    credits = 100;
  } else if (!credits && productName.includes("120 credits")) {
    credits = 120;
  }

  if (!credits) {
    return { ignored: true, reason: "no_credit_pack_detected" };
  }

  const creditEventRef = db
    .collection("creditEvents")
    .doc(getCreditEventDocId(eventId));
  const whopUserId = getWhopUserId(data);

  await db.runTransaction(async (transaction) => {
    const existingCreditEvent = await transaction.get(creditEventRef);
    if (existingCreditEvent.exists) {
      return;
    }

    transaction.set(
      db.collection("users").doc(firebaseUid),
      {
        whopUserId,
        email: getEmail(data),
        credits: FieldValue.increment(credits),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.create(creditEventRef, {
      userId: firebaseUid,
      whopUserId,
      type: "credit",
      amount: credits,
      reason: "whop-payment-succeeded",
      productName,
      sourceEventId: eventId,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { updated: true, firebaseUid, credits };
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET?.trim() || "";

  if (!verifyWebhookSignature(payload, request.headers, webhookSecret)) {
    console.error("Invalid Whop webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: WhopEvent;
  try {
    event = JSON.parse(payload) as WhopEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = asRecord(event.data);
  const eventType = getEventType(event);
  if (!eventType) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  const eventId = getEventId(event, data, request.headers, payload);
  const db = adminDb();
  const { claimed, docId } = await claimWebhookEvent(db, eventId, eventType);

  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    let result: Record<string, unknown>;

    if (ACTIVE_MEMBERSHIP_EVENTS.has(eventType)) {
      result = await handleMembershipActivated(db, data, eventId);
    } else if (INACTIVE_MEMBERSHIP_EVENTS.has(eventType)) {
      result = await handleMembershipDeactivated(db, data);
    } else if (
      eventType === "payment.succeeded" ||
      eventType === "payment_succeeded"
    ) {
      result = await handlePaymentSucceeded(db, data, eventId);
    } else {
      result = { ignored: true, reason: "unhandled_event_type", eventType };
    }

    await markWebhookEvent(db, docId, "processed", { result });
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await markWebhookEvent(db, docId, "failed", { error: message });

    console.error("Whop webhook processing failed", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: message === "missing_firebase_uid_metadata" ? 400 : 500 }
    );
  }
}
