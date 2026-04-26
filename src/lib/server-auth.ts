import { NextRequest } from "next/server";
import { DecodedIdToken } from "firebase-admin/auth";
import { verifyIdToken } from "@/lib/firebase-admin";

export class AuthError extends Error {
  status = 401;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(request: NextRequest): Promise<DecodedIdToken> {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AuthError();
  }

  const decoded = await verifyIdToken(token);

  if (!decoded) {
    throw new AuthError("Invalid authentication token");
  }

  return decoded;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
