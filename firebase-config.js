// =========================================================================
// AQUAVAULT — CENTRAL FIREBASE CONFIGURATION (CRASH-PROOF MODULE)
// Paste your Firebase Web App config once from:
// Firebase Console -> Project Settings -> Your Apps -> Web App (</>)
// =========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyC-yKE9dRoZBu5yROBD2afoB0vQjoG_1Gs",
  authDomain: "aqua-vault.firebaseapp.com",
  projectId: "aqua-vault",
  storageBucket: "aqua-vault.firebasestorage.app",
  messagingSenderId: "35562578382",
  appId: "1:35562578382:web:766ed7d52adea3293b8b9f"
};
// Optional: Set your named Firestore database ID if you are not using "(default)".
export const firestoreDatabaseId = "(default)";

try {
  if (typeof globalThis !== "undefined") {
    globalThis.__AQUAVAULT_FIREBASE_CONFIG__ = firebaseConfig;
    globalThis.__AQUAVAULT_FIRESTORE_DB_ID__ = firestoreDatabaseId;
  }
} catch (_) {}
