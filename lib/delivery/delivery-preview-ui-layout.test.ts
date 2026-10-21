/**
 * Layout guards for the preview UI fixes.
 * No database. Run: npx tsx --test lib/delivery/delivery-preview-ui-layout.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('delivery preview ui layout', () => {
  it('keeps the agreement footer inside a scrolling panel', () => {
    const modal = read('components/delivery/DeliveryAgreementModal.tsx');
    assert.match(modal, /--hc-cookie-banner-offset/);
    assert.match(modal, /createPortal\(/);
    assert.match(modal, /document\.body/);
    assert.match(modal, /z-\[110\]/);
    assert.doesNotMatch(modal, /z-\[75\]/);
    assert.match(modal, /max-h-full/);
    assert.match(modal, /min-h-0 flex-1 overflow-y-auto/);
    assert.match(modal, /shrink-0 justify-end/);
    assert.match(modal, /onClick=\{onClose\}/);
    assert.doesNotMatch(modal, /max-h-\[calc\(90vh-120px\)\]/);
    assert.doesNotMatch(modal, /setAccept|acceptDeliveryAgreement/);
  });

  it('lets the homepage headline wrap on a narrow screen', () => {
    const hero = read('components/home/HomeHeroSection.tsx');
    const title = hero.slice(hero.indexOf('id="home-compact-header-title"'), hero.indexOf('homePhase1.orientationTitle'));
    assert.match(title, /whitespace-normal/);
    assert.match(title, /flex-1/);
    assert.doesNotMatch(title, /\btruncate\b/);
    assert.match(hero, /orientationTitle/);
  });

  it('keeps signup actions above the cookie bar without dismissing consent', () => {
    const notice = read('components/PrivacyNotice.tsx');
    const company = read('app/delivery/company/signup/page.tsx');
    const personal = read('app/delivery/signup/page.tsx');
    assert.match(notice, /--hc-cookie-banner-offset/);
    assert.match(notice, /handleOnlyNecessary/);
    assert.match(notice, /ANALYTICS_CONSENT_KEY/);
    assert.match(notice, /MARKETING_CONSENT_KEY/);
    assert.doesNotMatch(notice, /setMode\('hidden'\)[\s\S]{0,80}useLayoutEffect/);
    for (const page of [company, personal]) {
      assert.match(page, /sticky z-\[70\]/);
      assert.match(page, /var\(--hc-cookie-banner-offset, 0px\)/);
    }
  });

  it('uses neutral courier wording outside the versioned agreement', () => {
    const surfaces = [
      'components/delivery/TeenDeliveryInfo.tsx',
      'components/delivery/CommunityDeliveryInfo.tsx',
      'lib/role-requirements.ts',
      'lib/share/opportunity-share-copy.ts',
      'lib/i18n/verdienHubSources.ts',
    ];
    for (const file of surfaces) {
      const source = read(file);
      assert.doesNotMatch(source, /zelfstandige bezorgaanbieder/);
      assert.doesNotMatch(source, /independent delivery provider/);
    }
    const nl = JSON.parse(read('public/i18n/nl.json'));
    const en = JSON.parse(read('public/i18n/en.json'));
    assert.equal(nl.checkout.teenDeliveryDescription, 'Laten bezorgen door een bezorger via HomeCheff');
    assert.equal(en.checkout.teenDeliveryDescription, 'Delivered by a courier via HomeCheff');
    assert.match(nl.deliveryStart.subtitle, /geen werkgever/);
    assert.match(nl.deliveryStart.subtitle, /particulier/);
    assert.match(en.deliveryStart.subtitle, /private courier/);
    assert.match(en.deliveryStart.subtitle, /business courier/);
    assert.match(read('components/delivery/CommunityDeliveryInfo.tsx'), /niet door HomeCheff/);
    assert.match(nl.deliverySignup.taxes1, /niet automatisch een zelfstandige ondernemer/);
    assert.match(en.deliverySignup.taxes1, /not automatically a self-employed entrepreneur/);
    assert.match(nl.deliverySignup.insurance3, /€1\.000\.000/);
    assert.match(en.deliverySignup.insurance3, /€1,000,000/);
  });
});
