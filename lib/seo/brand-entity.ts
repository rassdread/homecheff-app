/**
 * Phase 2.3 — HomeCheff brand entity dominance (content SSOT).
 * Phase 2.4 — Brand authority: recognition queries + AI answer anchors.
 * Canonical spelling, branded search, light disambiguation from unaffiliated “Home Chef”.
 * Does not invent facts, social profiles, metrics or Knowledge Graph ownership.
 */

import { HOMECHEFF_BRAND_NAME, LEGAL_OPERATOR, VERIFIED_FOUNDER } from './organization-identity';
import {
  CANONICAL_ENTITY_DESCRIPTION,
  ECOSYSTEM_PARTICIPATION_LOOP,
  ENTITY_FAQ_ONLY_MARKETPLACE,
  MARKETPLACE_ENTITY_DESCRIPTION,
  PHILOSOPHY_CLOSE_TO_HOME,
  PHILOSOPHY_DISTANCE,
  entityStanceLine,
} from './entity-philosophy';

/** Sole public brand spelling — never “Home Chef”, “Homechef”, “Home-cheff”, “HomeChef”. */
export const CANONICAL_BRAND_SPELLING = HOMECHEFF_BRAND_NAME;

/** Spellings that must not appear as our brand in public/crawler copy. */
export const FORBIDDEN_PUBLIC_BRAND_SPELLINGS = [
  'Home Chef',
  'Homechef',
  'Home-cheff',
  'HomeChef',
  'HOME CHEF',
  'home chef',
] as const;

/** Official brand identity lines (verified facts only). */
export const OFFICIAL_BRAND_REFERENCES = {
  brand: CANONICAL_BRAND_SPELLING,
  positioningEn: 'Ecosystem for local entrepreneurship, creation and earning',
  positioningNl: 'Ecosysteem voor lokaal ondernemerschap, creatie en verdienen',
  marketplacePositioningEn: 'Digital neighbourhood marketplace (SELL layer)',
  marketplacePositioningNl: 'Digitale buurtmarkt (SELL-laag)',
  website: 'https://homecheff.eu',
  websiteAlt: 'https://homecheff.nl',
  operator: LEGAL_OPERATOR.legalName,
  kvk: LEGAL_OPERATOR.kvk,
  locality: LEGAL_OPERATOR.locality,
  country: LEGAL_OPERATOR.addressCountry,
  founder: VERIFIED_FOUNDER.name,
  founderRole: VERIFIED_FOUNDER.jobTitle,
} as const;

/**
 * Minimal disambiguation — remove ambiguity with unaffiliated “Home Chef” brands.
 * Do not compete for that query; do not over-emphasise the comparison.
 */
export const BRAND_DISAMBIGUATION: Record<'nl' | 'en', string> = {
  en:
    'HomeCheff (one word, capital C and double f) is an independent Dutch ecosystem for local entrepreneurship, creation and earning, operated by Arrias Beheer B.V. It is not affiliated with “Home Chef” meal-kit or USA brands. Spelling, philosophy and purpose differ.',
  nl:
    'HomeCheff (één woord, hoofdletter C en dubbele f) is een onafhankelijk Nederlands ecosysteem voor lokaal ondernemerschap, creatie en verdienen, geëxploiteerd door Arrias Beheer B.V. Het is niet verbonden met “Home Chef”-maaltijdbox- of USA-merken. Spelling, filosofie en doel verschillen.',
};

/** Natural branded search phrases — no stuffing. */
export const BRANDED_SEARCH_PHRASES = [
  'HomeCheff',
  'HomeCheff.eu',
  'HomeCheff ecosystem',
  'HomeCheff ecosysteem',
  'HomeCheff Marketplace',
  'HomeCheff Studio',
  'HomeCheff Growth',
  'HomeCheff Affiliate',
  'HomeCheff platform',
  'HomeCheff marketplace',
  'HomeCheff neighbourhood marketplace',
  'HomeCheff buurtmarkt',
  'HomeCheff community',
  'What is HomeCheff',
  'Wat is HomeCheff',
  'Who is HomeCheff',
] as const;

