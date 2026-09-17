import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isListedCommunity,
  isListedOfficial,
  isPublicLandingEligible,
  isSafeForOpenGraphMedia,
  canOtherAffiliateShare,
  requiresReuseConsent,
} from './access';
import { sanitizeDestinationPath } from './destination';
import { inspectImage, stripJpegExif } from './image-inspect';
import { inspectMp4 } from './mp4-inspect';
import { attributedPromoUrl, canonicalPromoUrl, isValidShareSlug } from './share-url';
import { validateCommunityConsent } from './validate-meta';
import { validatePromoImage, validatePromoVideo } from './validate-file';
import { checkAffiliateMediaUploadRateLimit, _resetAffiliateMediaRateLimitForTests } from './rate-limit';
import { AFFILIATE_MEDIA_UPLOADS_PER_HOUR } from './constants';
import { listingPathFromAbsolute } from '@/lib/share/resolve-marketplace-share-url';
import {
  buildExactlyOnceWebShareData,
  countDestinationUrlsInNativePayload,
} from '@/lib/share/exactly-once-share';
import { creatorCreditLabel } from './serialize';
import { isKnownHomecheffRootPath } from '@/lib/seo/known-root-path-segments';
import { affiliateMediaObjectKey } from './storage';
import { isTrustedAffiliateMediaBlobUrl } from './trusted-blob';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

function box(type: string, payload: Buffer): Buffer {
  const size = Buffer.alloc(4);
  size.writeUInt32BE(8 + payload.length);
  return Buffer.concat([size, Buffer.from(type, 'ascii'), payload]);
}

function ftyp(brands = 'isommp41'): Buffer {
  const major = Buffer.from('isom', 'ascii');
  const minor = Buffer.alloc(4);
  const rest = Buffer.from(brands, 'ascii');
  return box('ftyp', Buffer.concat([major, minor, rest]));
}

function mvhdDuration(durationMs: number): Buffer {
  const timescale = 1000;
  const body = Buffer.alloc(4 + 8 + 8);
  body.writeUInt32BE(timescale, 4 + 8);
  body.writeUInt32BE(durationMs, 4 + 8 + 4);
  return box('mvhd', body);
}

describe('affiliate media destination allowlist', () => {
  it('accepts only HomeCheff internal paths', () => {
    assert.equal(sanitizeDestinationPath('/'), '/');
    assert.equal(sanitizeDestinationPath('/werken-bij'), '/werken-bij');
    assert.equal(sanitizeDestinationPath('https://evil.com'), null);
    assert.equal(sanitizeDestinationPath('//evil.com'), null);
    assert.equal(sanitizeDestinationPath('/product/abc'), null);
    assert.equal(sanitizeDestinationPath('/affiliate?x=1'), '/affiliate');
  });
});

describe('affiliate media access + consent', () => {
  const tess = {
    creatorUserId: 'tess',
    visibility: 'AFFILIATE_COMMUNITY' as const,
    moderationStatus: 'UNDER_REVIEW' as const,
    deletedAt: null,
  };

  it('community requires consent and is hidden until ACTIVE', () => {
    assert.equal(requiresReuseConsent('AFFILIATE_COMMUNITY'), true);
    assert.equal(requiresReuseConsent('PRIVATE'), false);
    assert.deepEqual(validateCommunityConsent({ visibility: 'AFFILIATE_COMMUNITY', reuseConsent: false }), {
      ok: false,
      error: 'reuse_consent_required',
    });
    assert.equal(isListedCommunity(tess), false);
    assert.equal(isPublicLandingEligible(tess), false);
    const live = { ...tess, moderationStatus: 'ACTIVE' as const };
    assert.equal(isListedCommunity(live), true);
    assert.equal(canOtherAffiliateShare(live, 'mehmet'), true);
  });

  it('private is unlisted for others but landing-eligible when ACTIVE', () => {
    const priv = {
      creatorUserId: 'tess',
      visibility: 'PRIVATE' as const,
      moderationStatus: 'ACTIVE' as const,
      deletedAt: null,
    };
    assert.equal(isListedCommunity(priv), false);
    assert.equal(canOtherAffiliateShare(priv, 'mehmet'), false);
    assert.equal(canOtherAffiliateShare(priv, 'tess'), true);
    assert.equal(isPublicLandingEligible(priv), true);
    assert.equal(isSafeForOpenGraphMedia(priv), false);
  });

  it('official is shareable by every affiliate', () => {
    const off = {
      creatorUserId: 'admin',
      visibility: 'OFFICIAL' as const,
      moderationStatus: 'ACTIVE' as const,
      deletedAt: null,
    };
    assert.equal(isListedOfficial(off), true);
    assert.equal(canOtherAffiliateShare(off, 'britt'), true);
    assert.equal(isSafeForOpenGraphMedia(off), true);
  });

  it('rejected/deleted assets are not OG-safe', () => {
    assert.equal(
      isSafeForOpenGraphMedia({
        creatorUserId: 'tess',
        visibility: 'AFFILIATE_COMMUNITY',
        moderationStatus: 'REJECTED',
        deletedAt: null,
      }),
      false,
    );
    assert.equal(
      isPublicLandingEligible({
        creatorUserId: 'tess',
        visibility: 'PRIVATE',
        moderationStatus: 'ACTIVE',
        deletedAt: new Date(),
      }),
      false,
    );
  });
});

