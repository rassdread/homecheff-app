import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canUseWebShare, toAbsolutePublicUrl } from './listing-share';

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
});
