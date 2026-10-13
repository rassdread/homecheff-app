import { NextResponse } from 'next/server';
import { normalizeHcCampaignCode } from '@/lib/acquisition/hc-campaign-code';
import { describeCampaignOnGrowth } from '@/lib/hc/growth-campaign-client';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' } as const;

export async function GET(req: Request) {
  const code = normalizeHcCampaignCode(new URL(req.url).searchParams.get('code'));
  if (!code) {
    return NextResponse.json({ visible: false, reason: 'INVALID_CODE' }, { status: 200, headers: NO_STORE });
  }
  try {
    const offer = await describeCampaignOnGrowth(code);
    return NextResponse.json(
      {
        visible: offer.visible === true,
        name: offer.visible ? offer.name : undefined,
        hcAmount: offer.visible ? offer.hcAmount : undefined,
        requireStripeConnect: offer.visible ? offer.requireStripeConnect === true : undefined,
        marketplaceSpendable: offer.visible
          ? offer.marketplaceSpendable === true || offer.marketplaceEligible === true
          : undefined,
        studioEligible: offer.visible ? offer.studioEligible === true : undefined,
        growthEligible: offer.visible ? offer.growthEligible === true : undefined,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch {
    return NextResponse.json({ visible: false, reason: 'UNAVAILABLE' }, { status: 200, headers: NO_STORE });
  }
}
