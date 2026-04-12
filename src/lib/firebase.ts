import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase client-side configuration
// In Firebase App Hosting, the FIREBASE_WEBAPP_CONFIG is auto-injected
// For local development, use environment variables
const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  ? {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
  : // In Firebase App Hosting, use auto-injected config
    JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG || "{}");

// Gracefully initialize Firebase — don't crash the entire app if config is missing
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (firebaseConfig.apiKey) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn(
      "Firebase config not found. Auth and Firestore will be unavailable. " +
        "Set NEXT_PUBLIC_FIREBASE_* env vars or deploy on Firebase App Hosting."
    );
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

export { app, auth, db };

// Analytics (client-side only)
export const initAnalytics = async () => {
  if (app && typeof window !== "undefined" && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};
