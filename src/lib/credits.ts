import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface DeductResult {
  success: boolean;
  currentCredits?: number;
  remainingCredits?: number;
}

/**
 * Atomically check and deduct credits using a Firestore transaction.
 * Prevents race conditions where concurrent requests can overspend.
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<DeductResult> {
  const db = adminDb();
  const userRef = db.collection("users").doc(userId);

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentCredits = userDoc.exists ? userDoc.data()?.credits || 0 : 5;

    if (currentCredits < amount) {
      return { success: false, currentCredits };
    }

    transaction.set(
      userRef,
      {
        credits: FieldValue.increment(-amount),
        lastGenerationAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, remainingCredits: currentCredits - amount };
  });
}
