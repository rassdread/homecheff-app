/**
 * VerdienCheck share + affiliate attribution — reuse existing ?ref= / hc_ref stack.
 *
 *   npx tsx scripts/test-verdiencheck-affiliate-share.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { inspectVerdienCheckAnalyticsPayload } from '../lib/verdiencheck/privacy/analytics-guard';
import { FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS } from '../lib/verdiencheck/privacy/analytics-guard';
import { verdiencheckPageMetadata } from '../lib/verdiencheck/public-seo';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import {
  buildVerdienCheckShareUrl,
  canonicalVerdienCheckUrl,
  countRefAttribution,
  shareUrlContainsFinancialState,
  verdienCheckNativeShareData,
  verdienCheckShareUrlOccurrenceGuards,
  verdienCheckWhatsAppHref,
} from '../lib/verdiencheck/share-url';
import { appendPersonalRef, listingPathFromAbsolute, resolveShareMode } from '../lib/share/resolve-marketplace-share-url';
import { buildHomecheffSharePayload, formatShareForChannel, toCanonicalShareUrl } from '../lib/share/homecheff-share-payload';
import { getOpportunityShareCopy } from '../lib/share/opportunity-share-copy';
import { OPPORTUNITY_DESTINATIONS } from '../lib/share/ecosystem-opportunities';
import {
  mergeOfficialVerdienCheckPromo,
  officialVerdienCheckPromoAsset,
  OFFICIAL_VERDIENCHECK_PROMO_ID,
} from '../lib/affiliate-media/official-verdiencheck';
import { sanitizeDestinationPath } from '../lib/affiliate-media/destination';
import { REFERRAL_COOKIE_NAME } from '../lib/affiliate-attribution-contract';
import { VERDIENCHECK_FUNNEL_EVENTS } from '../lib/analytics/verdiencheck-funnel';
import { moneyQuestionIds, isFinancialScenarioQuestion } from '../lib/verdiencheck/wizard/schema';
import { EMPTY_WIZARD_STATE } from '../lib/verdiencheck/wizard/schema';

const ROOT = process.cwd();
function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

const nl = getVerdienCheckCopy('nl');
const affiliateCode = 'REFAFFILIATEA';

const anonymous = buildVerdienCheckShareUrl({});
const affiliate = buildVerdienCheckShareUrl({ referralCode: affiliateCode });
const dirtyAttempt = appendPersonalRef(
  'https://homecheff.eu/verdiencheck?income=3200&partner=1&scenario=2500&result=1337',
  affiliateCode,
);

assert.equal(anonymous, canonicalVerdienCheckUrl());
assert.equal(countRefAttribution(anonymous), 0);
assert.equal(shareUrlContainsFinancialState(anonymous), false);

assert.match(affiliate, /\/verdiencheck\?ref=REFAFFILIATEA$/);
assert.equal(countRefAttribution(affiliate), 1);
assert.equal(shareUrlContainsFinancialState(affiliate), false);
assert.equal(countRefAttribution(appendPersonalRef(affiliate, affiliateCode)), 1);

assert.equal(shareUrlContainsFinancialState(dirtyAttempt), true, 'financial keys must be detected');
assert.equal(
  buildVerdienCheckShareUrl({ referralCode: affiliateCode }),
  'https://homecheff.eu/verdiencheck?ref=REFAFFILIATEA',
);

const payload = buildHomecheffSharePayload({
  opportunityId: 'verdiencheck',
  attributedUrl: affiliate,
});
assert.equal(payload.url, affiliate);
assert.equal(payload.canonicalUrl, canonicalVerdienCheckUrl());
assert.equal(toCanonicalShareUrl(affiliate), canonicalVerdienCheckUrl());
assert.doesNotMatch(payload.longText, /€\s*\d/);
assert.doesNotMatch(payload.title, /houdt €|keep €/i);

const native = verdienCheckNativeShareData({
  title: payload.title,
  text: formatShareForChannel(payload, 'native').text,
  url: affiliate,
});
const whatsapp = verdienCheckWhatsAppHref({
  title: payload.title,
  text: formatShareForChannel(payload, 'whatsapp').text,
  url: affiliate,
});
const copyBody = formatShareForChannel(payload, 'copy').text;
const guards = verdienCheckShareUrlOccurrenceGuards({
  url: affiliate,
  copyBody,
  native,
  whatsappHref: whatsapp,
});
assert.equal(guards.copyUrlCount, 1, 'COPY_LINK_URL_OCCURRENCES');
assert.equal(guards.nativeUrlCount, 1, 'NATIVE_SHARE_URL_OCCURRENCES');
assert.equal(guards.whatsappUrlCount, 1, 'WHATSAPP_URL_OCCURRENCES');
assert.equal(guards.refCount, 1, 'AFFILIATE_ATTRIBUTION_OCCURRENCES');
assert.equal(native.url, affiliate);
assert.doesNotMatch(String(native.text || ''), /ref=REFAFFILIATEA/);

const outboundB = buildVerdienCheckShareUrl({ referralCode: 'REFBSHARER' });
assert.match(outboundB, /ref=REFBSHARER/);
assert.doesNotMatch(outboundB, /REFAFFILIATEA/);
assert.equal(
  resolveShareMode({
    memberships: [],
    preferenceMode: null,
    preferenceOrganizationId: null,
    hasPersonalAffiliate: true,
  }).kind,
  'personal',
);

const promo = officialVerdienCheckPromoAsset();
assert.equal(promo.id, OFFICIAL_VERDIENCHECK_PROMO_ID);
assert.equal(promo.destinationPath, '/verdiencheck');
assert.equal(promo.builtin, true);
assert.equal(sanitizeDestinationPath('/verdiencheck'), '/verdiencheck');
assert.equal(listingPathFromAbsolute('https://homecheff.eu/verdiencheck'), '/verdiencheck');
const merged = mergeOfficialVerdienCheckPromo([{ destinationPath: '/werken-bij' }]);
assert.equal(merged[0]?.destinationPath, '/verdiencheck');
assert.equal(mergeOfficialVerdienCheckPromo([{ destinationPath: '/verdiencheck' }]).length, 1);

const sessionSrc = read('lib/verdiencheck/privacy/session-client.ts');
assert.match(sessionSrc, /hc_verdiencheck_v1/);
assert.doesNotMatch(sessionSrc, /hc_ref/);
assert.match(read('components/verdiencheck/VerdienCheckWizard.tsx'), /clearVerdienCheckSession/);
assert.doesNotMatch(read('components/verdiencheck/VerdienCheckWizard.tsx'), /hc_ref/);
assert.equal(REFERRAL_COOKIE_NAME, 'hc_ref');
assert.match(read('middleware.ts'), /searchParams\.get\('ref'\)/);

const seo = verdiencheckPageMetadata();
assert.equal(
  typeof seo.title === 'object' && seo.title && 'absolute' in seo.title
    ? seo.title.absolute
    : seo.title,
  'VerdienCheck | HomeCheff',
);
assert.match(String(seo.description), /extra verdienen/);
assert.doesNotMatch(JSON.stringify(seo), /ref=REF/);
assert.doesNotMatch(JSON.stringify(seo), /3200|partnerIncome|scenario/);

assert.match(nl.shareAction, /Deel VerdienCheck/);
assert.doesNotMatch(nl.shareMessage, /€\s*\d/);
assert.match(nl.shareAfterResult, /Ken je iemand/);

const chrome = read('components/verdiencheck/VerdienCheckWizard.tsx');
assert.match(chrome, /VerdienCheckShareAction/);
assert.match(chrome, /verdiencheck_chrome/);
assert.match(read('components/verdiencheck/VerdienCheckResultCta.tsx'), /shareAfterResult/);
assert.match(read('components/verdiencheck/VerdienCheckShareAction.tsx'), /opportunityId=\{dest\.id\}/);
assert.match(read('components/share/EcosystemShareAction.tsx'), /verdiencheck/);
assert.match(read('components/affiliate/AffiliateShareCenter.tsx'), /id: 'verdiencheck'/);
assert.match(read('components/affiliate/AffiliatePromoLibraryClient.tsx'), /asset\.builtin/);
assert.match(read('app/api/affiliate/media/route.ts'), /mergeOfficialVerdienCheckPromo/);

assert.equal(OPPORTUNITY_DESTINATIONS.verdiencheck.href, '/verdiencheck');
assert.match(getOpportunityShareCopy('verdiencheck', 'nl').longText, /VerdienCheck/);

for (const key of ['income', 'partnerincome', 'omzet', 'kosten', 'scenario'] as const) {
  assert.ok(FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS.includes(key) || FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS.includes('income'));
}
assert.equal(inspectVerdienCheckAnalyticsPayload({ entry_point: 'direct' }).ok, true);
assert.equal(inspectVerdienCheckAnalyticsPayload({ income: 3200 }).ok, false);
assert.equal(inspectVerdienCheckAnalyticsPayload({ scenario: 2500 }).ok, false);
assert.ok(Object.values(VERDIENCHECK_FUNNEL_EVENTS).includes('verdiencheck_share'));
assert.ok(Object.values(VERDIENCHECK_FUNNEL_EVENTS).includes('verdiencheck_share_copy'));
assert.ok(Object.values(VERDIENCHECK_FUNNEL_EVENTS).includes('verdiencheck_share_native'));
assert.ok(Object.values(VERDIENCHECK_FUNNEL_EVENTS).includes('verdiencheck_share_whatsapp'));

const moneyIds = moneyQuestionIds({
  ...EMPTY_WIZARD_STATE,
  taxResidence: 'NL',
  activityChoice: 'MAKE',
  growthStart: 'REGULAR_EARNING',
  situationGroup: 'EMPLOYEE',
  allowances: ['NONE'],
  moneyDepthRequested: true,
});
assert.equal(moneyIds.includes('amounts'), false);
assert.equal(moneyIds.some(isFinancialScenarioQuestion), false);
assert.doesNotMatch(chrome, /hasPartner.*share|share.*hasPartner/);

const engine = read('lib/verdiencheck/calculator/engine.ts');
const schema = read('lib/verdiencheck/wizard/schema.ts');
assert.ok(engine.length > 100);
assert.match(schema, /currentIncome/);

console.log(
  JSON.stringify(
    {
      ANONYMOUS_SHARE_URL: anonymous,
      AFFILIATE_SHARE_URL: affiliate,
      COPY_LINK_URL_OCCURRENCES: guards.copyUrlCount,
      WHATSAPP_URL_OCCURRENCES: guards.whatsappUrlCount,
      NATIVE_SHARE_URL_OCCURRENCES: guards.nativeUrlCount,
      AFFILIATE_ATTRIBUTION_OCCURRENCES: guards.refCount,
      FINANCIAL_DATA_IN_SHARE_URL: shareUrlContainsFinancialState(affiliate),
      PROMO_LIBRARY_VERDIENCHECK: promo.title,
      OUTBOUND_PRECEDENCE: 'sharer personal ReferralLink.code via appendPersonalRef / resolveShareUrl',
    },
    null,
    2,
  ),
);
console.log('verdiencheck affiliate share tests: PASS');
