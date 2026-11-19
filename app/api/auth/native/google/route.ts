import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import { createSessionFromNativeGoogleIdToken } from '@/lib/auth/native-google-session';
import {
  nativeDocumentRedirectTarget,
  nativeSessionPostAllowed,
} from '@/lib/auth/native-session-post';

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

  let idToken = '';
  let returnTo = '';
  const contentType = req.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      idToken = String(form.get('idToken') || '').trim();
      returnTo = String(form.get('returnTo') || '').trim();
    } else {
      const body = await req.json();
      idToken =
        typeof (body as { idToken?: unknown })?.idToken === 'string'
          ? (body as { idToken: string }).idToken.trim()
          : '';
      returnTo =
        typeof (body as { returnTo?: unknown })?.returnTo === 'string'
          ? (body as { returnTo: string }).returnTo.trim()
          : '';
    }
  } catch {
    console.info(LOG_PREFIX, { verifyFailed: true, reason: 'invalid_json_body' });
    return new NextResponse(JSON.stringify({ ok: false, code: 'invalid_json' }), {
      status: 400,
      headers,
    });
  }
  const hasIdToken = Boolean(idToken);
  console.info(LOG_PREFIX, { hasIdToken });
  if (
    !nativeSessionPostAllowed({
      requestUrl: req.url,
      origin: req.headers.get('origin'),
      fetchSite: req.headers.get('sec-fetch-site'),
    })
  ) {
    console.info(LOG_PREFIX, { verifyFailed: true, reason: 'cross_site' });
    return new NextResponse(JSON.stringify({ ok: false, code: 'cross_site' }), {
      status: 403,
      headers,
    });
  }
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
  const redirectTarget = nativeDocumentRedirectTarget(returnTo, req.url);
  if (redirectTarget) {
    const redirect = NextResponse.redirect(redirectTarget, 303);
    redirect.headers.append('Set-Cookie', result.setCookie);
    return redirect;
  }
  headers.append('Set-Cookie', result.setCookie);
  return new NextResponse(
    JSON.stringify({
      ok: true,
      accountCreated: result.accountCreated === true,
    }),
    { status: 200, headers },
  );
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}
