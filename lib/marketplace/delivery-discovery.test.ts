import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

const geo = read('../../components/feed/GeoFeed.tsx');
const tile = read('../../components/feed/DeliveryRequestFeedTile.tsx');
const toolbar = read('../../components/feed/FeedMobileToolbar.tsx');
const request = read('../../components/delivery/StandaloneDeliveryRequest.tsx');
const cleanup = read('../session-cleanup.ts');
const quote = read('../../app/api/delivery/standalone/quote/route.ts');
const nl = read('../../public/i18n/nl.json');
const en = read('../../public/i18n/en.json');
const nav = read('../../components/NavBar.tsx');

function between(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `missing section ${start}`);
  return source.slice(from, to);
}

describe('marketplace delivery discovery', () => {
  it('places Bezorging beside the existing view chips, not in the main nav', () => {
    const chips = between(geo, 'const viewModeChipsEl', 'const filterPanelBodyEl');
    const viewLoop = chips.indexOf('DISCOVERY_VIEW_CHIP_OPTIONS.map');
    const entry = chips.indexOf('data-marketplace-delivery="entry"');
    assert.ok(viewLoop >= 0 && entry > viewLoop);
    assert.match(chips, /t\("marketplace\.canonical\.view\.delivery"\)/);
    assert.match(toolbar, /data-marketplace-delivery="entry"/);
    assert.match(toolbar, /DISCOVERY_VIEW_CHIP_OPTIONS\.map/);
    assert.equal(nav.includes('data-marketplace-delivery'), false);
    assert.equal(nav.includes('marketplace.canonical.view.delivery'), false);
    assert.match(nl, /"delivery": "Bezorging"/);
    assert.match(en, /"delivery": "Delivery"/);
  });

  it('places one delivery tile after the first offer and hides it while the form is open', () => {
    assert.match(tile, /data-marketplace-delivery="feed-tile"/);
    assert.match(geo, /DeliveryRequestFeedTile/);
    assert.match(geo, /saleCount === 1 && deliveryFeedTileEl/);
    assert.match(geo, /displayCount === 0 && deliveryFeedTileEl/);
    assert.match(geo, /deliveryTile: true/);
    assert.match(geo, /deliveryTile: displayCount > 0/);
    assert.equal(geo.includes('recirculatedRows as typeof feedRowsToRender,\n                { deliveryTile'), false);
    assert.match(nl, /"title": "Iets laten bezorgen\?"/);
    assert.match(nl, /"body": "Verstuur een pakket of laat iets groots ophalen, zoals een kast\."/);
    assert.match(nl, /"action": "Bezorging aanvragen"/);
    assert.match(geo, /homeCheffDeliveryEnabled && deliveryAreaCovered && !deliveryRequestOpen/);
    assert.match(geo, /setDeliveryAreaCovered\(data\.deliveryCoverage === true\)/);
    assert.match(geo, /deliveryCoverageKeyRef\.current !== requestKey/);
    assert.match(geo, /onClose=\{closeDeliveryRequest\}/);
  });

  it('opens the existing standalone request and restores the feed from another view', () => {
    const results = between(geo, 'const feedResultsBlock', 'searchContextBarEl');
    assert.match(results, /deliveryRequestOpen \?/);
    assert.match(results, /data-marketplace-delivery-panel="1"/);
    assert.match(results, /<StandaloneDeliveryRequest embedded/);
    const select = between(geo, 'const selectFeedView', 'const handlePlaceInput');
    assert.match(select, /setDeliveryRequestOpen\(false\)/);
    assert.match(select, /searchParams\.delete\("bezorging"\)/);
  });

  it('keeps category filters independent of the delivery panel', () => {
    const vertical = between(geo, 'const selectVerticalChip', 'const onMarketplaceSearchChange');
    assert.equal(vertical.includes('setDeliveryRequestOpen'), false);
    assert.match(vertical, /setAppliedCategory\(slug\)/);
    const chips = between(geo, 'const viewModeChipsEl', 'const filterPanelBodyEl');
    assert.match(chips, /CATEGORY_CHIP_OPTIONS\.map/);
    assert.match(chips, /selectVerticalChip\(slug\)/);
  });

  it('returns login to Bezorging and keeps the delivery draft', () => {
    assert.match(request, /const back = embedded \? '\/\?bezorging=1' : '\/bezorging\/aanvragen'/);
    assert.match(request, /callbackUrl=\$\{encodeURIComponent\(back\)\}/);
    assert.match(request, /sessionStorage\.setItem\(DELIVERY_DRAFT_KEY/);
    assert.equal(cleanup.split("'hc-standalone-delivery-draft'").length - 1, 3);
    assert.match(quote, /if \(!userId\)/);
    assert.ok(quote.indexOf('if (!userId)') < quote.indexOf('createStandaloneQuote('));
  });

  it('keeps payment disabled until the courier accepts', () => {
    assert.match(request, /if \(!booked\?\.paymentAvailable\) return;/);
    assert.match(request, /disabled=\{busy \|\| !booked\.paymentAvailable\}/);
    assert.match(request, /Wacht op bevestiging van deze bezorger/);
  });
});