describe('creator vs sharing affiliate URL', () => {
  it('share URL uses sharing ref, never a baked-in creator code', () => {
    const url = attributedPromoUrl({
      shareSlug: 'abc12345de',
      sharingReferralCode: 'REFMEHMET',
    });
    assert.match(url, /\/p\/abc12345de/);
    assert.match(url, /ref=REFMEHMET/);
    assert.equal(canonicalPromoUrl('abc12345de').includes('ref='), false);
    assert.equal(isValidShareSlug('abc12345de'), true);
  });
});

describe('LIMITED_VIDEO_V1 mp4 inspect', () => {
  it('accepts ftyp isom/mp41 and reads mvhd duration', () => {
    const file = Buffer.concat([ftyp(), box('moov', mvhdDuration(12_000))]);
    const r = inspectMp4(file);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.durationMs, 12_000);
    const v = validatePromoVideo(file, 'video/mp4', 'clip.mp4');
    assert.equal(v.ok, true);
  });

  it('rejects MOV/WebM and HEVC brands', () => {
    assert.equal(validatePromoVideo(Buffer.alloc(32), 'video/quicktime', 'clip.mov').ok, false);
    assert.equal(validatePromoVideo(Buffer.alloc(32), 'video/webm', 'clip.webm').ok, false);
    const hevc = ftyp('isomhvc1');
    const r = inspectMp4(hevc);
    assert.equal(r.ok, false);
  });

  it('rejects videos over 60s', () => {
    const file = Buffer.concat([ftyp(), box('moov', mvhdDuration(90_000))]);
    const v = validatePromoVideo(file, 'video/mp4', 'long.mp4');
    assert.equal(v.ok, false);
    if (!v.ok) assert.equal(v.error, 'video_too_long');
  });

  it('rejects mp4 without parseable duration', () => {
    const v = validatePromoVideo(ftyp(), 'video/mp4', 'nodur.mp4');
    assert.equal(v.ok, false);
    if (!v.ok) assert.equal(v.error, 'video_duration_unknown');
  });
});