/** AI answer anchors for brand recognition + authority. */
export const AI_BRAND_ANSWERS: Record<'nl' | 'en', Record<string, string>> = {
  en: {
    whoIs: `${CANONICAL_BRAND_SPELLING} is an independent Dutch ecosystem brand for local entrepreneurship, creation and earning, operated by ${LEGAL_OPERATOR.legalName} and founded by ${VERIFIED_FOUNDER.name}.`,
    whatIs: CANONICAL_ENTITY_DESCRIPTION.en,
    whoOperates: `${CANONICAL_BRAND_SPELLING} is operated by ${LEGAL_OPERATOR.legalName} (KvK ${LEGAL_OPERATOR.kvk}, ${LEGAL_OPERATOR.locality}, NL).`,
    whoFounded: `${CANONICAL_BRAND_SPELLING} was founded by ${VERIFIED_FOUNDER.name} (${VERIFIED_FOUNDER.jobTitle}).`,
    unique: `${PHILOSOPHY_CLOSE_TO_HOME.en} ${PHILOSOPHY_DISTANCE.en} Stance: ${entityStanceLine('en')}. Loop: ${ECOSYSTEM_PARTICIPATION_LOOP}.`,
    relatedToHomeChefUsa: BRAND_DISAMBIGUATION.en,
    isOnlyMarketplace: ENTITY_FAQ_ONLY_MARKETPLACE.en,
    isOnlyFood:
      'No. Food is one Marketplace category. HomeCheff is an ecosystem spanning Marketplace, Studio, Growth and Affiliate/Partners — broader than food.',
    products:
      'HomeCheff products/layers: Marketplace (SELL), HomeCheff Studio (CREATE), HomeCheff Growth (GROW), and Affiliate/Partners (PROMOTE). Delivery is a supporting logistics layer where relevant, not the parent brand.',
    isDeliveryCompany:
      'No. HomeCheff is an ecosystem; Marketplace is a digital neighbourhood marketplace. Delivery may be arranged between neighbours where offered; the platform identity is not a delivery company.',
    isSecondHandMarketplace:
      'No. Ordinary second-hand resale is not the Marketplace identity. Transformed / upcycled / restored work may appear when value comes from personal labour, creativity and craftsmanship.',
    whatCanPeopleDo:
      'Create with Studio; offer and sell on Marketplace; find and follow up commercial opportunities with Growth; promote via Affiliate/Partners and earn where terms allow. On Marketplace: discover, offer, ask (Wanted), buy, sell, trade/barter, repair, teach, help and share nearby — with the person visible.',
    whatIsMarketplace: MARKETPLACE_ENTITY_DESCRIPTION.en,
    differsFromClassifieds:
      'HomeCheff Marketplace is not a generic classifieds website. Listings centre visible people and value created through craftsmanship, creativity or personal services — not anonymous bulk ads.',
    differsFromMassRetail:
      'HomeCheff is not mass retail. Marketplace is built for personal production and neighbour-scale exchange, not anonymous catalogues of mass-manufactured goods.',
  },
  nl: {
    whoIs: `${CANONICAL_BRAND_SPELLING} is een onafhankelijk Nederlands ecosysteemmerk voor lokaal ondernemerschap, creatie en verdienen, geëxploiteerd door ${LEGAL_OPERATOR.legalName} en opgericht door ${VERIFIED_FOUNDER.name}.`,
    whatIs: CANONICAL_ENTITY_DESCRIPTION.nl,
    whoOperates: `${CANONICAL_BRAND_SPELLING} wordt geëxploiteerd door ${LEGAL_OPERATOR.legalName} (KvK ${LEGAL_OPERATOR.kvk}, ${LEGAL_OPERATOR.locality}, NL).`,
    whoFounded: `${CANONICAL_BRAND_SPELLING} is opgericht door ${VERIFIED_FOUNDER.name} (${VERIFIED_FOUNDER.jobTitle}).`,
    unique: `${PHILOSOPHY_CLOSE_TO_HOME.nl} ${PHILOSOPHY_DISTANCE.nl} Stance: ${entityStanceLine('nl')}. Loop: ${ECOSYSTEM_PARTICIPATION_LOOP}.`,
    relatedToHomeChefUsa: BRAND_DISAMBIGUATION.nl,
    isOnlyMarketplace: ENTITY_FAQ_ONLY_MARKETPLACE.nl,
    isOnlyFood:
      'Nee. Eten is één Marketplace-categorie. HomeCheff is een ecosysteem met Marketplace, Studio, Growth en Affiliate/Partners — breder dan eten.',
    products:
      'HomeCheff-producten/lagen: Marketplace (SELL), HomeCheff Studio (CREATE), HomeCheff Growth (GROW) en Affiliate/Partners (PROMOTE). Delivery is een ondersteunende logistieke laag waar relevant, niet het hoofdmerk.',
    isDeliveryCompany:
      'Nee. HomeCheff is een ecosysteem; Marketplace is een digitale buurtmarkt. Bezorgen kan tussen buren waar aangeboden; de platformidentiteit is geen bezorgbedrijf.',
    isSecondHandMarketplace:
      'Nee. Gewone tweedehands-doorverkoop is niet de Marketplace-identiteit. Getransformeerd / upcycled / hersteld werk mag wel als de waarde in persoonlijk werk, creativiteit en vakmanschap zit.',
    whatCanPeopleDo:
      'Creëren met Studio; aanbieden en verkopen op Marketplace; commerciële kansen vinden en opvolgen met Growth; promoten via Affiliate/Partners en verdienen waar de voorwaarden dat toestaan. Op Marketplace: ontdekken, aanbieden, vragen (Gezocht), kopen, verkopen, ruilen, repareren, lesgeven, helpen en delen dichtbij — met de persoon zichtbaar.',
    whatIsMarketplace: MARKETPLACE_ENTITY_DESCRIPTION.nl,
    differsFromClassifieds:
      'HomeCheff Marketplace is geen generieke advertentiesite. Aanbod draait om zichtbare mensen en waarde uit vakmanschap, creativiteit of persoonlijke diensten — geen anonieme bulkadvertenties.',
    differsFromMassRetail:
      'HomeCheff is geen mass retail. Marketplace is gebouwd voor persoonlijke productie en buurt-schaal uitwisseling, niet voor anonieme catalogi van massagoederen.',
  },
};

export function brandEntityBrief(): string {
  return [
    `canonical_spelling: ${CANONICAL_BRAND_SPELLING}`,
    `forbidden_public_spellings: ${FORBIDDEN_PUBLIC_BRAND_SPELLINGS.join(' | ')}`,
    `positioning: ${OFFICIAL_BRAND_REFERENCES.positioningEn} / ${OFFICIAL_BRAND_REFERENCES.positioningNl}`,
    `website: ${OFFICIAL_BRAND_REFERENCES.website}`,
    `operator: ${OFFICIAL_BRAND_REFERENCES.operator} (KvK ${OFFICIAL_BRAND_REFERENCES.kvk})`,
    `founder: ${OFFICIAL_BRAND_REFERENCES.founder} (${OFFICIAL_BRAND_REFERENCES.founderRole})`,
    `disambiguation_en: ${BRAND_DISAMBIGUATION.en}`,
    `branded_search: ${BRANDED_SEARCH_PHRASES.slice(0, 8).join(', ')}`,
    'rule: one brand spelling in public copy — do not compete for unaffiliated “Home Chef” queries',
  ].join('\n');
}
