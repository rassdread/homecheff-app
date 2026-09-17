import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildExactlyOnceWebShareData,
  buildSingleUrlWhatsAppHref,
  composeSingleUrlShareBody,
  countDestinationUrlsInNativePayload,
  countHttpUrls,
  simulateAndroidChromeShareText,
  stripUrlFromShareText,
} from './exactly-once-share';
import {
  buildHomecheffSharePayload,
  formatShareForChannel,
} from './homecheff-share-payload';
import { buildWhatsAppShareUrlFromPayload } from './social-destination-urls';

const DEST = 'https://homecheff.eu/werken-bij?ref=REFPERSON';

describe('exactly-once share payloads', () => {
  it('documents the production duplicate: URL in text AND url → 2–3 Chrome/WhatsApp unfurls', () => {
    const broken = {
      title: 'Verdien met HomeCheff',
      text: `Ken jij mensen die bij HomeCheff passen?\n\n${DEST}`,
      url: DEST,
    };
    const chromeText = simulateAndroidChromeShareText(broken);
    assert.equal(countHttpUrls(chromeText), 2);
    assert.equal(countHttpUrls(`${broken.title}\n${broken.text}\n${broken.url}`), 2);
  });

  it('native Web Share data never embeds the destination URL in text', () => {
    const data = buildExactlyOnceWebShareData({
      title: 'Verdien met HomeCheff',
      text: `Ken jij mensen die bij HomeCheff passen?\n\n${DEST}`,
      url: DEST,
    });
    assert.equal(data.url, DEST);
    assert.equal(countHttpUrls(String(data.text || '')), 0);
    assert.equal(countHttpUrls(String(data.title || '')), 0);
    assert.equal(countDestinationUrlsInNativePayload(data), 1);
  });

  it('strips URL variants already present in listing descriptions', () => {
    const cleaned = stripUrlFromShareText(
      `Lekkere pasta ${DEST} en nog eens https://homecheff.eu/werken-bij?ref=REFPERSON`,
      DEST,
    );
    assert.equal(countHttpUrls(cleaned), 0);
    assert.match(cleaned, /Lekkere pasta/);
  });

  it('strips protocol-less host paths like homecheff.eu/app from captions', () => {
    const data = buildExactlyOnceWebShareData({
      title: 'Deel de HomeCheff-app',
      text: 'Installeer HomeCheff via Google Play: homecheff.eu/app',
      url: 'https://homecheff.eu/app?ref=REF1',
    });
    assert.equal(countHttpUrls(String(data.text || '')), 0);
    assert.doesNotMatch(String(data.text || ''), /homecheff\.eu\/app/);
    assert.equal(countDestinationUrlsInNativePayload(data), 1);
  });

  it('WhatsApp wa.me body contains the destination URL exactly once', () => {
    const href = buildSingleUrlWhatsAppHref(DEST, 'Verdien met HomeCheff', `${DEST} ${DEST}`);
    const decoded = decodeURIComponent(href.replace(/^https:\/\/wa\.me\/\?text=/, ''));
    assert.equal(countHttpUrls(decoded), 1);
    assert.match(decoded, /ref=REFPERSON/);
  });

  it('opportunity native formatter + exactly-once builder = 1 destination URL', () => {
    const payload = buildHomecheffSharePayload({
      opportunityId: 'hub',
      attributedUrl: DEST,
    });
    const native = formatShareForChannel(payload, 'native');
    const data = buildExactlyOnceWebShareData(native);
    assert.equal(countHttpUrls(native.text), 0);
    assert.equal(countDestinationUrlsInNativePayload(data), 1);
  });

  it('WhatsApp channel formatter used for wa.me still has exactly one URL', () => {
    const payload = buildHomecheffSharePayload({
      opportunityId: 'hub',
      attributedUrl: DEST,
    });
    const href = buildWhatsAppShareUrlFromPayload(payload);
    const decoded = decodeURIComponent(href.replace(/^https:\/\/wa\.me\/\?text=/, ''));
    assert.equal(countHttpUrls(decoded), 1);
  });

  it('Instagram/TikTok clipboard may include URL once; native share must not duplicate it', () => {
    const payload = buildHomecheffSharePayload({
      opportunityId: 'affiliate',
      attributedUrl: DEST,
    });
    const ig = formatShareForChannel(payload, 'instagram');
    assert.equal(countHttpUrls(ig.text), 1);
    const native = buildExactlyOnceWebShareData({
      title: ig.title,
      text: ig.text,
      url: ig.url,
    });
    assert.equal(countDestinationUrlsInNativePayload(native), 1);
  });

  it('composeSingleUrlShareBody collapses accidental triple concatenation', () => {
    const body = composeSingleUrlShareBody(`${DEST}\n${DEST}`, DEST, DEST);
    assert.equal(countHttpUrls(body), 1);
  });
});