describe('image inspect', () => {
  it('rejects SVG/HTML/PDF and accepts JPEG magic', () => {
    assert.equal(inspectImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">')).ok, false);
    assert.equal(inspectImage(Buffer.from('%PDF-1.4')).ok, false);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const r = inspectImage(Buffer.concat([jpeg, Buffer.alloc(20)]));
    assert.equal(r.ok, true);
    const stripped = stripJpegExif(Buffer.concat([Buffer.from([0xff, 0xd8]), jpeg]));
    assert.ok(stripped[0] === 0xff);
  });

  it('rejects undeclared gif', () => {
    const gif = Buffer.from('GIF89a............');
    assert.equal(validatePromoImage(gif, 'image/gif').ok, false);
  });
});

describe('rate limit', () => {
  it('blocks after hourly cap', () => {
    _resetAffiliateMediaRateLimitForTests();
    for (let i = 0; i < AFFILIATE_MEDIA_UPLOADS_PER_HOUR; i++) {
      assert.equal(checkAffiliateMediaUploadRateLimit('u1', AFFILIATE_MEDIA_UPLOADS_PER_HOUR).allowed, true);
    }
    assert.equal(checkAffiliateMediaUploadRateLimit('u1', AFFILIATE_MEDIA_UPLOADS_PER_HOUR).allowed, false);
  });
});

describe('exactly-once promo share payload', () => {
  it('native payload contains the promo URL once', () => {
    const url = attributedPromoUrl({ shareSlug: 'promoasset1', sharingReferralCode: 'REFBRITT' });
    const data = buildExactlyOnceWebShareData({
      title: 'HomeCheff',
      text: `Deel dit\n${url}`,
      url,
    });
    assert.equal(countDestinationUrlsInNativePayload(data), 1);
    assert.equal(String(data.text || '').includes('http'), false);
  });
});

describe('feed isolation', () => {
  it('feed product/dish queries never read AffiliateMediaAsset', () => {
    const files = [
      'lib/feed/feed-product-query.server.ts',
      'lib/feed/feed-dish-query.server.ts',
      'app/api/feed/route.ts',
    ];
    for (const f of files) {
      const src = read(f);
      assert.doesNotMatch(src, /AffiliateMediaAsset/);
      assert.doesNotMatch(src, /affiliate-media/);
    }
  });
});

describe('open graph canonical never includes ref', () => {
  it('landing metadata uses canonicalPromoUrl without query', () => {
    const src = read('app/p/[shareSlug]/page.tsx');
    assert.match(src, /canonicalPromoUrl/);
    assert.doesNotMatch(src, /\?ref=/);
    assert.match(src, /url: canonical/);
  });
});

describe('promo path is a shareable listing path', () => {
  it('maps /p/{slug} for resolveShareUrl', () => {
    assert.equal(
      listingPathFromAbsolute('https://homecheff.eu/p/abc12345de'),
      '/p/abc12345de',
    );
  });

  it('LEGAL-0 allows /p/{slug} through middleware', () => {
    assert.equal(isKnownHomecheffRootPath('/p/abc12345de'), true);
  });
});

describe('creator credit vs sharer attribution', () => {
  it('official credit is HomeCheff; community uses public display name', () => {
    assert.equal(
      creatorCreditLabel({
        visibility: 'OFFICIAL',
        creator: { name: 'Admin Person', username: 'admin', displayFullName: true, displayNameOption: 'full' },
      }),
      'HomeCheff',
    );
    assert.equal(
      creatorCreditLabel({
        visibility: 'AFFILIATE_COMMUNITY',
        creator: { name: 'Tess Example', username: 'tess', displayFullName: false, displayNameOption: 'username' },
      }),
      'tess',
    );
  });
});

describe('storage + security contracts', () => {
  it('stores under affiliate-media/{assetId}/', () => {
    assert.equal(affiliateMediaObjectKey('asset-1', 'video'), 'affiliate-media/asset-1/video.mp4');
    assert.equal(affiliateMediaObjectKey('asset-1', 'poster'), 'affiliate-media/asset-1/poster.jpg');
  });

  it('upload route enforces affiliate, official admin, consent, mime checks', () => {
    const src = read('app/api/affiliate/media/route.ts');
    assert.match(src, /official_admin_only/);
    assert.match(src, /reuseConsent/);
    assert.match(src, /validatePromoVideo/);
    assert.match(src, /validatePromoImage/);
    assert.match(src, /UNDER_REVIEW/);
    assert.doesNotMatch(src, /CommissionLedger/);
  });

  it('share events are observational and never write commissions', () => {
    const src = read('app/api/affiliate/media/[id]/share-event/route.ts');
    assert.match(src, /affiliateMediaShareEvent\.create/);
    assert.doesNotMatch(src, /CommissionLedger|attribution\.create|processAttribution/);
  });

  it('promo library never calls navigator.share directly', () => {
    const src = read('components/affiliate/AffiliatePromoLibraryClient.tsx');
    assert.match(src, /HomecheffVisibleShareSheet/);
    assert.match(src, /inFlight\.current/);
    assert.doesNotMatch(src, /navigator\.share/);
  });

  it('migration only creates affiliate-media structures', () => {
    const sql = read('prisma/migrations/20260917160000_affiliate_media_library/migration.sql');
    assert.match(sql, /CREATE TABLE "AffiliateMediaAsset"/);
    assert.doesNotMatch(sql, /ALTER TABLE "Attribution"/);
    assert.doesNotMatch(sql, /ALTER TABLE "CommissionLedger"/);
    assert.doesNotMatch(sql, /ALTER TABLE "Product"/);
    assert.doesNotMatch(sql, /ALTER TABLE "Listing"/);
    assert.doesNotMatch(sql, /ALTER TABLE "Order"/);
  });

  it('landing sanitizes destinationPath and keeps canonical without ref', () => {
    const src = read('app/p/[shareSlug]/page.tsx');
    assert.match(src, /sanitizeDestinationPath/);
    assert.match(src, /canonicalPromoUrl/);
    assert.match(src, /REFERRAL_COOKIE_NAME/);
  });

  it('rejects untrusted blob fetch URLs (SSRF)', () => {
    assert.equal(isTrustedAffiliateMediaBlobUrl('https://evil.com/affiliate-media/x/image.jpg'), false);
    assert.equal(isTrustedAffiliateMediaBlobUrl('https://example.public.blob.vercel-storage.com/videos/x.mp4'), false);
    assert.equal(
      isTrustedAffiliateMediaBlobUrl('https://example.public.blob.vercel-storage.com/affiliate-media/x/image.jpg'),
      true,
    );
  });

  it('client blob token route is authenticated and namespace-scoped', () => {
    const src = read('app/api/affiliate/media/blob/route.ts');
    assert.match(src, /handleUpload/);
    assert.match(src, /affiliate-media/);
    assert.match(src, /getPromoActor/);
    assert.match(src, /allowedContentTypes/);
  });
});
