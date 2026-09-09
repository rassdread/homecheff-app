/**
 * Social share expansion — payloads, destinations, OG safety, platform matrix.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOCIAL_SHARE_PLATFORM_MATRIX } from './platform-capability-matrix';
import {
  assertNoAffiliateLeakInOgFields,
  buildHomecheffSharePayload,
  formatShareForChannel,
  toCanonicalShareUrl,
} from './homecheff-share-payload';
import {
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  buildMailtoShareUrlFromPayload,
  buildWhatsAppShareUrlFromPayload,
  buildXShareUrlFromPayload,
} from './social-destination-urls';
import { getOpportunityShareCopy } from './opportunity-share-copy';
import { buildOpportunityOpenGraphMetadata, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from './og-opportunity';

const root = resolve(process.cwd());

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('platform capability matrix', () => {
  it('documents all required platforms', () => {
    const ids = SOCIAL_SHARE_PLATFORM_MATRIX.map((p) => p.platform);
    for (const need of [
      'whatsapp',
      'linkedin',
      'facebook',
      'instagram',
      'tiktok',
      'x',
      'email',
      'web_share',
    ]) {
      assert.ok(ids.includes(need as never), need);
    }
  });

  it('marks Instagram and TikTok as non-direct web share', () => {
    const ig = SOCIAL_SHARE_PLATFORM_MATRIX.find((p) => p.platform === 'instagram')!;
    const tt = SOCIAL_SHARE_PLATFORM_MATRIX.find((p) => p.platform === 'tiktok')!;
    assert.equal(ig.directWebShareSupported, false);
    assert.equal(tt.directWebShareSupported, false);
    assert.equal(ig.nativeShareRequired, true);
    assert.equal(tt.nativeShareRequired, true);
  });
});

describe('HomecheffSharePayload + channel formatters', () => {
  const personal = buildHomecheffSharePayload({
    opportunityId: 'hub',
    attributedUrl: 'https://homecheff.eu/werken-bij?ref=REFPERSON',
  });
  const company = buildHomecheffSharePayload({
    opportunityId: 'seller',
    attributedUrl: 'https://homecheff.eu/a/acme-co',
  });

  it('preserves personal and company attribution on clickable URL', () => {
    assert.match(personal.url, /ref=REFPERSON/);
    assert.match(company.url, /\/a\/acme-co/);
  });

  it('canonical URL strips affiliate identity', () => {
    assert.equal(toCanonicalShareUrl(personal.url), 'https://homecheff.eu/werken-bij');
    assert.equal(toCanonicalShareUrl(company.url), 'https://homecheff.eu/werken-bij');
  });

  it('WhatsApp payload includes opportunity copy + attributed URL', () => {
    const wa = buildWhatsAppShareUrlFromPayload(personal);
    assert.match(wa, /^https:\/\/wa\.me\/\?text=/);
    const decoded = decodeURIComponent(wa);
    assert.match(decoded, /manieren om mee te doen/);
    assert.match(decoded, /werken-bij\?ref=REFPERSON/);
  });

  it('LinkedIn share uses URL endpoint (OG provides preview)', () => {
    const href = buildLinkedInShareUrl(personal.url);
    assert.match(href, /linkedin\.com\/sharing\/share-offsite/);
    assert.match(href, /ref%3DREFPERSON|ref=REFPERSON/);
    const text = formatShareForChannel(personal, 'linkedin').text;
    assert.match(text, /HomeCheff bouwt/);
    assert.match(text, /#HomeCheff/);
  });

  it('Facebook share uses URL sharer', () => {
    const href = buildFacebookShareUrl(personal.url);
    assert.match(href, /facebook\.com\/sharer/);
    assert.match(href, /werken-bij/);
  });

  it('X payload stays short and includes URL', () => {
    const href = buildXShareUrlFromPayload(personal);
    assert.match(href, /twitter\.com\/intent\/tweet/);
    const decoded = decodeURIComponent(href);
    assert.ok(decoded.length < 400);
    assert.match(decoded, /werken-bij\?ref=REFPERSON/);
  });

  it('email payload has subject and body with URL', () => {
    const href = buildMailtoShareUrlFromPayload(personal);
    assert.match(href, /^mailto:\?subject=/);
    const decoded = decodeURIComponent(href);
    assert.match(decoded, /Verdien met HomeCheff/);
    assert.match(decoded, /ref=REFPERSON/);
  });

  it('Instagram / TikTok formatters produce captions without claiming a post', () => {
    const ig = formatShareForChannel(personal, 'instagram').text;
    const tt = formatShareForChannel(personal, 'tiktok').text;
    assert.match(ig, /werken-bij\?ref=REFPERSON/);
    assert.match(tt, /werken-bij\?ref=REFPERSON/);
    assert.doesNotMatch(ig, /geplaatst|posted to Instagram|published/i);
  });

  it('native share uses title + long text + url', () => {
    const n = formatShareForChannel(personal, 'native');
    assert.equal(n.title, 'Verdien met HomeCheff');
    assert.match(n.text, /Verkoop wat je maakt/);
    assert.equal(n.url, personal.url);
  });

  it('copy channel includes attributed URL', () => {
    const c = formatShareForChannel(company, 'copy');
    assert.match(c.text, /\/a\/acme-co/);
  });

  it('opportunity-specific copy differs across opportunities', () => {
    const hub = getOpportunityShareCopy('hub');
    const delivery = getOpportunityShareCopy('delivery_individual');
    const growth = getOpportunityShareCopy('growth');
    assert.notEqual(hub.longText, delivery.longText);
    assert.match(delivery.longText, /18\+/);
    assert.match(growth.longText, /Growth/);
    assert.match(growth.longText, /Marketplace/);
    assert.doesNotMatch(growth.longText, /gegandeerd inkomen van €/);
  });

  it('sheet lists social destinations and IG/TT fallbacks', () => {
    const src = read('components/share/HomecheffVisibleShareSheet.tsx');
    for (const needle of [
      'WhatsApp',
      'LinkedIn',
      'Facebook',
      'Instagram',
      'TikTok',
      'buildLinkedInShareUrl',
      'buildFacebookShareUrl',
      'buildXShareUrlFromPayload',
      'instagramHint',
      'tiktokHint',
    ]) {
      assert.match(src, new RegExp(needle));
    }
    assert.doesNotMatch(src, /Delen als personal|binder/);
  });
});

describe('OG metadata safety', () => {
  it('OG fields use 1200x630 and no affiliate leak', () => {
    assert.equal(OG_IMAGE_WIDTH, 1200);
    assert.equal(OG_IMAGE_HEIGHT, 630);
    const meta = buildOpportunityOpenGraphMetadata('affiliate', 'nl');
    const og = meta.openGraph as {
      title?: string;
      description?: string;
      url?: string;
      images?: { url: string }[];
    };
    assert.ok(og.title);
    assert.ok(og.description);
    assert.match(String(og.images?.[0]?.url), /\/api\/og\/opportunity\?id=affiliate/);
    assert.ok(
      assertNoAffiliateLeakInOgFields({
        title: String(og.title),
        description: String(og.description),
        imageUrl: String(og.images?.[0]?.url),
        canonicalUrl: String(og.url),
      }),
    );
  });

  it('OG API route exists and themes Studio/Growth separately', () => {
    const src = read('app/api/og/opportunity/route.tsx');
    assert.match(src, /ecosystemOgTheme/);
    assert.match(src, /ogHeadline/);
    assert.doesNotMatch(src, /ref=|\/a\/\[/);
    const theme = read('lib/share/og-opportunity.ts');
    assert.match(theme, /HomeCheff Studio/);
    assert.match(theme, /HomeCheff Growth/);
  });

  it('dual-context chooser terminology preserved', () => {
    const src = read('components/share/AffiliatePromoteChooser.tsx');
    assert.match(src, /Voor wie promoot je\?/);
    assert.doesNotMatch(src, /Delen als personal/);
  });
});
