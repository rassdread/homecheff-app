import { requireMappedAdminCapability } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sumOpenSellerLiabilityCents } from '@/lib/hc/open-seller-liability';
import { growthPreviewProtectionHeaders, resolveGrowthMutationTarget } from '@/lib/hc/preview-service-target';
import { prisma } from '@/lib/prisma';
import { readPlatformTransferBalance } from '@/lib/stripe/platform-transfer-balance';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' } as const;

function ecosystemSecret(): string {
  return (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET ??
    process.env.HC_MARKETPLACE_QUOTE_INTERNAL_SECRET ??
    ''
  ).trim();
}

async function requireCampaignAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, adminRoles: true },
  });
  if (!user) return null;
  const full = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
  const system = user.adminRoles?.includes('system_admin') === true;
  if (!full && !system) return null;
  return user;
}

async function attachTreasury(action: unknown) {
  if (action !== 'list' && action !== 'setStatus') return null;
  const [platformBalance, outstandingSellerLiabilityCents] = await Promise.all([
    readPlatformTransferBalance(),
    sumOpenSellerLiabilityCents(),
  ]);
  return { platformBalance, outstandingSellerLiabilityCents };
}

/** Marketplace admin → the existing Growth campaign service. No second ledger. */
export async function POST(req: Request) {
  const mappedGuard = await requireMappedAdminCapability(req);
  if (!mappedGuard.ok) return mappedGuard.response;
  const admin = await requireCampaignAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, message: 'Geen toegang.' }, { status: 403, headers: NO_STORE });
  }
  const target = resolveGrowthMutationTarget();
  if (!target.ok) {
    return NextResponse.json(
      { ok: false, code: 'CONFIGURATION_ERROR', message: 'Growth is niet gekoppeld.' },
      { status: 503, headers: NO_STORE },
    );
  }
  const secret = ecosystemSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, message: 'Growth is niet gekoppeld.' }, { status: 503, headers: NO_STORE });
  }
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ ok: false, message: 'Ongeldige aanvraag.' }, { status: 400, headers: NO_STORE });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: 'Ongeldige aanvraag.' }, { status: 400, headers: NO_STORE });
  }
  delete body.platformBalance;
  delete body.outstandingSellerLiabilityCents;
  const treasury = await attachTreasury(body.action);
  if (treasury) Object.assign(body, treasury);
  try {
    const res = await fetch(`${target.base}/api/internal/ecosystem/hc/admin-campaigns`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        'x-marketplace-admin-id': admin.id,
        Accept: 'application/json',
        ...growthPreviewProtectionHeaders(target.base),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const json = await res.json();
    if (treasury && json && typeof json === 'object') {
      (json as Record<string, unknown>).platformBalance = treasury.platformBalance;
      (json as Record<string, unknown>).outstandingSellerLiabilityCents = treasury.outstandingSellerLiabilityCents;
    }
    return NextResponse.json(json, { status: res.status, headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, message: 'Growth is tijdelijk niet bereikbaar.' }, { status: 502, headers: NO_STORE });
  }
}
