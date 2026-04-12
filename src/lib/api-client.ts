import { auth } from "./firebase";

/**
 * Get auth headers with the current user's Firebase ID token.
 * Returns empty object if user is not authenticated.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};

  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

/**
 * Make an authenticated fetch request.
 * Automatically includes the Firebase ID token in the Authorization header.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}
