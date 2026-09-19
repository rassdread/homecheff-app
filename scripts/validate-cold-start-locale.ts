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
  DUTCH_DEFAULT_COUNTRIES,
  LANGUAGE_RESPONSE_VARY,
  languageFromCountryCode as ecoFromCountry,
  mergeLanguageVary,
  resolveEcosystemLanguage,
} from '../lib/ecosystem-locale';
import { careersPath } from '../lib/navigation/public-careers-nav';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(preferLanguageFromAcceptLanguage('nl-NL,nl;q=0.9,en;q=0.8') === 'nl', 'nl-NL');
assert(preferLanguageFromAcceptLanguage('en-US,en;q=0.9') === 'en', 'en-US');
assert(preferLanguageFromAcceptLanguage('de-DE,de;q=0.9') === null, 'de → null');

assert(DUTCH_DEFAULT_COUNTRIES.has('NL'), 'NL in Dutch default set');
assert(DUTCH_DEFAULT_COUNTRIES.has('BE'), 'BE in Dutch default set');
assert(DUTCH_DEFAULT_COUNTRIES.has('SR'), 'SR in Dutch default set');

assert(languageFromCountryCode('NL') === 'nl', 'NL → nl');
assert(languageFromCountryCode('BE') === 'nl', 'BE → nl');
assert(languageFromCountryCode('SR') === 'nl', 'SR → nl');
assert(languageFromCountryCode('SU') === 'en', 'SU → en');
assert(languageFromCountryCode('DE') === 'en', 'DE → en');
assert(languageFromCountryCode('FR') === 'en', 'FR → en');
assert(languageFromCountryCode('GB') === 'en', 'GB → en');
assert(languageFromCountryCode('US') === 'en', 'US → en');
assert(languageFromCountryCode('ES') === 'en', 'ES → en');
assert(languageFromCountryCode('NG') === 'en', 'NG → en');
assert(languageFromCountryCode(null) === 'en', 'null → en');
assert(languageFromCountryCode('XX') === 'en', 'XX → en');
assert(ecoFromCountry('be') === 'nl', 'be lowercase → nl');
assert(ecoFromCountry('sr') === 'nl', 'sr lowercase → nl');

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
    countryCode: 'GB',
  }) === 'en',
  'GB IP → en',
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
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'BE',
    acceptLanguage: 'fr-BE,fr;q=0.9',
  }) === 'nl',
  'BE stays NL even with French Accept-Language',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    acceptLanguage: 'nl-NL,nl;q=0.9',
  }) === 'en',
  'unknown country → en (not Accept-Language)',
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
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'FR',
  }) === 'en',
  'FR IP → en',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'ES',
  }) === 'en',
  'ES IP → en',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    countryCode: 'NG',
  }) === 'en',
  'NG IP → en',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    hasExplicitPreference: true,
    explicitLanguage: 'nl',
    cookieLanguage: 'nl',
    countryCode: 'US',
  }) === 'nl',
  'manual NL override persists over US geo',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    hasExplicitPreference: true,
    explicitLanguage: 'en',
    cookieLanguage: 'en',
    countryCode: 'NL',
  }) === 'en',
  'manual EN override persists over NL geo',
);
assert(
  resolveEcosystemLanguage({
    accountLanguage: 'nl',
    cookieLanguage: 'en',
    countryCode: 'US',
  }) === 'nl',
  'account wins over cookie in resolver (middleware does not pass account)',
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

assert(LANGUAGE_RESPONSE_VARY.includes('Cookie'), 'Vary includes Cookie');
assert(
  LANGUAGE_RESPONSE_VARY.includes('x-vercel-ip-country'),
  'Vary includes x-vercel-ip-country',
);
assert(LANGUAGE_RESPONSE_VARY.includes('cf-ipcountry'), 'Vary includes cf-ipcountry');
assert(
  mergeLanguageVary('RSC').includes('x-vercel-ip-country') &&
    mergeLanguageVary('RSC').includes('Cookie'),
  'mergeLanguageVary keeps existing + country + cookie',
);
assert(
  mergeLanguageVary(null).includes('x-vercel-ip-country'),
  'fresh-visitor Vary still keys on country (cookie empty is not enough)',
);

// Geo initial locale → Careers route family (existing careersPath; do not rebuild Careers).
function careersFamilyFromCountry(country: string | null) {
  const lang = languageFromCountryCode(country);
  return {
    lang,
    hub: careersPath('hub', lang),
    jobs: careersPath('jobs', lang),
    howItWorks: careersPath('howItWorks', lang),
  };
}

for (const country of ['NL', 'BE', 'SR'] as const) {
  const fam = careersFamilyFromCountry(country);
  assert(fam.lang === 'nl', `${country} initial locale → nl`);
  assert(fam.hub === '/werken-bij', `${country} Careers nav → /werken-bij`);
  assert(fam.jobs === '/werken-bij/vacatures', `${country} jobs → /werken-bij/vacatures`);
  assert(
    fam.howItWorks === '/werken-bij/hoe-werkt-het',
    `${country} how-it-works → /werken-bij/hoe-werkt-het`,
  );
}

for (const country of ['US', 'GB', 'DE', 'FR', 'ES', 'NG'] as const) {
  const fam = careersFamilyFromCountry(country);
  assert(fam.lang === 'en', `${country} initial locale → en`);
  assert(fam.hub === '/careers', `${country} Careers nav → /careers`);
  assert(fam.jobs === '/careers/jobs', `${country} jobs → /careers/jobs`);
  assert(
    fam.howItWorks === '/careers/how-it-works',
    `${country} how-it-works → /careers/how-it-works`,
  );
}

assert(careersFamilyFromCountry(null).hub === '/careers', 'unknown geo Careers nav → /careers');
assert(
  careersPath(
    'hub',
    resolveColdStartLanguage({
      host: 'homecheff.eu',
      hasExplicitPreference: true,
      explicitLanguage: 'nl',
      cookieLanguage: 'nl',
      countryCode: 'US',
    }),
  ) === '/werken-bij',
  'explicit NL over US geo still uses /werken-bij',
);
assert(
  careersPath(
    'hub',
    resolveColdStartLanguage({
      host: 'homecheff.eu',
      hasExplicitPreference: true,
      explicitLanguage: 'en',
      cookieLanguage: 'en',
      countryCode: 'NL',
    }),
  ) === '/careers',
  'explicit EN over NL geo still uses /careers',
);

console.log('validate-cold-start-locale: PASS');
