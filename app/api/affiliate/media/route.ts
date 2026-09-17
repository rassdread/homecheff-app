import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessPromoLibrary, getPromoActor } from '@/lib/affiliate-media/actor';
import {
  isListedCommunity,
  isListedOfficial,
  isOwnerLibraryItem,
} from '@/lib/affiliate-media/access';
import {
  AFFILIATE_MEDIA_IMAGE_MAX_BYTES,
  AFFILIATE_MEDIA_POSTER_MAX_BYTES,
  AFFILIATE_MEDIA_UPLOADS_PER_HOUR,
  AFFILIATE_MEDIA_VIDEO_MAX_BYTES,
} from '@/lib/affiliate-media/constants';
import { sanitizeDestinationPath } from '@/lib/affiliate-media/destination';
import { checkAffiliateMediaUploadRateLimit } from '@/lib/affiliate-media/rate-limit';
import { serializePromoAsset } from '@/lib/affiliate-media/serialize';
import { newAffiliateMediaShareSlug } from '@/lib/affiliate-media/share-url';
import { affiliateMediaObjectKey, deleteAffiliateMediaBlob, putAffiliateMediaBlob } from '@/lib/affiliate-media/storage';
import { fetchTrustedAffiliateMediaBlob, isTrustedAffiliateMediaBlobUrl } from '@/lib/affiliate-media/trusted-blob';
import { validatePromoImage, validatePromoPoster, validatePromoVideo } from '@/lib/affiliate-media/validate-file';
import {
  normalizeAssetCopy,
  parseAffiliateVisibility,
  validateCommunityConsent,
} from '@/lib/affiliate-media/validate-meta';
import type { AffiliateMediaModerationStatus, AffiliateMediaVisibility } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const CREATOR_SELECT = {
  name: true,
  username: true,
  displayFullName: true,
  displayNameOption: true,
} as const;

