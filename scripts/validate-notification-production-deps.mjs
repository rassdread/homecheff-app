/**
 * Production dependency gate for notification system.
 */
const requiredServer = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'DATABASE_URL',
];

const requiredWebPush = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
];

const missingServer = requiredServer.filter((k) => !process.env[k]?.trim());
const missingWeb = requiredWebPush.filter((k) => !process.env[k]?.trim());
const cronOk = Boolean(process.env.CRON_SECRET?.trim());

console.log(
  JSON.stringify(
    {
      serverFcmReady: missingServer.length === 0,
      missingServer,
      cronSecretPresent: cronOk,
      webPushClientReady: missingWeb.length === 0,
      missingWebPush: missingWeb,
      note: 'VAPID private key stays in Firebase Console; only public VAPID key is required in NEXT_PUBLIC_FIREBASE_VAPID_KEY',
    },
    null,
    2
  )
);

if (missingServer.length > 0) process.exit(2);
if (!cronOk && process.env.NODE_ENV === 'production') process.exit(3);
console.log('HOMECHEFF_NOTIFICATION_SERVER_DEPS_OK');
if (missingWeb.length > 0) {
  console.log('HOMECHEFF_NOTIFICATION_WEB_PUSH_DEPS_MISSING');
  process.exit(4);
}
console.log('HOMECHEFF_NOTIFICATION_ALL_DEPS_OK');
