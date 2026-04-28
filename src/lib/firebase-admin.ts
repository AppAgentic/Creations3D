import { readFileSync } from "fs";
import {
  initializeApp,
  getApps,
  cert,
  App,
  ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

function getLocalProjectOptions() {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId && !storageBucket) {
    return undefined;
  }

  return {
    ...(projectId ? { projectId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
  };
}

function getGoogleApplicationCredentials(): ServiceAccount | null {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsPath) {
    return null;
  }

  try {
    const credentials = JSON.parse(readFileSync(credentialsPath, "utf8"));

    if (
      credentials.project_id &&
      credentials.client_email &&
      credentials.private_key
    ) {
      return {
        projectId: credentials.project_id,
        clientEmail: credentials.client_email,
        privateKey: credentials.private_key,
      };
    }
  } catch (error) {
    console.warn(
      "Unable to read GOOGLE_APPLICATION_CREDENTIALS for Firebase Admin",
      error
    );
  }

  return null;
}

// Initialize Firebase Admin
// In Firebase App Hosting, Application Default Credentials are auto-configured
function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Check if running in Firebase App Hosting (ADC available)
  const localCredentials = getGoogleApplicationCredentials();

  if (process.env.FIREBASE_CONFIG && !localCredentials) {
    // Use Application Default Credentials, but pin the intended project in
    // local dev. Otherwise ADC can inherit the credential owner's project.
    adminApp = initializeApp(getLocalProjectOptions());
  } else if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    // Use explicit credentials (for local development)
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
          /\\n/g,
          "\n"
        ),
      }),
      ...getLocalProjectOptions(),
    });
  } else if (localCredentials) {
    adminApp = initializeApp({
      credential: cert(localCredentials),
      ...getLocalProjectOptions(),
    });
  } else {
    // Fallback: try ADC anyway, pinned to local env project when available.
    adminApp = initializeApp(getLocalProjectOptions());
  }

  return adminApp;
}

// Firebase Admin services
export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());

// Verify Firebase ID token
export async function verifyIdToken(token: string) {
  try {
    return await adminAuth().verifyIdToken(token);
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}

// Get user by ID
export async function getUser(uid: string) {
  try {
    return await adminAuth().getUser(uid);
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}
