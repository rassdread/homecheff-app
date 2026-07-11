/**
 * Phase 13T — HomeCheff Manifest SSOT.
 *
 * Highest-level philosophical source of truth for public copy, schema descriptions,
 * AI summaries and editorial governance. Not marketing — timeless orientation.
 *
 * All surfaces must stay within Phase 13O truth boundaries (no unproven impact metrics).
 */

export type ManifestLang = 'nl' | 'en';

/** Canonical one-line mission — reused in Organization schema and platform definition. */
export const MANIFEST_MISSION: Record<ManifestLang, string> = {
  nl: 'HomeCheff bouwt een digitale omgeving waar gewone mensen lokaal kunnen creëren, verkopen, ruilen, helpen, leren en samenwerken — met mensen centraal, niet producten.',
  en: 'HomeCheff builds a digital environment where ordinary people can create, sell, exchange, help, learn and collaborate locally — with people at the centre, not products.',
};

/** Canonical vision — technology strengthens people. */
export const MANIFEST_VISION: Record<ManifestLang, string> = {
  nl: 'Technologie moet mensen sterker maken — meer kansen, lokale veerkracht, vertrouwen en tijd — in plaats van afhankelijkheid, verslaving of isolatie.',
  en: 'Technology should make people stronger — more opportunity, local resilience, trust and time — instead of dependency, addiction or isolation.',
};

/** What HomeCheff is — digital village square. */
export const MANIFEST_IS: Record<ManifestLang, string> = {
  nl: 'HomeCheff is een digitaal dorpsplein: een plek waar mensen mensen ontdekken, vaardigheden kansen vinden en buurten elkaar vinden. Technologie is de brug; mensen blijven de bestemming.',
  en: 'HomeCheff is a digital village square: a place where people discover people, skills find opportunity and neighbourhoods find each other. Technology is the bridge; people remain the destination.',
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
    nl: 'Lokale gemeenschappen vóór anonieme schaal',
    en: 'Local communities before anonymous scale',
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
    'geen advertentieplatform',
    'geen dropshipping-marktplaats',
    'geen anonieme marktplaats',
    'geen aandachts-economie',
    'geen socialmediaplatform',
    'geen engagement-machine',
  ],
  en: [
    'not a delivery app',
    'not an advertising platform',
    'not a dropshipping marketplace',
    'not an anonymous marketplace',
    'not an attention economy platform',
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
export const MANIFEST_LAST_REVIEWED = '2026-07-11';

/** Short schema-safe organization description derived from manifest. */
export function manifestOrganizationDescription(lang: ManifestLang): string {
  return lang === 'en'
    ? `${MANIFEST_IS.en} ${MANIFEST_MISSION.en}`
    : `${MANIFEST_IS.nl} ${MANIFEST_MISSION.nl}`;
}
