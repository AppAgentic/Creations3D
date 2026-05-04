import crypto from "crypto";

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60;

function getSigningSecret() {
  return (
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.WHOP_WEBHOOK_SECRET ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    ""
  );
}

function signPayload(payload: string) {
  const secret = getSigningSecret();

  if (!secret) {
    throw new Error("Model file signing secret is not configured");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createModelFileToken({
  generationId,
  userId,
  expiresInSeconds = DEFAULT_EXPIRES_IN_SECONDS,
}: {
  generationId: string;
  userId: string;
  expiresInSeconds?: number;
}) {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${generationId}.${userId}.${expiresAt}`;
  const signature = signPayload(payload);

  return `${expiresAt}.${signature}`;
}

export function verifyModelFileToken({
  token,
  generationId,
  userId,
}: {
  token: string | null;
  generationId: string;
  userId: string;
}) {
  if (!token) return false;

  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (!expiresAt || !signature) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const payload = `${generationId}.${userId}.${expiresAt}`;
  const expectedSignature = signPayload(payload);

  return timingSafeEqual(signature, expectedSignature);
}