export async function GET(req: Request) {
  const actor = await getPromoActor();
  if (!actor || !canAccessPromoLibrary(actor)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tab = new URL(req.url).searchParams.get('tab') || 'official';

  if (tab === 'official') {
    const rows = await prisma.affiliateMediaAsset.findMany({
      where: { deletedAt: null, visibility: 'OFFICIAL', moderationStatus: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { creator: { select: CREATOR_SELECT }, _count: { select: { shareEvents: true } } },
    });
    return NextResponse.json({
      actor: { isAdmin: actor.isAdmin, isAffiliate: actor.isAffiliate, referralCode: actor.referralCode },
      assets: rows.filter(isListedOfficial).map((r) =>
        serializePromoAsset({ ...r, shareCount: r._count.shareEvents }, r.creator, actor.userId),
      ),
    });
  }

  if (tab === 'community') {
    const rows = await prisma.affiliateMediaAsset.findMany({
      where: { deletedAt: null, visibility: 'AFFILIATE_COMMUNITY', moderationStatus: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { creator: { select: CREATOR_SELECT }, _count: { select: { shareEvents: true } } },
    });
    return NextResponse.json({
      actor: { isAdmin: actor.isAdmin, isAffiliate: actor.isAffiliate, referralCode: actor.referralCode },
      assets: rows.filter(isListedCommunity).map((r) =>
        serializePromoAsset({ ...r, shareCount: r._count.shareEvents }, r.creator, actor.userId),
      ),
    });
  }

  if (tab === 'mine') {
    const rows = await prisma.affiliateMediaAsset.findMany({
      where: { deletedAt: null, creatorUserId: actor.userId },
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: { creator: { select: CREATOR_SELECT }, _count: { select: { shareEvents: true } } },
    });
    return NextResponse.json({
      actor: { isAdmin: actor.isAdmin, isAffiliate: actor.isAffiliate, referralCode: actor.referralCode },
      assets: rows
        .filter((r) => isOwnerLibraryItem(r, actor.userId))
        .map((r) =>
          serializePromoAsset({ ...r, shareCount: r._count.shareEvents }, r.creator, actor.userId),
        ),
    });
  }

  if (tab === 'review' && actor.isAdmin) {
    const rows = await prisma.affiliateMediaAsset.findMany({
      where: { deletedAt: null, visibility: 'AFFILIATE_COMMUNITY', moderationStatus: 'UNDER_REVIEW' },
      orderBy: { createdAt: 'asc' },
      take: 80,
      include: { creator: { select: CREATOR_SELECT }, _count: { select: { shareEvents: true } } },
    });
    return NextResponse.json({
      actor: { isAdmin: actor.isAdmin, isAffiliate: actor.isAffiliate, referralCode: actor.referralCode },
      assets: rows.map((r) =>
        serializePromoAsset({ ...r, shareCount: r._count.shareEvents }, r.creator, actor.userId),
      ),
    });
  }

  return NextResponse.json({ error: 'Unknown tab' }, { status: 400 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const actor = await getPromoActor();
  if (!actor || !canAccessPromoLibrary(actor)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!actor.isAffiliate && !actor.isAdmin) {
    return NextResponse.json({ error: 'Affiliate required' }, { status: 403 });
  }

  const rate = checkAffiliateMediaUploadRateLimit(actor.userId, AFFILIATE_MEDIA_UPLOADS_PER_HOUR);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const remoteMediaUrl = String(form.get('mediaUrl') || '');
  const remotePosterUrl = String(form.get('posterUrl') || '');
  const hasRemote = Boolean(remoteMediaUrl);
  if (!hasRemote && !(file instanceof File)) {
    return NextResponse.json({ error: 'file_required' }, { status: 400 });
  }
  if (hasRemote && !isTrustedAffiliateMediaBlobUrl(remoteMediaUrl)) {
    return NextResponse.json({ error: 'untrusted_blob_url' }, { status: 400 });
  }
  if (remotePosterUrl && !isTrustedAffiliateMediaBlobUrl(remotePosterUrl)) {
    return NextResponse.json({ error: 'untrusted_blob_url' }, { status: 400 });
  }

  let visibility = parseAffiliateVisibility(String(form.get('visibility') || ''));
  if (!visibility) return NextResponse.json({ error: 'visibility_required' }, { status: 400 });
  if (visibility === 'OFFICIAL' && !actor.isAdmin) {
    return NextResponse.json({ error: 'official_admin_only' }, { status: 403 });
  }
  if (!actor.isAffiliate && visibility !== 'OFFICIAL') {
    return NextResponse.json({ error: 'affiliate_required' }, { status: 403 });
  }

  const reuseConsent = String(form.get('reuseConsent') || '') === '1';
  const consent = validateCommunityConsent({ visibility, reuseConsent });
  if (!consent.ok) return NextResponse.json({ error: consent.error }, { status: 400 });

  const destinationPath = sanitizeDestinationPath(String(form.get('destinationPath') || '/'));
  if (!destinationPath) return NextResponse.json({ error: 'invalid_destination' }, { status: 400 });

  const copy = normalizeAssetCopy({
    title: String(form.get('title') || ''),
    caption: String(form.get('caption') || ''),
    ctaText: String(form.get('ctaText') || ''),
  });

  const declaredName = String(form.get('fileName') || (file instanceof File ? file.name : '') || '');
  const declaredMime = String(form.get('mimeType') || (file instanceof File ? file.type : '') || '');
  const isVideo =
    declaredMime.startsWith('video/') ||
    declaredName.toLowerCase().endsWith('.mp4') ||
    remoteMediaUrl.toLowerCase().includes('/video.mp4');

  let kind: 'IMAGE' | 'VIDEO';
  let mediaBuf: Buffer;
  let mediaMime: string;
  let byteSize: number;
  let width: number | null = null;
  let height: number | null = null;
  let durationMs: number | null = null;
  let posterBuf: Buffer | null = null;
  let posterMime = 'image/jpeg';

  try {
    let buf: Buffer;
    if (hasRemote) {
      const fetched = await fetchTrustedAffiliateMediaBlob(
        remoteMediaUrl,
        isVideo ? AFFILIATE_MEDIA_VIDEO_MAX_BYTES : AFFILIATE_MEDIA_IMAGE_MAX_BYTES,
      );
      if (!fetched.ok) return NextResponse.json({ error: fetched.error }, { status: 400 });
      buf = fetched.buffer;
    } else {
      buf = Buffer.from(await (file as File).arrayBuffer());
    }

    if (isVideo) {
      const video = validatePromoVideo(buf, declaredMime || 'video/mp4', declaredName || 'clip.mp4');
      if (!video.ok) {
        if (hasRemote) await deleteAffiliateMediaBlob(remoteMediaUrl);
        return NextResponse.json({ error: video.error }, { status: 400 });
      }
      kind = 'VIDEO';
      mediaBuf = video.value.buffer;
      mediaMime = video.value.mimeType;
      byteSize = video.value.byteSize;
      durationMs = video.value.durationMs;

      if (hasRemote) {
        if (!remotePosterUrl) {
          await deleteAffiliateMediaBlob(remoteMediaUrl);
          return NextResponse.json({ error: 'poster_required' }, { status: 400 });
        }
        const posterFetched = await fetchTrustedAffiliateMediaBlob(remotePosterUrl, AFFILIATE_MEDIA_POSTER_MAX_BYTES);
        if (!posterFetched.ok) {
          await deleteAffiliateMediaBlob(remoteMediaUrl);
          return NextResponse.json({ error: posterFetched.error }, { status: 400 });
        }
        const poster = validatePromoPoster(posterFetched.buffer, 'image/jpeg');
        if (!poster.ok) {
          await deleteAffiliateMediaBlob(remoteMediaUrl);
          await deleteAffiliateMediaBlob(remotePosterUrl);
          return NextResponse.json({ error: poster.error }, { status: 400 });
        }
        posterBuf = poster.value.buffer;
        posterMime = poster.value.mimeType;
        width = poster.value.width;
        height = poster.value.height;
      } else {
        const posterFile = form.get('poster');
        if (!(posterFile instanceof File)) {
          return NextResponse.json({ error: 'poster_required' }, { status: 400 });
        }
        const poster = validatePromoPoster(Buffer.from(await posterFile.arrayBuffer()), posterFile.type || 'image/jpeg');
        if (!poster.ok) return NextResponse.json({ error: poster.error }, { status: 400 });
        posterBuf = poster.value.buffer;
        posterMime = poster.value.mimeType;
        width = poster.value.width;
        height = poster.value.height;
      }
    } else {
      const image = validatePromoImage(buf, declaredMime || 'image/jpeg');
      if (!image.ok) {
        if (hasRemote) await deleteAffiliateMediaBlob(remoteMediaUrl);
        return NextResponse.json({ error: image.error }, { status: 400 });
      }
      kind = 'IMAGE';
      mediaBuf = image.value.buffer;
      mediaMime = image.value.mimeType;
      byteSize = image.value.byteSize;
      width = image.value.width;
      height = image.value.height;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'upload_failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let moderationStatus: AffiliateMediaModerationStatus;
  if (visibility === 'OFFICIAL') {
    moderationStatus = 'ACTIVE';
  } else if (visibility === 'AFFILIATE_COMMUNITY') {
    moderationStatus = actor.isAdmin ? 'ACTIVE' : 'UNDER_REVIEW';
  } else {
    moderationStatus = 'ACTIVE';
  }

  const assetId = crypto.randomUUID();
  let shareSlug = newAffiliateMediaShareSlug();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.affiliateMediaAsset.findUnique({ where: { shareSlug }, select: { id: true } });
    if (!clash) break;
    shareSlug = newAffiliateMediaShareSlug();
  }

  let mediaUrl: string;
  let posterUrl: string | null = null;
  try {
    if (hasRemote) {
      mediaUrl = remoteMediaUrl;
      posterUrl = remotePosterUrl || null;
    } else {
      const media = await putAffiliateMediaBlob({
        key: affiliateMediaObjectKey(assetId, kind === 'VIDEO' ? 'video' : 'image'),
        buffer: mediaBuf,
        contentType: mediaMime,
      });
      mediaUrl = media.url;
      if (posterBuf) {
        const poster = await putAffiliateMediaBlob({
          key: affiliateMediaObjectKey(assetId, 'poster'),
          buffer: posterBuf,
          contentType: posterMime,
        });
        posterUrl = poster.url;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'upload_failed';
    return NextResponse.json({ error: msg === 'BLOB_TOKEN_MISSING' ? 'storage_unavailable' : 'upload_failed' }, { status: 503 });
  }

  const created = await prisma.affiliateMediaAsset.create({
    data: {
      id: assetId,
      creatorUserId: actor.userId,
      kind,
      storageKey: affiliateMediaObjectKey(assetId, kind === 'VIDEO' ? 'video' : 'image'),
      mediaUrl,
      posterUrl,
      posterStorageKey: posterBuf || posterUrl ? affiliateMediaObjectKey(assetId, 'poster') : null,
      mimeType: mediaMime,
      byteSize,
      width,
      height,
      durationMs,
      title: copy.title,
      caption: copy.caption,
      ctaText: copy.ctaText,
      visibility: visibility as AffiliateMediaVisibility,
      moderationStatus,
      reuseConsentAt: visibility === 'AFFILIATE_COMMUNITY' ? new Date() : null,
      shareSlug,
      destinationPath,
    },
    include: { creator: { select: CREATOR_SELECT } },
  });

  return NextResponse.json({
    asset: serializePromoAsset(created, created.creator, actor.userId),
  });
}
