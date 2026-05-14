import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { runResendVerificationCore } from '@/lib/auth-resend-verification-core';

export const dynamic = 'force-dynamic';

const RESENT_MSG =
  'Een nieuwe verificatie-e-mail is verzonden. Controleer je inbox (en spam folder).';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = await auth();
    const fromBody = typeof body?.email === 'string' ? body.email.trim() : '';
    const fromSession =
      typeof session?.user?.email === 'string' ? session.user.email.trim() : '';
    const resolvedEmail = fromBody || fromSession;
    const result = await runResendVerificationCore(resolvedEmail || undefined);

    switch (result.status) {
      case 'sent':
        return NextResponse.json(
          {
            success: true,
            message: RESENT_MSG,
          },
          { status: 200 },
        );
      case 'generic_ok':
        return NextResponse.json(
          {
            success: true,
            generic: true,
            message: RESENT_MSG,
          },
          { status: 200 },
        );
      case 'already_verified':
        return NextResponse.json(
          {
            success: false,
            code: 'ALREADY_VERIFIED',
          },
          { status: 409 },
        );
      case 'rate_limited':
        return NextResponse.json(
          {
            success: false,
            code: 'RATE_LIMITED',
            retryAfterSec: result.retryAfterSec,
          },
          { status: 429 },
        );
      case 'invalid_email':
        return NextResponse.json(
          { success: false, code: 'INVALID_EMAIL' },
          { status: 400 },
        );
      case 'email_service_unavailable':
        return NextResponse.json(
          {
            success: false,
            code: 'EMAIL_UNAVAILABLE',
            reason: result.reason,
          },
          { status: 503 },
        );
      case 'email_not_configured':
        return NextResponse.json(
          {
            success: false,
            code: 'EMAIL_NOT_CONFIGURED',
            reason: result.reason,
          },
          { status: 500 },
        );
      default:
        return NextResponse.json(
          { success: false, code: 'UNKNOWN' },
          { status: 500 },
        );
    }
  } catch (e) {
    console.error('[resend-verification] unexpected', e instanceof Error ? e.message : 'error');
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
