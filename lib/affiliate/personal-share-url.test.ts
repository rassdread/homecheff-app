/**
 * Personal affiliate QR / copy / share must be one URL, and that URL
 * is the first-touch landing that registers hc_ref.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { REFERRAL_COOKIE_NAME } from '@/lib/affiliate-attribution-contract';
import {
  referralCodeFromPersonalShareUrl,
  resolveAffiliatePersonalShareUrl,
} from '@/lib/affiliate/personal-share-url';
import { buildPersonalReferralUrl } from '@/lib/affiliates/personal-referral';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('personal affiliate share url', () => {
  it('prefers the dashboard referral link and otherwise builds /welkom/{code}', () => {
    assert.equal(
      resolveAffiliatePersonalShareUrl({
        referralLink: 'https://homecheff.eu/welkom/REFABC',
        referralCode: 'OTHER',
      }),
      'https://homecheff.eu/welkom/REFABC',
    );
    assert.equal(
      resolveAffiliatePersonalShareUrl({
        referralCode: 'REFABC',
        origin: 'https://homecheff.eu',
      }),
      buildPersonalReferralUrl('https://homecheff.eu', 'REFABC'),
    );
    assert.equal(referralCodeFromPersonalShareUrl('https://homecheff.eu/welkom/REFABC'), 'REFABC');
  });

  it('QR, copy and share in the dashboard card use the same shareUrl', () => {
    const card = read('components/affiliate/AffiliatePersonalShareCard.tsx');
    assert.match(card, /resolveAffiliatePersonalShareUrl/);
    assert.match(card, /value=\{shareUrl\}/);
    assert.match(card, /clipboard\.writeText\(shareUrl\)/);
    assert.match(card, /QRCode\.toDataURL\(shareUrl/);
    assert.match(card, /data-affiliate-copy-link/);
    assert.match(card, /data-affiliate-open-share/);
    assert.match(card, /setSheetOpen\(true\)/);
    assert.match(card, /data-affiliate-qr/);
    assert.match(card, /Deel mijn affiliate-link/);
    assert.match(card, /Link gekopieerd/);
    assert.match(card, /AffiliatePersonalShareSheet/);
    assert.match(card, /overflow-x-hidden/);
    assert.doesNotMatch(card, /shareListingOrCopy/);
    assert.doesNotMatch(card, /affiliate-config/);
  });

  it('share sheet uses one url for QR, copy, native share and socials', () => {
    const sheet = read('components/affiliate/AffiliatePersonalShareSheet.tsx');
    assert.match(sheet, /resolveAffiliatePersonalShareUrl/);
    assert.match(sheet, /value=\{shareUrl\}/);
    assert.match(sheet, /clipboard\.writeText\(shareUrl\)/);
    assert.match(sheet, /QRCode\.toDataURL\(shareUrl/);
    assert.match(sheet, /url: shareUrl/);
    assert.match(sheet, /buildSingleUrlWhatsAppHref\(shareUrl/);
    assert.match(sheet, /buildFacebookShareUrl\(shareUrl\)/);
    assert.match(sheet, /buildLinkedInShareUrl\(shareUrl\)/);
    assert.match(sheet, /encodeURIComponent\(shareUrl\)/);
    assert.match(sheet, /data-affiliate-native-share/);
    assert.match(sheet, /data-affiliate-share-whatsapp/);
    assert.match(sheet, /data-affiliate-share-facebook/);
    assert.match(sheet, /data-affiliate-share-linkedin/);
    assert.match(sheet, /data-affiliate-share-x/);
    assert.match(sheet, /data-affiliate-share-email/);
    assert.match(sheet, /Link gekopieerd/);
    assert.match(sheet, /Scan om HomeCheff via mij te bekijken/);
    assert.match(sheet, /safe-area-inset-bottom/);
    const modal = read('components/affiliate/AffiliateQuickShareModal.tsx');
    assert.match(modal, /AffiliatePersonalShareSheet/);
  });

  it('dashboard API, landing and cookie registration use the same code', () => {
    const dash = read('app/api/affiliate/dashboard/route.ts');
    assert.match(dash, /buildPersonalReferralUrl/);
    assert.match(dash, /referralLink: referralLinkUrl/);
    const welkom = read('app/welkom/[code]/page.tsx');
    assert.match(welkom, /\/api\/affiliate\/referral\?code=/);
    const route = read('app/api/affiliate/referral/route.ts');
    assert.match(route, /response\.cookies\.set\(REFERRAL_COOKIE_NAME, code/);
    assert.match(route, /existingRef/);
    const attribution = read('lib/affiliate-attribution.ts');
    assert.match(attribution, /export async function processAttributionOnSignup/);
    assert.match(attribution, /AttributionSource\.REF_LINK/);
    assert.equal(REFERRAL_COOKIE_NAME, 'hc_ref');
  });
});

describe('affiliate share placement', () => {
  it('puts the personal card above platform promotion and below only a short status', () => {
    const screen = read('app/affiliate/dashboard/screen.tsx');
    assert.match(screen, /AffiliatePersonalShareCard/);
    assert.match(screen, /place === 'overzicht' \|\| place === 'promoten'/);
    assert.match(screen, /Boolean\(existingCode\)/);
    assert.match(screen, /referralLinks/);
    assert.match(screen, /referralCode=\{existingCode\}/);
    assert.match(screen, /referralLink=\{existingShareLink\}/);
    assert.match(screen, /serverShareState=\{existingCode \? 'present' : 'missing'\}/);
    assert.doesNotMatch(screen, /ensurePersonalReferralLink/);
    const card = read('components/affiliate/AffiliatePersonalShareCard.tsx');
    assert.match(card, /latchedUrl/);
    assert.match(card, /data-affiliate-share-next-to-link/);
    assert.match(card, /data-affiliate-share-with-qr/);
    assert.doesNotMatch(card, /setFetchedCode\(json\.code \|\| null\)/);
    assert.doesNotMatch(card, /json\.code \|\| null/);
    const route = read('app/api/affiliate/referral-link/route.ts');
    assert.match(route, /Cache-Control': 'private, no-store, max-age=0'/);
    const sheet = read('components/affiliate/AffiliatePersonalShareSheet.tsx');
    assert.match(sheet, /useAffiliatePersonalShareSeed/);
    const shell = read('components/operations/OperationsShell.tsx');
    const leadAt = shell.indexOf('{lead ?');
    const stripAt = shell.indexOf('<OperationsInlineStrip');
    assert.ok(leadAt > 0 && leadAt < stripAt);
  });

  it('keeps the desktop sidebar QR and adds a mobile promote route', () => {
    const shell = read('components/operations/OperationsShell.tsx');
    assert.match(shell, /data-operations-sidepanel-rail/);
    assert.match(shell, /xl:block/);
    const widget = read('components/operations/widgets/PartnersGrowthWidget.tsx');
    assert.match(widget, /AffiliateQuickShareModal/);
    assert.match(widget, /setQrOpen\(true\)/);
    const nav = read('components/my-homecheff/AffiliateAreaNav.tsx');
    assert.match(nav, /data-affiliate-nav/);
    assert.match(nav, /promoten/);
    const drawer = read('components/operations/OperationsOverviewDrawer.tsx');
    assert.match(drawer, /affiliate-menu-promote/);
    assert.match(drawer, /affiliate-menu-overview/);
    assert.match(drawer, /affiliate-menu-earnings/);
    assert.match(drawer, /affiliate-menu-network/);
    assert.match(drawer, /affiliate-menu-promo-media/);
    assert.match(drawer, /\/affiliate\/dashboard\/promoten/);
    assert.match(drawer, /\/affiliate\/dashboard\/verdiensten/);
    assert.match(drawer, /\/affiliate\/dashboard\/netwerk/);
    const hub = read('components/my-homecheff/MyHomeCheffHubCard.tsx');
    assert.match(hub, /AffiliatePersonalShareSheet/);
    assert.match(hub, /setShareOpen\(true\)/);
    assert.doesNotMatch(hub, /clipboard\?\.writeText\(referralLink\)/);
    const strip = read('components/operations/OperationsInlineStrip.tsx');
    const tasksAt = strip.indexOf('<OperationsTasksSection');
    const openBefore = strip.lastIndexOf('<button', tasksAt);
    const closeBefore = strip.lastIndexOf('</button>', tasksAt);
    assert.ok(tasksAt > 0);
    assert.ok(closeBefore > openBefore);
  });

  it('does not change platform share targets', () => {
    const share = read('components/affiliate/AffiliateShareCenter.tsx');
    for (const id of ['seller', 'growth', 'studio', 'delivery_individual']) {
      assert.match(share, new RegExp(`id: '${id}'`));
    }
    assert.match(share, /EcosystemShareAction/);
  });
});
