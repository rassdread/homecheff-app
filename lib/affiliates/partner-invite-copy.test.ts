/**
 * Partner invitation copy must describe 40% of the platform fee,
 * and must not present the MAIN override to the invited partner.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { partnerInviteEmailCopy } from '@/lib/affiliates/partner-invite-email-copy';
import { SUB_AFFILIATE_BUSINESS_COMMISSION_PCT } from '@/lib/affiliate-config';

const root = resolve(process.cwd());
const nl = JSON.parse(readFileSync(resolve(root, 'public/i18n/nl.json'), 'utf8'));
const en = JSON.parse(readFileSync(resolve(root, 'public/i18n/en.json'), 'utf8'));

function blob(node: unknown): string {
  return JSON.stringify(node);
}

describe('partner commercial explanation', () => {
  it('keeps the partner rate at 40% of the configured subscription/platform share', () => {
    assert.equal(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT, 0.4);
  });

  it('explains 40% of the platform fee to the MAIN before invite, in Dutch and English', () => {
    const nlOffer = blob(nl.partners.inviteOffer);
    const enOffer = blob(en.partners.inviteOffer);
    assert.match(nlOffer, /40% van de platformfee/);
    assert.match(nlOffer, /niet over het volledige aankoopbedrag/);
    assert.match(enOffer, /40% of the platform fee/);
    assert.match(enOffer, /not on the full purchase amount/);
    assert.doesNotMatch(nlOffer, /40% van iedere verkoop/);
    assert.doesNotMatch(enOffer, /40% of every sale/);
    assert.doesNotMatch(nlOffer, /downline|upline|MLM|subaffiliate/i);
  });

  it('explains the partner role on the acceptance page without the MAIN 10% split', () => {
    for (const signup of [nl.affiliate.subAffiliateSignup, en.affiliate.subAffiliateSignup]) {
      const text = blob(signup);
      assert.match(text, /40%/);
      assert.match(text, /€100|€20|€8|€100|£|\$100/);
      assert.doesNotMatch(text, /MAIN 10%|10% voor de MAIN|partner 40%.*main 10%/i);
      assert.doesNotMatch(text, /downline|upline|MLM|subaffiliate/i);
      assert.doesNotMatch(text, /gegarandeerde inkomsten|guaranteed income/i);
    }
    assert.match(blob(nl.affiliate.subAffiliateSignup), /niet over het volledige aankoopbedrag/);
    assert.match(blob(en.affiliate.subAffiliateSignup), /not on the full purchase amount/);
    assert.match(blob(nl.affiliate.subAffiliateSignup), /kan per product/);
    assert.match(blob(en.affiliate.subAffiliateSignup), /can differ/);
  });

  it('email states 40% of the platform fee and does not teach the MAIN split', () => {
    const dutch = partnerInviteEmailCopy({
      locale: 'nl',
      inviterName: 'Cert Main',
      url: 'https://homecheff.eu/affiliate/sub-affiliate-signup?token=abc',
      expiresLabel: '24-10-2026',
    });
    const english = partnerInviteEmailCopy({
      locale: 'en',
      inviterName: 'Cert Main',
      url: 'https://homecheff.eu/affiliate/sub-affiliate-signup?token=abc',
      expiresLabel: '24 Oct 2026',
    });
    assert.match(dutch.subject, /Affiliate Partner/);
    assert.match(dutch.text, /40% van de toepasselijke HomeCheff-platformfee/);
    assert.match(dutch.text, /niet over het volledige aankoopbedrag/);
    assert.match(dutch.text, /Bekijk je uitnodiging/);
    assert.match(english.text, /40% of the applicable HomeCheff platform fee/);
    assert.match(english.text, /not on the full purchase amount/);
    assert.match(english.html, /View your invitation/);
    assert.doesNotMatch(dutch.text + english.text, /10%/);
    assert.doesNotMatch(dutch.text, /wachtwoord is/);
  });
});
