import { NextRequest, NextResponse } from 'next/server';
import { readNativeSession, type NativeSessionReason } from '@/lib/auth/native-session-read';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LOG_PREFIX = '[HomeCheff native-google api]';

/** Says why the follow-up request did or did not yield a user. No secrets. */
export async function GET(req: NextRequest) {
  const authRef = req.nextUrl.searchParams.get('authRef') || '';
  const safeRef = /^[a-f0-9]{8}$/.test(authRef) ? authRef : '';
  const secret = process.env.NEXTAUTH_SECRET?.trim() || '';
  const reason: NativeSessionReason = secret
    ? await readNativeSession(req.headers.get('cookie'), secret)
    : 'undecodable';
  console.warn(LOG_PREFIX, { step: 'session_probe', authRef: safeRef || null, reason });
  return NextResponse.json(
    { reason, sawSessionCookie: reason !== 'missing' },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } },
  );
}
