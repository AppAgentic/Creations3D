import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "./firebase-admin";

/**
 * Extract and verify the Firebase ID token from a request.
 * Returns the authenticated user's UID or a 401 response.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const decoded = await verifyIdToken(token);

  if (!decoded) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  return { uid: decoded.uid };
}

/**
 * Type guard to check if the auth result is an error response.
 */
export function isAuthError(
  result: { uid: string } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
