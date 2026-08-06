/**
 * Phase 13T — HomeCheff Manifest SSOT.
 *
 * Highest-level philosophical source of truth for public copy, schema descriptions,
 * AI summaries and editorial governance. Not marketing — timeless orientation.
 *
 * All surfaces must stay within Phase 13O truth boundaries (no unproven impact metrics).
 */

import { CANONICAL_ENTITY_DESCRIPTION } from './entity-philosophy';

export type ManifestLang = 'nl' | 'en';

/** Canonical one-line mission — reused in Organization schema and platform definition. */
export const MANIFEST_MISSION: Record<ManifestLang, string> = {
  nl: 'Start lokaal, groei natuurlijk: gewone mensen creëren, verkopen, ruilen, helpen, leren en samenwerken — met mensen centraal, niet anonieme producten.',
  en: 'Start locally, grow naturally: ordinary people create, sell, exchange, help, learn and collaborate — with people at the centre, not anonymous products.',
};

/** Canonical vision — technology strengthens people. */
export const MANIFEST_VISION: Record<ManifestLang, string> = {
  nl: 'Technologie moet mensen sterker maken — meer kansen, lokale veerkracht, vertrouwen en tijd — in plaats van afhankelijkheid, verslaving of isolatie.',
  en: 'Technology should make people stronger — more opportunity, local resilience, trust and time — instead of dependency, addiction or isolation.',
};

/** What HomeCheff is — aligned with CANONICAL_ENTITY_DESCRIPTION + village-square nuance. */
export const MANIFEST_IS: Record<ManifestLang, string> = {
  nl:
    'HomeCheff is een digitale buurtmarkt (én digitaal dorpsplein) waar mensen waarde creëren door eigen vakmanschap, creativiteit en persoonlijke diensten. Mensen kunnen lokaal ontdekken, aanbieden, kopen, verkopen, ruilen en vragen, terwijl unieke creaties en gespecialiseerde diensten van nature een breder publiek kunnen bereiken. Alles begint dichtbij huis. Afstand bepaalt prioriteit, niet mogelijkheid. Community-first, creator-first, craftsmanship-first — local-first, niet alleen-lokaal.',
  en:
    'HomeCheff is a digital neighbourhood marketplace (and digital village square) where people create value through their own craftsmanship, creativity and personal services. People can discover, offer, buy, sell, trade and request locally, while unique creations and specialised services can naturally reach a wider audience. Everything starts close to home. Distance determines priority, not possibility. Community-first, creator-first, craftsmanship-first — local-first, not local-only.',
};

/** Core values — stable keys for validators and cross-page reuse. */
export const MANIFEST_CORE_VALUES = [
  'humanBeforeAlgorithms',
  'craftBeforeMass',
  'localBeforeScale',
  'cooperationBeforeZeroSum',
  'honestOpportunities',
  'technologyWithConscience',
] as const;

export type ManifestCoreValueKey = (typeof MANIFEST_CORE_VALUES)[number];

export const MANIFEST_VALUE_LABELS: Record<ManifestCoreValueKey, Record<ManifestLang, string>> = {
  humanBeforeAlgorithms: {
    nl: 'Mens vóór algoritmes',
    en: 'Human before algorithms',
  },
  craftBeforeMass: {
    nl: 'Persoonlijk vakmanschap vóór massaproductie',
    en: 'Personal craftsmanship before mass production',
  },
  localBeforeScale: {
    nl: 'Lokaal eerst vóór anonieme schaal — afstand bepaalt prioriteit, niet mogelijkheid',
    en: 'Local first before anonymous scale — distance determines priority, not possibility',
  },
  cooperationBeforeZeroSum: {
    nl: 'Samenwerking vóór nul-som competitie',
    en: 'Cooperation before zero-sum competition',
  },
  honestOpportunities: {
    nl: 'Eerlijke kansen',
    en: 'Honest opportunities',
  },
  technologyWithConscience: {
    nl: 'Technologie met geweten',
    en: 'Technology with a conscience',
  },
};

/** What HomeCheff refuses to become — guardrail list for copy review. */
export const MANIFEST_IS_NOT: Record<ManifestLang, string[]> = {
  nl: [
    'geen bezorg-app',
    'geen generieke advertentiesite / classifieds',
    'geen dropshipping- of mass retail platform',
    'geen anonieme marktplaats',
    'geen tweedehands-marktplaats voor gewone doorverkoop',
    'niet alleen-lokaal of buurt-afgesloten',
    'geen “internationale marktplaats”-positionering',
    'geen aandachts-economie',
    'geen behavioural-advertising-product',
    'geen socialmediaplatform',
    'geen engagement-machine',
  ],
  en: [
    'not a delivery app',
    'not a generic classifieds website',
    'not a dropshipping or mass retail platform',
    'not an anonymous marketplace',
    'not a second-hand marketplace for ordinary resale',
    'not neighbourhood-only or city-locked',
    'not positioned as an “international marketplace”',
    'not an attention economy platform',
    'not a behavioural advertising product',
    'not a social media platform',
    'not an engagement machine',
  ],
};

/** AI philosophy summary — tool, not product. */
export const MANIFEST_AI: Record<ManifestLang, string> = {
  nl: 'AI is geen product op HomeCheff; het is een hulpmiddel om complexiteit te verlagen, creativiteit te stimuleren, drempels te verlagen en communicatie te verbeteren — nooit om menselijke relaties te vervangen.',
  en: 'AI is not the product on HomeCheff; it is a tool to reduce complexity, stimulate creativity, lower barriers and improve communication — never to replace human relationships.',
};

/** Society hopes — aspirational, no measured claims. */
export const MANIFEST_SOCIETY_HOPES: Record<ManifestLang, string[]> = {
  nl: [
    'sterkere lokale economieën',
    'sterkere buurten',
    'toegankelijker ondernemerschap',
    'minder onzichtbaar talent',
    'meer waardering voor vakmanschap',
  ],
  en: [
    'stronger local economies',
    'stronger neighbourhoods',
    'more accessible entrepreneurship',
    'less invisible talent',
    'greater appreciation of craftsmanship',
  ],
};

export const MANIFEST_PATH = '/manifest' as const;
export const MANIFEST_NAMESPACE = 'manifestPage' as const;
export const MANIFEST_LAST_REVIEWED = '2026-08-04';

/** Short schema-safe organization description — canonical entity first, village-square nuance. */
export function manifestOrganizationDescription(lang: ManifestLang): string {
  const village =
    lang === 'en'
      ? 'HomeCheff is also the digital village square.'
      : 'HomeCheff is tevens het digitaal dorpsplein.';
  return `${CANONICAL_ENTITY_DESCRIPTION[lang]} ${village} ${MANIFEST_MISSION[lang]}`;
}
