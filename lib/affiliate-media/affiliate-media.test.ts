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
  canViewPromoLanding,
  moderationStatusAfterVisibilityChange,
  moderationStatusForNewPromo,
  requiresReuseConsent,
} from './access';
import { sanitizeDestinationPath } from './destination';
import { inspectImage, stripJpegExif } from './image-inspect';
import { inspectMp4, inspectMp4Source } from './mp4-inspect';
import { attributedPromoUrl, canonicalPromoUrl, isValidShareSlug } from './share-url';
import { inferPromoPlatform, promoContinueHref, promoLibraryPath, promoShareAbsolute } from './platform';
import { validateCommunityConsent } from './validate-meta';
import { assertPromoVideoMeta, validatePromoImage, validatePromoVideo } from './validate-file';
import { checkAffiliateMediaUploadRateLimit, _resetAffiliateMediaRateLimitForTests } from './rate-limit';
import {
  AFFILIATE_MEDIA_INLINE_MAX_BYTES,
  AFFILIATE_MEDIA_UPLOADS_PER_HOUR,
  AFFILIATE_MEDIA_VIDEO_MAX_BYTES,
} from './constants';
import { listingPathFromAbsolute } from '@/lib/share/resolve-marketplace-share-url';
import {
  buildExactlyOnceWebShareData,
  countDestinationUrlsInNativePayload,
} from '@/lib/share/exactly-once-share';
import { creatorCreditLabel } from './serialize';
import { isKnownHomecheffRootPath } from '@/lib/seo/known-root-path-segments';
import { affiliateMediaBlobToken, affiliateMediaObjectKey, storageKeyFromTrustedBlobUrl } from './storage';
import { isTrustedAffiliateMediaBlobUrl, totalFromContentRange } from './trusted-blob';
import {
  affiliateMediaUploadErrorMessage,
  affiliateMediaUploadTransport,
  classifyAffiliatePromoFile,
} from './upload-errors';
import { shouldReuseExistingUpload } from './reuse-upload';

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
    assert.equal(sanitizeDestinationPath('/verdiencheck'), '/verdiencheck');
  });
});

