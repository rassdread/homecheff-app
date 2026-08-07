/**
 * Public Firebase Web config (safe for client / SW). Server Admin credentials stay private.
 *
 * `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is optional: when omitted, Firebase Messaging uses the
 * project's configured Web Push certificate (see Firebase getToken vapidKey docs).
 */
export type FirebaseWebPublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey?: string;
};

export function getFirebaseWebPublicConfig(): FirebaseWebPublicConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }
  return {
    apiKey,
    authDomain,
    projectId,
    messagingSenderId,
    appId,
    ...(vapidKey ? { vapidKey } : {}),
  };
}

export function isFirebaseWebPushConfigured(): boolean {
  return getFirebaseWebPublicConfig() !== null;
}
