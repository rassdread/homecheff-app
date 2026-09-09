import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildMailtoShareUrl,
  buildWhatsAppShareUrl,
  canUseWebShare,
  shouldPreferNativeShare,
  toAbsolutePublicUrl,
} from './listing-share';

describe('listing-share helpers', () => {
  it('keeps absolute https URLs', () => {
    assert.equal(
      toAbsolutePublicUrl('https://homecheff.eu/product/foo-hcid-abc'),
      'https://homecheff.eu/product/foo-hcid-abc',
    );
  });

  it('joins origin + relative listing path', () => {
    assert.equal(
      toAbsolutePublicUrl('/product/foo-hcid-abc', 'https://homecheff.eu'),
      'https://homecheff.eu/product/foo-hcid-abc',
    );
  });

  it('normalizes missing leading slash', () => {
    assert.equal(
      toAbsolutePublicUrl('product/foo-hcid-abc', 'https://homecheff.eu/'),
      'https://homecheff.eu/product/foo-hcid-abc',
    );
  });

  it('returns empty for blank input', () => {
    assert.equal(toAbsolutePublicUrl('  '), '');
  });

  it('reports web share availability from navigator', () => {
    assert.equal(typeof canUseWebShare(), 'boolean');
  });

  it('shouldPreferNativeShare is boolean (false in node)', () => {
    assert.equal(shouldPreferNativeShare(), false);
  });

  it('WhatsApp URL encodes title and final share URL', () => {
    const href = buildWhatsAppShareUrl(
      'https://homecheff.eu/werken-bij?ref=REFabc',
      'Verdien met HomeCheff',
    );
    assert.match(href, /^https:\/\/wa\.me\/\?text=/);
    assert.match(href, /werken-bij/);
    assert.match(href, /REFabc/);
    assert.doesNotMatch(href, /Delen als|binder|personal\/company/i);
  });

  it('mailto URL includes title and final URL', () => {
    const href = buildMailtoShareUrl(
      'https://homecheff.eu/a/acme-co',
      'Bezorgen',
      'Nodig een bezorger uit',
    );
    assert.match(href, /^mailto:\?subject=/);
    assert.match(href, /a%2Facme-co|a\/acme-co/);
    assert.doesNotMatch(href, /Delen als|binder/i);
  });
});
