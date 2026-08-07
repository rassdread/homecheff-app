/**
 * Public Turnstile site key for contact form (no secret).
 * GET /api/public/turnstile-config
 */

import { NextResponse } from 'next/server';
import { getTurnstileSiteKey } from '@/lib/contact-security/turnstile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteKey = getTurnstileSiteKey();
  return NextResponse.json({
    siteKey,
    enabled: Boolean(siteKey),
  });
}
