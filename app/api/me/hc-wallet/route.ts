import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { retryPendingCampaignGrant } from '@/lib/hc/qualify-first-listing';
import { growthServiceBase } from '@/lib/hc/preview-service-target';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' } as const;

function ecosystemSecret(): string {
  return (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET ??
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ??
    ''
  ).trim();
}

async function resolveCentralUserId(localUserId: string): Promise<string | null> {
  const link = await prisma.authIdentityLink.findFirst({
    where: { sourceSystem: 'homecheff', sourceUserId: localUserId, status: 'linked' },
    select: { centralUserId: true },
  });
  return link?.centralUserId ?? localUserId;
}

/** Session-bound proxy to Growth central HcWallet — never exposes internal secrets to browser. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401, headers: NO_STORE });
  }

  const buyer = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!buyer) {
    return NextResponse.json({ ok: false, code: 'USER_NOT_FOUND' }, { status: 404, headers: NO_STORE });
  }

  const centralUserId = await resolveCentralUserId(buyer.id);
  void retryPendingCampaignGrant(buyer.id).catch((e) => console.warn('[hc-campaign] retry', e));
  const base = growthServiceBase();
  const secret = ecosystemSecret();
  if (!centralUserId || !secret || !base) {
    return NextResponse.json(
      {
        ok: true,
        identityResolved: Boolean(centralUserId),
        walletResolved: false,
        availableHc: 0,
        reservedHc: 0,
        activity: [],
      },
      { status: 200, headers: NO_STORE },
    );
  }

  try {
    const res = await fetch(`${base}/api/internal/ecosystem/hc/wallet`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secret}`,
        'x-central-user-id': centralUserId,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const json = await res.json();
    return NextResponse.json(json, { status: res.ok ? 200 : res.status, headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { ok: true, identityResolved: true, walletResolved: false, availableHc: 0, activity: [] },
      { status: 200, headers: NO_STORE },
    );
  }
}
