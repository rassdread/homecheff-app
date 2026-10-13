import { NextResponse } from 'next/server';

import { sumOpenSellerLiabilityCents } from '@/lib/hc/open-seller-liability';
import { readPlatformTransferBalance } from '@/lib/stripe/platform-transfer-balance';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' } as const;

function authorized(req: Request): boolean {
  const expected = (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET ??
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ??
    ''
  ).trim();
  if (!expected) return false;
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return token === expected;
}

/** Server-to-server read. No Stripe secret leaves this process. */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401, headers: NO_STORE });
  }
  const [platformBalance, outstandingSellerLiabilityCents] = await Promise.all([
    readPlatformTransferBalance(),
    sumOpenSellerLiabilityCents(),
  ]);
  return NextResponse.json({ ok: true, platformBalance, outstandingSellerLiabilityCents }, { headers: NO_STORE });
}
