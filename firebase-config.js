// =========================================================================
// AQUAVAULT — CENTRAL FIREBASE CONFIGURATION (CRASH-PROOF MODULE)
// Connected to Firebase Project: aqua-vault
// Authorized Admin UID: Y8zmDKBgubWIVvhufftRPPjG7HC3
// =========================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyC-yKE9dRoZBu5yROBD2afoB0vQjoG_1Gs",
  authDomain: "aqua-vault.firebaseapp.com",
  projectId: "aqua-vault",
  storageBucket: "aqua-vault.firebasestorage.app",
  messagingSenderId: "35562578382",
  appId: "1:35562578382:web:766ed7d52adea3293b8b9f"
};

export const authorizedAdminUid = "Y8zmDKBgubWIVvhufftRPPjG7HC3";
export const firestoreDatabaseId = "(default)";

export default firebaseConfig;

try {
  if (typeof globalThis !== "undefined") {
    globalThis.__AQUAVAULT_FIREBASE_CONFIG__ = firebaseConfig;
    globalThis.__AQUAVAULT_ADMIN_UID__ = authorizedAdminUid;
    globalThis.__AQUAVAULT_FIRESTORE_DB_ID__ = firestoreDatabaseId;
  }
} catch (_) {}
