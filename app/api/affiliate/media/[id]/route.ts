import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessPromoLibrary, getPromoActor } from '@/lib/affiliate-media/actor';
import { sanitizeDestinationPath } from '@/lib/affiliate-media/destination';
import { serializePromoAsset } from '@/lib/affiliate-media/serialize';
import { deleteAffiliateMediaBlob } from '@/lib/affiliate-media/storage';
import { normalizeAssetCopy, parseAffiliateVisibility, validateCommunityConsent } from '@/lib/affiliate-media/validate-meta';

export const dynamic = 'force-dynamic';

const CREATOR_SELECT = {
  name: true,
  username: true,
  displayFullName: true,
  displayNameOption: true,
} as const;

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const actor = await getPromoActor();
  if (!actor || !canAccessPromoLibrary(actor)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const asset = await prisma.affiliateMediaAsset.findFirst({
    where: { id, deletedAt: null },
  });
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    title?: string;
    caption?: string;
    ctaText?: string;
    visibility?: string;
    reuseConsent?: boolean;
    destinationPath?: string;
    moderationStatus?: string;
  };

  if (body.action === 'APPROVE' || body.action === 'REJECT') {
    if (!actor.isAdmin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    const moderationStatus = body.action === 'APPROVE' ? 'ACTIVE' : 'REJECTED';
    const updated = await prisma.affiliateMediaAsset.update({
      where: { id },
      data: { moderationStatus },
      include: { creator: { select: CREATOR_SELECT } },
    });
    return NextResponse.json({ asset: serializePromoAsset(updated, updated.creator, actor.userId) });
  }

  const isOwner = asset.creatorUserId === actor.userId;
  if (!isOwner && !actor.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const copy = normalizeAssetCopy({
    title: body.title ?? asset.title,
    caption: body.caption ?? asset.caption,
    ctaText: body.ctaText ?? asset.ctaText,
  });

  let visibility = asset.visibility;
  if (body.visibility) {
    const parsed = parseAffiliateVisibility(body.visibility);
    if (!parsed) return NextResponse.json({ error: 'invalid_visibility' }, { status: 400 });
    if (parsed === 'OFFICIAL' && !actor.isAdmin) {
      return NextResponse.json({ error: 'official_admin_only' }, { status: 403 });
    }
    if (asset.visibility === 'OFFICIAL' && parsed !== 'OFFICIAL' && !actor.isAdmin) {
      return NextResponse.json({ error: 'official_admin_only' }, { status: 403 });
    }
    visibility = parsed;
  }

  if (visibility === 'AFFILIATE_COMMUNITY' && asset.visibility !== 'AFFILIATE_COMMUNITY') {
    const consent = validateCommunityConsent({
      visibility,
      reuseConsent: Boolean(body.reuseConsent),
    });
    if (!consent.ok) return NextResponse.json({ error: consent.error }, { status: 400 });
  }

  let destinationPath = asset.destinationPath;
  if (body.destinationPath) {
    const dest = sanitizeDestinationPath(body.destinationPath);
    if (!dest) return NextResponse.json({ error: 'invalid_destination' }, { status: 400 });
    destinationPath = dest;
  }

  let moderationStatus = asset.moderationStatus;
  if (visibility === 'AFFILIATE_COMMUNITY' && asset.visibility !== 'AFFILIATE_COMMUNITY' && !actor.isAdmin) {
    moderationStatus = 'UNDER_REVIEW';
  }
  if (visibility === 'PRIVATE' && asset.visibility === 'AFFILIATE_COMMUNITY') {
    // Withdraw from community discovery; keep ownership. Unlisted landing remains if ACTIVE.
    moderationStatus = asset.moderationStatus === 'REJECTED' ? 'REJECTED' : 'ACTIVE';
  }

  const updated = await prisma.affiliateMediaAsset.update({
    where: { id },
    data: {
      title: copy.title,
      caption: copy.caption,
      ctaText: copy.ctaText,
      visibility,
      destinationPath,
      moderationStatus,
      reuseConsentAt:
        visibility === 'AFFILIATE_COMMUNITY'
          ? asset.reuseConsentAt || new Date()
          : asset.reuseConsentAt,
    },
    include: { creator: { select: CREATOR_SELECT } },
  });

  return NextResponse.json({ asset: serializePromoAsset(updated, updated.creator, actor.userId) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const actor = await getPromoActor();
  if (!actor || !canAccessPromoLibrary(actor)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const asset = await prisma.affiliateMediaAsset.findFirst({ where: { id, deletedAt: null } });
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (asset.creatorUserId !== actor.userId && !actor.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.affiliateMediaAsset.update({
    where: { id },
    data: { deletedAt: new Date(), moderationStatus: 'ARCHIVED' },
  });
  await deleteAffiliateMediaBlob(asset.mediaUrl);
  await deleteAffiliateMediaBlob(asset.posterUrl);
  return NextResponse.json({ ok: true });
}
