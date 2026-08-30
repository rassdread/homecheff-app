/**
 * Unit checks for cold-start + IP locale resolution.
 * Run: npx tsx scripts/validate-cold-start-locale.ts
 */
import {
  preferLanguageFromAcceptLanguage,
  resolveColdStartLanguage,
  languageFromCountryCode,
} from '../lib/locale';
import {
  languageFromCountryCode as ecoFromCountry,
  resolveEcosystemLanguage,
} from '../lib/ecosystem-locale';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(preferLanguageFromAcceptLanguage('nl-NL,nl;q=0.9,en;q=0.8') === 'nl', 'nl-NL');
assert(preferLanguageFromAcceptLanguage('en-US,en;q=0.9') === 'en', 'en-US');
assert(preferLanguageFromAcceptLanguage('de-DE,de;q=0.9') === null, 'de → null');

assert(languageFromCountryCode('NL') === 'nl', 'NL → nl');
assert(languageFromCountryCode('BE') === 'nl', 'BE → nl');
assert(languageFromCountryCode('SR') === 'nl', 'SR → nl');
assert(languageFromCountryCode('DE') === 'en', 'DE → en');
assert(languageFromCountryCode('FR') === 'en', 'FR → en');
assert(languageFromCountryCode('GB') === 'en', 'GB → en');
assert(languageFromCountryCode('US') === 'en', 'US → en');
assert(languageFromCountryCode(null) === 'en', 'null → en');
assert(languageFromCountryCode('XX') === 'en', 'XX → en');
assert(ecoFromCountry('be') === 'nl', 'be lowercase → nl');

assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'NL',
  }) === 'nl',
  'NL IP → nl',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'BE',
  }) === 'nl',
  'BE IP → nl',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'SR',
  }) === 'nl',
  'SR IP → nl',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'US',
  }) === 'en',
  'US IP → en',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'DE',
    acceptLanguage: 'nl-NL',
  }) === 'en',
  'DE IP wins over Accept-Language nl',
);
assert(
  resolveColdStartLanguage({ host: 'homecheff.eu' }) === 'en',
  'unknown country → en',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    cookieLanguage: 'en',
    countryCode: 'NL',
  }) === 'en',
  'cookie wins over IP',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    hasExplicitPreference: true,
    explicitLanguage: 'en',
    cookieLanguage: 'en',
    accountLanguage: 'nl',
    countryCode: 'NL',
  }) === 'en',
  'explicit wins over account + IP',
);
assert(
  resolveEcosystemLanguage({
    accountLanguage: 'nl',
    cookieLanguage: 'en',
    countryCode: 'US',
  }) === 'nl',
  'account wins over cookie',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    pathname: '/en/faq',
    countryCode: 'NL',
  }) === 'en',
  '/en path wins when no cookie',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.nl',
    acceptLanguage: 'en-US',
  }) === 'nl',
  '.nl host → NL market default when no cookie',
);

console.log('validate-cold-start-locale: PASS');
