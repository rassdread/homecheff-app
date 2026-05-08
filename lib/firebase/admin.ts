/**
 * Firebase Admin (server-only) voor FCM. Geen throw als env ontbreekt — push wordt dan overgeslagen.
 */
import admin from "firebase-admin";

let loggedMissingConfig = false;
let initFailed = false;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Singleton messaging client. `null` als credentials ontbreken of init faalt.
 */
export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  if (initFailed) {
    return null;
  }

  if (!isFirebaseAdminConfigured()) {
    if (!loggedMissingConfig) {
      loggedMissingConfig = true;
      console.warn(
        "[firebase-admin] FCM uit: zet FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
      );
    }
    return null;
  }

  try {
    if (admin.apps.length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey,
        }),
      });
    }
    return admin.messaging();
  } catch (e) {
    initFailed = true;
    console.error(
      "[firebase-admin] Init mislukt:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
}
