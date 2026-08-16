/**
 * Unit checks for cold-start locale resolution (multi-persona UX).
 * Run: npx tsx scripts/validate-cold-start-locale.ts
 */
import {
  preferLanguageFromAcceptLanguage,
  resolveColdStartLanguage,
} from '../lib/locale';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(preferLanguageFromAcceptLanguage('nl-NL,nl;q=0.9,en;q=0.8') === 'nl', 'nl-NL');
assert(preferLanguageFromAcceptLanguage('nl') === 'nl', 'nl');
assert(preferLanguageFromAcceptLanguage('en-US,en;q=0.9') === 'en', 'en-US');
assert(preferLanguageFromAcceptLanguage('en-GB,en;q=0.9') === 'en', 'en-GB');
assert(preferLanguageFromAcceptLanguage('de-DE,de;q=0.9') === null, 'de → null');
assert(preferLanguageFromAcceptLanguage(null) === null, 'null');

assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    acceptLanguage: 'nl-NL,nl;q=0.9',
  }) === 'nl',
  '.eu + nl-NL → nl',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    acceptLanguage: 'en-US',
  }) === 'en',
  '.eu + en-US → en',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    acceptLanguage: 'en-GB,en;q=0.8',
  }) === 'en',
  '.eu + en-GB → en',
);
assert(
  resolveColdStartLanguage({ host: 'homecheff.eu' }) === 'nl',
  '.eu + unknown → nl fallback',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    cookieLanguage: 'en',
    acceptLanguage: 'nl-NL',
  }) === 'en',
  'cookie wins',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.eu',
    pathname: '/en/faq',
    acceptLanguage: 'nl-NL',
  }) === 'en',
  '/en path wins over Accept-Language',
);
assert(
  resolveColdStartLanguage({
    host: 'homecheff.nl',
    acceptLanguage: 'en-US',
  }) === 'en',
  '.nl + en-US still respects Accept-Language',
);

console.log('validate-cold-start-locale: PASS');
