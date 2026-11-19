import { NextRequest, NextResponse } from 'next/server';
import { sawNativeSessionCookie } from '@/lib/auth/native-session-post';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LOG_PREFIX = '[HomeCheff native-google api]';

/** Says only whether the follow-up request carried the session cookie. */
export async function GET(req: NextRequest) {
  const authRef = req.nextUrl.searchParams.get('authRef') || '';
  const safeRef = /^[a-f0-9]{8}$/.test(authRef) ? authRef : '';
  const sawSessionCookie = sawNativeSessionCookie(req.headers.get('cookie'));
  console.info(LOG_PREFIX, { step: 'session_probe', authRef: safeRef || null, sawSessionCookie });
  return NextResponse.json(
    { sawSessionCookie },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } },
  );
}
