import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessPromoLibrary, getPromoActor } from '@/lib/affiliate-media/actor';
import { canOtherAffiliateShare } from '@/lib/affiliate-media/access';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const actor = await getPromoActor();
  if (!actor || !canAccessPromoLibrary(actor) || !actor.affiliateId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const asset = await prisma.affiliateMediaAsset.findFirst({ where: { id, deletedAt: null } });
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canOtherAffiliateShare(asset, actor.userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { channel?: string };
  const channel = String(body.channel || 'native').slice(0, 40);
  await prisma.affiliateMediaShareEvent.create({
    data: {
      assetId: asset.id,
      sharingAffiliateId: actor.affiliateId,
      channel,
    },
  });
  return NextResponse.json({ ok: true });
}
