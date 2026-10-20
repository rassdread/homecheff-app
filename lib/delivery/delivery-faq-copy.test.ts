/**
 * Courier FAQ copy. Does not read or change the agreement snapshot.
 * Run: npx tsx --test lib/delivery/delivery-faq-copy.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  agreementContentHash,
  DELIVERY_AGREEMENT_VERSION,
} from './delivery-agreement-version';

function faq(language: 'nl' | 'en') {
  const file = language === 'nl' ? 'public/i18n/nl.json' : 'public/i18n/en.json';
  return JSON.parse(readFileSync(file, 'utf8')).faq.delivery;
}

describe('courier FAQ', () => {
  it('says a private courier does not have to be an entrepreneur', () => {
    const nl = faq('nl');
    const en = faq('en');
    assert.equal(nl['20'].question, 'Moet ik ondernemer zijn om te bezorgen?');
    assert.match(nl['20'].answer, /incidenteel bezorgopdrachten/);
    assert.match(nl['20'].answer, /regelmatig of beroepsmatig/);
    assert.doesNotMatch(nl['20'].answer, /belastingvrij/);
    assert.equal(en['20'].question, 'Do I have to be an entrepreneur to deliver?');
    assert.match(en['20'].answer, /occasional delivery assignments/);
    assert.match(readFileSync('app/faq/page.tsx', 'utf8'), /getItem\('delivery', 20\)/);
  });

  it('does not call every courier a self-employed entrepreneur', () => {
    const nl = faq('nl');
    const en = faq('en');
    for (const key of ['5', '6', '8', '9', '10', '20']) {
      assert.doesNotMatch(nl[key].answer, /ben je zelfstandige ondernemer/);
      assert.doesNotMatch(en[key].answer, /you are a self-employed entrepreneur/i);
    }
    assert.match(nl['6'].answer, /incidentele bezorging/);
    assert.match(nl['6'].answer, /fiscale gevolgen/);
    assert.match(nl['6'].answer, /garandeert geen inkomsten/);
    assert.match(en['6'].answer, /does not guarantee income/);
  });

  it('keeps insurance FAQ aligned with the current agreement and does not change the hash', () => {
    const nl = faq('nl');
    const en = faq('en');
    assert.match(nl['7'].answer, /geen algemene verplichting/);
    assert.match(nl['7'].answer, /€1\.000\.000/);
    assert.match(nl['7'].answer, /ongevallenverzekering/);
    assert.match(nl['10'].answer, /geen algemene verplichting/);
    assert.match(en['7'].answer, /does not set a general requirement/);
    assert.match(en['10'].answer, /at least €1,000,000|€1,000,000/);
    assert.equal(DELIVERY_AGREEMENT_VERSION, 'delivery-agreement-2026-10-20');
    assert.equal(
      agreementContentHash('nl'),
      '78f6d521f98ed77376cbb868f089d055ec81193161e1816278af5477ba2b80ca',
    );
    assert.equal(
      agreementContentHash('en'),
      'dc95ea2395c827dfb58f870704ab889cb830fb6f8a6afb071d2e3c2149d3c24e',
    );
  });
});
