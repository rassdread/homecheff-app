import { NextRequest, NextResponse } from 'next/server';
import { runResendVerificationCore } from '@/lib/auth-resend-verification-core';

export const dynamic = 'force-dynamic';

const RESENT_MSG =
  'Een nieuwe verificatie-e-mail is verzonden. Controleer je inbox (en spam folder).';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runResendVerificationCore(body?.email);

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
          { success: false, code: 'EMAIL_UNAVAILABLE' },
          { status: 503 },
        );
      default:
        return NextResponse.json(
          { success: false, code: 'UNKNOWN' },
          { status: 500 },
        );
    }
  } catch (e) {
    console.error('[resend-verification-simple] unexpected', e instanceof Error ? e.message : 'error');
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
