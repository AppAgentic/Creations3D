import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createModelTitle } from "@/lib/model-metadata";

export type GenerationStatus = "processing" | "generated" | "saved" | "failed";

export async function createGenerationRecord({
  generationId,
  userId,
  type,
  prompt,
  provider,
  creditsUsed,
  input,
}: {
  generationId: string;
  userId: string;
  type: "text-to-3d" | "image-to-3d" | "world";
  prompt?: string | null;
  provider: "replicate" | "worldlabs";
  creditsUsed: number;
  input?: Record<string, unknown>;
}) {
  await adminDb()
    .collection("generations")
    .doc(generationId)
    .set({
      userId,
      type,
      prompt: prompt || null,
      title: createModelTitle(prompt),
      provider,
      creditsUsed,
      status: "processing",
      input: input || {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function updateGenerationRecord(
  generationId: string,
  data: Record<string, unknown>
) {
  await adminDb()
    .collection("generations")
    .doc(generationId)
    .set(
      {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function markGenerationFailed(
  generationId: string,
  errorMessage: string
) {
  await updateGenerationRecord(generationId, {
    status: "failed" satisfies GenerationStatus,
    error: errorMessage,
    failedAt: FieldValue.serverTimestamp(),
  });
}
