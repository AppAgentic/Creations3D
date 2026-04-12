import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

// Initialize Firebase Admin
// In Firebase App Hosting, Application Default Credentials are auto-configured
function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Check if running in Firebase App Hosting (ADC available)
  if (process.env.FIREBASE_CONFIG) {
    // Use Application Default Credentials
    adminApp = initializeApp();
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
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Fallback: try ADC anyway
    adminApp = initializeApp();
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
