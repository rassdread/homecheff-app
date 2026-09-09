/**
 * Visible share presentation + terminology regressions for Verdien hub.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildMailtoShareUrl,
  buildWhatsAppShareUrl,
  shouldPreferNativeShare,
} from './listing-share';

const root = resolve(process.cwd());

function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('visible share panel contract', () => {
  it('HomecheffVisibleShareSheet exposes WhatsApp, email, copy + socials', () => {
    const src = read('components/share/HomecheffVisibleShareSheet.tsx');
    assert.match(src, /WhatsApp/);
    assert.match(src, /E-mail|email/i);
    assert.match(src, /Link kopiëren|copyLink/);
    assert.match(src, /LinkedIn/);
    assert.match(src, /Instagram/);
    assert.match(src, /TikTok/);
    assert.match(src, /buildWhatsAppShareUrlFromPayload|buildWhatsAppShareUrl/);
    // Copied confirmation must not reset when parent re-creates onClose.
    assert.match(src, /setCopied\(false\)/);
    assert.match(src, /}, \[open\]\);/);
    assert.doesNotMatch(src, /Delen als personal|Delen als company|binder|referral type/i);
  });

  it('EcosystemShareAction uses visible sheet on non-native path', () => {
    const src = read('components/share/EcosystemShareAction.tsx');
    assert.match(src, /HomecheffVisibleShareSheet/);
    assert.match(src, /shouldPreferNativeShare/);
    assert.match(src, /openSheetWithUrl/);
    assert.match(src, /buildHomecheffSharePayload/);
    assert.doesNotMatch(src, /preparedUrl|preparingCompanyLink|Nu delen/);
  });

  it('desktop must not rely solely on navigator.share', () => {
    assert.equal(shouldPreferNativeShare(), false);
    const listing = read('lib/share/listing-share.ts');
    assert.match(listing, /shouldPreferNativeShare/);
    assert.match(listing, /needs_visible_panel/);
  });

  it('destination builders preserve personal and company URLs', () => {
    const personal = buildWhatsAppShareUrl(
      'https://homecheff.eu/werken-bij?ref=REF1234',
      'Hub',
    );
    const company = buildMailtoShareUrl(
      'https://homecheff.eu/a/acme',
      'Hub',
    );
    assert.match(personal, /ref%3DREF1234|ref=REF1234/);
    assert.match(company, /a%2Facme|a\/acme/);
  });

  it('AffiliatePromoteChooser keeps human dual-context copy fallbacks', () => {
    const src = read('components/share/AffiliatePromoteChooser.tsx');
    assert.match(src, /Voor wie promoot je\?/);
    assert.match(src, /Voor mezelf/);
    assert.match(src, /Voor mijn bedrijf/);
    assert.doesNotMatch(src, /Delen als personal|Delen als company/);
  });
});
