import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export class InsufficientCreditsError extends Error {
  status = 402;

  constructor(
    public currentCredits: number,
    public requiredCredits: number
  ) {
    super("Insufficient credits");
    this.name = "InsufficientCreditsError";
  }
}

export type CreditState = {
  credits: number;
  plan: string | null;
  subscriptionStatus: string | null;
};

export async function getCreditState(userId: string): Promise<CreditState> {
  const doc = await adminDb().collection("users").doc(userId).get();

  if (!doc.exists) {
    return {
      credits: 0,
      plan: null,
      subscriptionStatus: null,
    };
  }

  const data = doc.data();

  return {
    credits: data?.credits || 0,
    plan: data?.plan || null,
    subscriptionStatus: data?.subscriptionStatus || null,
  };
}

export async function reserveCredits({
  userId,
  amount,
  reason,
  generationId,
}: {
  userId: string;
  amount: number;
  reason: string;
  generationId?: string;
}): Promise<{ remainingCredits: number; eventId: string }> {
  const db = adminDb();
  const userRef = db.collection("users").doc(userId);
  const eventRef = db.collection("creditEvents").doc();

  const remainingCredits = await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentCredits = userDoc.exists ? userDoc.data()?.credits || 0 : 0;

    if (currentCredits < amount) {
      throw new InsufficientCreditsError(currentCredits, amount);
    }

    const nextCredits = currentCredits - amount;

    transaction.set(
      userRef,
      {
        credits: nextCredits,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(eventRef, {
      userId,
      type: "debit",
      amount,
      reason,
      generationId: generationId || null,
      creditsBefore: currentCredits,
      creditsAfter: nextCredits,
      createdAt: FieldValue.serverTimestamp(),
    });

    return nextCredits;
  });

  return {
    remainingCredits,
    eventId: eventRef.id,
  };
}

export async function refundCredits({
  userId,
  amount,
  reason,
  generationId,
}: {
  userId: string;
  amount: number;
  reason: string;
  generationId?: string;
}): Promise<void> {
  const db = adminDb();

  await db.collection("users").doc(userId).set(
    {
      credits: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await db.collection("creditEvents").add({
    userId,
    type: "refund",
    amount,
    reason,
    generationId: generationId || null,
    createdAt: FieldValue.serverTimestamp(),
  });
}
