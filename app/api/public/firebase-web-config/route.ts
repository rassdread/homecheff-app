import { NextResponse } from 'next/server';
import { getFirebaseWebPublicConfig } from '@/lib/firebase/web-public-config';

export const dynamic = 'force-dynamic';

/** Public Firebase web config for SW + clients (no secrets). */
export async function GET() {
  const config = getFirebaseWebPublicConfig();
  if (!config) {
    return NextResponse.json(
      { configured: false, error: 'firebase_web_not_configured' },
      { status: 503 }
    );
  }
  return NextResponse.json({
    configured: true,
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
    // VAPID is public by design; omit when using Firebase project default Web Push cert.
    ...(config.vapidKey ? { vapidKey: config.vapidKey } : {}),
  });
}