describe('affiliate media access + consent', () => {
  const tess = {
    creatorUserId: 'tess',
    visibility: 'AFFILIATE_COMMUNITY' as const,
    moderationStatus: 'UNDER_REVIEW' as const,
    deletedAt: null,
  };

  it('publishes community promo immediately and keeps hidden material hidden', () => {
    assert.equal(moderationStatusForNewPromo(), 'ACTIVE');
    assert.equal(
      moderationStatusAfterVisibilityChange({
        previousVisibility: 'PRIVATE',
        nextVisibility: 'AFFILIATE_COMMUNITY',
        currentStatus: 'ACTIVE',
      }),
      'ACTIVE',
    );
    assert.equal(
      moderationStatusAfterVisibilityChange({
        previousVisibility: 'PRIVATE',
        nextVisibility: 'AFFILIATE_COMMUNITY',
        currentStatus: 'REJECTED',
      }),
      'REJECTED',
    );
    assert.equal(
      moderationStatusAfterVisibilityChange({
        previousVisibility: 'AFFILIATE_COMMUNITY',
        nextVisibility: 'AFFILIATE_COMMUNITY',
        currentStatus: 'ARCHIVED',
      }),
      'ARCHIVED',
    );
    const live = {
      creatorUserId: 'a',
      visibility: 'AFFILIATE_COMMUNITY' as const,
      moderationStatus: 'ACTIVE' as const,
      deletedAt: null,
    };
    assert.equal(isListedCommunity(live), true);
    assert.equal(canOtherAffiliateShare(live, 'b'), true);
    assert.equal(canViewPromoLanding(live, 'b'), true);
  });

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
    assert.equal(canViewPromoLanding(priv, 'mehmet'), false);
    assert.equal(canViewPromoLanding(priv, null), false);
    assert.equal(canViewPromoLanding(priv, 'tess'), true);
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

  it('accepts a QuickTime-branded H.264 MP4 and rejects HEVC in that container', async () => {
    function ftypMajor(major: string): Buffer {
      const brand = Buffer.alloc(4);
      brand.write(major, 0, 4, 'ascii');
      return box('ftyp', Buffer.concat([brand, Buffer.alloc(4)]));
    }
    const h264 = Buffer.concat([
      ftypMajor('qt  '),
      box('wide', Buffer.alloc(0)),
      box('moov', Buffer.concat([mvhdDuration(31_600), Buffer.from('avc1mp4a')])),
    ]);
    const accepted = inspectMp4(h264);
    assert.equal(accepted.ok, true);
    if (accepted.ok) assert.equal(accepted.durationMs, 31_600);
    assert.equal(validatePromoVideo(h264, 'video/mp4', 'homecheff algemeen cartoon promo.mp4').ok, true);
    const remote = await inspectMp4Source({
      length: h264.length,
      read: async (offset, length) => h264.subarray(offset, offset + length),
    });
    assert.equal(remote.ok, true);
    if (remote.ok) assert.equal(remote.durationMs, 31_600);
    const hevc = Buffer.concat([
      ftypMajor('qt  '),
      box('moov', Buffer.concat([mvhdDuration(10_000), Buffer.from('hvc1')])),
    ]);
    const rejected = inspectMp4(hevc);
    assert.equal(rejected.ok, false);
    if (!rejected.ok) assert.equal(rejected.error, 'unsupported_video_codec');
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
    assert.match(src, /moderationStatusForNewPromo/);
    assert.doesNotMatch(src, /actor\.isAdmin \? 'ACTIVE' : 'UNDER_REVIEW'/);
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

  it('one library classifies platform without baking a creator referral', () => {
    assert.equal(inferPromoPlatform({ destinationPath: '/onboarding/seller' }), 'MARKETPLACE');
    assert.equal(inferPromoPlatform({ destinationPath: '/delivery/signup' }), 'DELIVERY');
    assert.equal(inferPromoPlatform({ destinationPath: '/verdiencheck' }), 'ECOSYSTEM');
    assert.equal(inferPromoPlatform({ destinationPath: '/' }), 'ECOSYSTEM');
    assert.equal(inferPromoPlatform({ campaignTag: 'GROWTH', destinationPath: '/' }), 'GROWTH');
    const growth = promoShareAbsolute({ platform: 'GROWTH', shareSlug: 'abcdefgh' });
    assert.equal(growth.includes('ref='), false);
    assert.equal(growth, 'https://growth.homecheff.eu/');
    const shared = attributedPromoUrl({ shareSlug: 'abcdefgh', sharingReferralCode: 'VIEWER' });
    assert.match(shared, /ref=VIEWER/);
    assert.equal(shared.includes('CREATOR'), false);
    const studio = promoContinueHref({ campaignTag: 'STUDIO', sharingReferralCode: 'VIEWER' });
    assert.match(studio, /studio\.homecheff\.eu\/signup/);
    assert.match(studio, /ref=VIEWER/);
    assert.equal(promoLibraryPath({ platform: 'DELIVERY' }), '/affiliate/promotiemateriaal?platform=delivery');
    assert.equal(promoLibraryPath({}), '/affiliate/promotiemateriaal');
    const client = read('components/affiliate/AffiliatePromoLibraryClient.tsx');
    assert.match(client, /Materiaal toevoegen/);
    assert.match(client, /Deel met mijn link/);
    assert.match(client, /Afbeelding gebruiken/);
    assert.doesNotMatch(client, /overflow-x-auto/);
    const api = read('app/api/affiliate/media/route.ts');
    assert.match(api, /tab === 'all'/);
    assert.match(api, /creatorUserId: actor\.userId/);
    assert.doesNotMatch(api, /CommissionLedger/);
    const page = read('app/affiliate/promotiemateriaal/page.tsx');
    assert.match(page, /affiliateMayUsePromoLibrary/);
    const dash = read('app/affiliate/dashboard/page-client.tsx');
    assert.match(dash, /data-affiliate-library="marketplace"/);
    assert.match(dash, /data-affiliate-library="growth"/);
    assert.match(dash, /data-affiliate-library="studio"/);
    assert.match(dash, /data-affiliate-library="delivery"/);
    assert.match(dash, /GROWTH_DEMOS_HREF/);
  });

  it('client blob token route is authenticated and namespace-scoped', () => {
    const src = read('app/api/affiliate/media/blob/route.ts');
    assert.match(src, /handleUpload/);
    assert.match(src, /affiliate-media/);
    assert.match(src, /getPromoActor/);
    assert.match(src, /allowedContentTypes/);
    assert.match(src, /AFFILIATE_MEDIA_VIDEO_MAX_BYTES/);
    assert.match(src, /affiliateMediaBlobToken\(\)/);
    assert.match(src, /token,/);
  });

  it('signs client tokens with the Vercel Blob env name used in production', () => {
    const previousBlob = process.env.BLOB_READ_WRITE_TOKEN;
    const previousVercel = process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_store_secret';
    assert.equal(affiliateMediaBlobToken(), 'vercel_blob_rw_store_secret');
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_primary_secret';
    assert.equal(affiliateMediaBlobToken(), 'vercel_blob_rw_primary_secret');
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    assert.equal(affiliateMediaBlobToken(), undefined);
    if (previousBlob === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = previousBlob;
    if (previousVercel === undefined) delete process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    else process.env.VERCEL_BLOB_READ_WRITE_TOKEN = previousVercel;
  });
});

describe('affiliate promo upload repair', () => {
  const inspected = {
    ok: true as const,
    durationMs: 45_000,
    hasH264Hint: true,
    brands: 'isom',
  };

  it('accepts 47 MB and 55 MB mp4 metadata and rejects anything above 80 MB', () => {
    assert.equal(AFFILIATE_MEDIA_VIDEO_MAX_BYTES, 80 * 1024 * 1024);
    assert.ok(47 * 1024 * 1024 <= AFFILIATE_MEDIA_VIDEO_MAX_BYTES);
    assert.ok(55 * 1024 * 1024 <= AFFILIATE_MEDIA_VIDEO_MAX_BYTES);
    assert.equal(
      assertPromoVideoMeta({
        byteSize: 55 * 1024 * 1024,
        declaredMime: 'video/mp4',
        fileName: 'homecheff algemeen cartoon promo.mp4',
        inspected,
      }).ok,
      true,
    );
    assert.equal(
      assertPromoVideoMeta({
        byteSize: 47 * 1024 * 1024,
        declaredMime: 'video/mp4',
        fileName: 'promo.mp4',
        inspected,
      }).ok,
      true,
    );
    const tooBig = assertPromoVideoMeta({
      byteSize: AFFILIATE_MEDIA_VIDEO_MAX_BYTES + 1,
      declaredMime: 'video/mp4',
      fileName: 'promo.mp4',
      inspected,
    });
    assert.equal(tooBig.ok, false);
    if (!tooBig.ok) assert.equal(tooBig.error, 'video_too_large');
  });

  it('keeps the Next.js body under the Vercel 4.5 MB cap and sends larger videos direct to blob', () => {
    assert.ok(AFFILIATE_MEDIA_INLINE_MAX_BYTES <= 4 * 1024 * 1024);
    assert.ok(AFFILIATE_MEDIA_INLINE_MAX_BYTES < 4.5 * 1024 * 1024);
    assert.equal(affiliateMediaUploadTransport(3 * 1024 * 1024), 'inline');
    assert.equal(affiliateMediaUploadTransport(55 * 1024 * 1024), 'direct');
    const api = read('app/api/affiliate/media/route.ts');
    assert.match(api, /validateRemotePromoVideo/);
    assert.match(api, /shouldReuseExistingUpload/);
    assert.doesNotMatch(api, /sizeLimit/);
    const client = read('components/affiliate/AffiliatePromoLibraryClient.tsx');
    assert.match(client, /onUploadProgress/);
    assert.match(client, /affiliateMediaUploadTransport/);
    assert.match(client, /affiliateMediaUploadErrorMessage/);
    assert.doesNotMatch(client, /throw new Error\('upload_failed'\)/);
  });

  it('rejects invalid extensions and still accepts jpg, png and webp', () => {
    assert.equal(classifyAffiliatePromoFile('clip.mov', 'video/quicktime'), 'rejected');
    assert.equal(classifyAffiliatePromoFile('clip.webm', 'video/webm'), 'rejected');
    assert.equal(classifyAffiliatePromoFile('clip.mkv', 'video/x-matroska'), 'rejected');
    assert.equal(classifyAffiliatePromoFile('promo.mp4', 'video/mp4'), 'video');
    assert.equal(classifyAffiliatePromoFile('promo.mp4', ''), 'video');
    assert.equal(classifyAffiliatePromoFile('photo.jpg', 'image/jpeg'), 'image');
    assert.equal(classifyAffiliatePromoFile('photo.png', 'image/png'), 'image');
    assert.equal(classifyAffiliatePromoFile('photo.webp', 'image/webp'), 'image');
    assert.equal(classifyAffiliatePromoFile('anim.gif', 'image/gif'), 'rejected');
    const png = Buffer.alloc(24);
    png.set([0x89, 0x50, 0x4e, 0x47], 0);
    png.write('IHDR', 12, 'ascii');
    png.writeUInt32BE(32, 16);
    png.writeUInt32BE(32, 20);
    assert.equal(validatePromoImage(png, 'image/png').ok, true);
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]);
    assert.equal(validatePromoImage(webp, 'image/webp').ok, true);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    assert.equal(validatePromoImage(Buffer.concat([jpeg, Buffer.alloc(8)]), 'image/jpeg').ok, true);
  });

  it('reads duration from a moov atom after a large mdat without loading the payload', async () => {
    const head = ftyp();
    const mdatPayload = 50 * 1024 * 1024;
    const mdatHeader = Buffer.alloc(8);
    mdatHeader.writeUInt32BE(8 + mdatPayload);
    mdatHeader.write('mdat', 4, 'ascii');
    const moov = box('moov', mvhdDuration(30_000));
    const moovOffset = head.length + mdatHeader.length + mdatPayload;
    const length = moovOffset + moov.length;
    const calls: { offset: number; length: number }[] = [];
    const inspectedRemote = await inspectMp4Source({
      length,
      read: async (offset, size) => {
        calls.push({ offset, length: size });
        const out = Buffer.alloc(size);
        const place = (partOffset: number, data: Buffer) => {
          const start = Math.max(offset, partOffset);
          const end = Math.min(offset + size, partOffset + data.length);
          if (end > start) data.copy(out, start - offset, start - partOffset, end - partOffset);
        };
        place(0, head);
        place(head.length, mdatHeader);
        place(moovOffset, moov);
        return out;
      },
    });
    assert.equal(inspectedRemote.ok, true);
    if (inspectedRemote.ok) assert.equal(inspectedRemote.durationMs, 30_000);
    const downloaded = calls.reduce((sum, call) => sum + call.length, 0);
    assert.ok(downloaded < 3 * 1024 * 1024);
    assert.ok(calls.every((call) => call.length <= 2 * 1024 * 1024));
    assert.ok(downloaded < length / 10);

    const tooLong = box('moov', mvhdDuration(90_000));
    const long = await inspectMp4Source({
      length: head.length + tooLong.length,
      read: async (offset, size) => Buffer.concat([head, tooLong]).subarray(offset, offset + size),
    });
    const decision = assertPromoVideoMeta({
      byteSize: 12_000,
      declaredMime: 'video/mp4',
      fileName: 'long.mp4',
      inspected: long,
    });
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.equal(decision.error, 'video_too_long');
  });

  it('rejects HEVC stored in moov and keeps private material unlisted', async () => {
    const head = ftyp();
    const moov = box('moov', Buffer.concat([mvhdDuration(4_000), Buffer.from('hvc1')]));
    const hevc = await inspectMp4Source({
      length: head.length + moov.length,
      read: async (offset, size) => Buffer.concat([head, moov]).subarray(offset, offset + size),
    });
    assert.equal(hevc.ok, false);
    if (!hevc.ok) assert.equal(hevc.error, 'unsupported_video_codec');

    const priv = {
      creatorUserId: 'owner',
      visibility: 'PRIVATE' as const,
      moderationStatus: 'ACTIVE' as const,
      deletedAt: null,
    };
    assert.equal(isListedCommunity(priv), false);
    assert.equal(canOtherAffiliateShare(priv, 'other-affiliate'), false);
    assert.equal(isSafeForOpenGraphMedia(priv), false);
    const community = { ...priv, visibility: 'AFFILIATE_COMMUNITY' as const };
    assert.equal(isListedCommunity(community), true);
    assert.equal(canOtherAffiliateShare(community, 'other-affiliate'), true);
    const shared = attributedPromoUrl({ shareSlug: 'abcdefgh', sharingReferralCode: 'VIEWER' });
    assert.match(shared, /ref=VIEWER/);
    assert.equal(shared.includes('owner'), false);
  });

  it('reuses one record when the same stored file is saved again', () => {
    const mediaUrl = 'https://example.public.blob.vercel-storage.com/affiliate-media/asset/video.mp4';
    assert.equal(
      shouldReuseExistingUpload({
        existing: { mediaUrl, creatorUserId: 'owner', deletedAt: null },
        mediaUrl,
        creatorUserId: 'owner',
      }),
      true,
    );
    assert.equal(
      shouldReuseExistingUpload({
        existing: { mediaUrl, creatorUserId: 'owner', deletedAt: new Date() },
        mediaUrl,
        creatorUserId: 'owner',
      }),
      false,
    );
    assert.equal(
      shouldReuseExistingUpload({
        existing: { mediaUrl, creatorUserId: 'owner', deletedAt: null },
        mediaUrl,
        creatorUserId: 'someone-else',
      }),
      false,
    );
    assert.equal(storageKeyFromTrustedBlobUrl(mediaUrl), 'affiliate-media/asset/video.mp4');
    assert.equal(storageKeyFromTrustedBlobUrl('https://evil.com/affiliate-media/asset/video.mp4'), null);
    assert.equal(totalFromContentRange('bytes 0-0/57671680'), 57671680);
  });

  it('explains size, duration and storage failures in plain language', () => {
    assert.match(affiliateMediaUploadErrorMessage('video_too_large'), /80 MB/);
    assert.match(affiliateMediaUploadErrorMessage('video_too_long'), /60 seconden/);
    assert.match(affiliateMediaUploadErrorMessage('image_too_large'), /8 MB/);
    assert.match(affiliateMediaUploadErrorMessage('storage_unavailable'), /Opslag/);
    assert.match(affiliateMediaUploadErrorMessage('video_mp4_only'), /MP4/);
    assert.match(
      affiliateMediaUploadErrorMessage(
        'Body size of 57671680 bytes exceeds the maximum allowed size of 20971520 bytes',
      ),
      /80 MB/,
    );
    assert.match(affiliateMediaUploadErrorMessage('upload_token_failed'), /Opslag/);
    assert.match(affiliateMediaUploadErrorMessage('processing_timeout'), /niet opnieuw te worden geüpload/);
  });
});
