import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import { createSessionFromNativeGoogleIdToken } from '@/lib/auth/native-google-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LOG_PREFIX = '[HomeCheff native-google api]';

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const headers = new Headers();
  for (const [k, v] of Object.entries(cors)) {
    headers.set(k, v);
  }
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  headers.set('Content-Type', 'application/json');

  console.info(LOG_PREFIX, { requestReceived: true });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.info(LOG_PREFIX, { verifyFailed: true, reason: 'invalid_json_body' });
    return new NextResponse(JSON.stringify({ ok: false, code: 'invalid_json' }), {
      status: 400,
      headers,
    });
  }

  const idToken =
    typeof (body as { idToken?: unknown })?.idToken === 'string'
      ? (body as { idToken: string }).idToken.trim()
      : '';
  const hasIdToken = Boolean(idToken);
  console.info(LOG_PREFIX, { hasIdToken });
  if (!idToken) {
    console.info(LOG_PREFIX, { verifyFailed: true, reason: 'missing_id_token' });
    return new NextResponse(JSON.stringify({ ok: false, code: 'missing_id_token' }), {
      status: 400,
      headers,
    });
  }

  const result = await createSessionFromNativeGoogleIdToken(idToken);
  if (!result.ok) {
    console.info(LOG_PREFIX, {
      verifyFailed: true,
      code: result.code,
      status: result.status,
    });
    return new NextResponse(JSON.stringify({ ok: false, code: result.code }), {
      status: result.status,
      headers,
    });
  }

  console.info(LOG_PREFIX, { verifySuccess: true, sessionCookieSet: true });
  headers.append('Set-Cookie', result.setCookie);
  return new NextResponse(JSON.stringify({ ok: true }), { status: 200, headers });
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}
