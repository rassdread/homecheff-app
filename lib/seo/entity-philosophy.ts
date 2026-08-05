/**
 * Phase 2.1 — Permanent HomeCheff entity philosophy (semantic SSOT).
 * Phase 2.3 — Brand entity + core entity reinforcement (canonical description).
 * Content-only. Does not change architecture, planners, routing, or schema types.
 */

export type PhilosophyLang = 'nl' | 'en';

/** Permanent one-liners */
export const PHILOSOPHY_CLOSE_TO_HOME: Record<PhilosophyLang, string> = {
  nl: 'Alles begint dichtbij huis.',
  en: 'Everything starts close to home.',
};

export const PHILOSOPHY_DISTANCE: Record<PhilosophyLang, string> = {
  nl: 'Afstand bepaalt prioriteit, niet mogelijkheid.',
  en: 'Distance determines priority, not possibility.',
};

/**
 * Single canonical entity description — reuse across Organization, WebSite,
 * platform definition, FAQ, homepage SSR, machine briefs, and knowledge surfaces.
 * Do not paraphrase into conflicting meanings.
 */
export const CANONICAL_ENTITY_DESCRIPTION: Record<PhilosophyLang, string> = {
  en:
    'HomeCheff is a digital neighbourhood marketplace where people create value through their own craftsmanship, creativity and personal services. People can discover, offer, buy, sell, trade and request locally, while unique creations and specialised services can naturally reach a wider audience. Everything starts close to home.',
  nl:
    'HomeCheff is een digitale buurtmarkt waar mensen waarde creëren door eigen vakmanschap, creativiteit en persoonlijke diensten. Mensen kunnen lokaal ontdekken, aanbieden, kopen, verkopen, ruilen en vragen, terwijl unieke creaties en gespecialiseerde diensten van nature een breder publiek kunnen bereiken. Alles begint dichtbij huis.',
};

/** What HomeCheff is — aligned to canonical (stance keywords for AI/schema). */
export const ENTITY_IS: Record<PhilosophyLang, string> = {
  nl: CANONICAL_ENTITY_DESCRIPTION.nl,
  en: CANONICAL_ENTITY_DESCRIPTION.en,
};

/** What HomeCheff is not */
export const ENTITY_IS_NOT: Record<PhilosophyLang, string[]> = {
  nl: [
    'geen generieke advertentiesite / classifieds',
    'geen traditionele tweedehands-marktplaats',
    'geen gewone doorverkoop zonder eigen werk',
    'geen mass retail platform',
    'geen bezorgbedrijf',
    'geen anonieme webshop',
    'niet alleen-lokaal of buurt-afgesloten',
    'geen “internationale marktplaats”-positionering',
    'geen “Home Chef” maaltijdbox- of USA-merk (andere spelling, andere filosofie)',
    'niet gebouwd om gedragsadvertentieprofielen te verkopen',
  ],
  en: [
    'not a generic classifieds website',
    'not a traditional second-hand marketplace',
    'not ordinary resale without personal work',
    'not a mass retail platform',
    'not a delivery company',
    'not an anonymous ecommerce website',
    'not neighbourhood-only or city-locked',
    'not positioned as an “international marketplace”',
    'not affiliated with “Home Chef” meal-kit or USA brands (different spelling and purpose)',
    'not built around selling behavioural advertising profiles',
  ],
};

/** Local-first without hard limits — neighbourhood-first, not neighbourhood-only */
export const LOCAL_FIRST_SCALE: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff is neighbourhood-first, niet neighbourhood-only. Mensen ontdekken normaal eerst wat dichtbij gebeurt. Uniek vakmanschap, creatief werk, kunst, gespecialiseerde diensten, onderwijs, kennis, design, reparaties en uitzonderlijke creaties kunnen van nature een breder publiek bereiken — buurt → stad → regio → Nederland → Europa → later international — zonder de local-first filosofie te veranderen. Start lokaal, groei natuurlijk. Nooit “alleen lokaal” en nooit als anonieme “internationale marktplaats”.',
  en:
    'HomeCheff is neighbourhood-first, not neighbourhood-only. People normally discover what happens nearby first. Unique craftsmanship, creative work, art, specialised services, education, knowledge, design, repairs and exceptional creations may naturally reach a wider audience — neighbourhood → city → region → Netherlands → Europe → later international — without changing the local-first philosophy. Start locally, grow naturally. Never “local-only” and never as an anonymous “international marketplace”.',
};

/** Second-hand / transformed work only */
export const SECOND_HAND_PHILOSOPHY: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff is geen traditionele tweedehands-marktplaats. Mensen creëren waarde door eigen arbeid, vakmanschap, creativiteit, kennis, dienst of productie. Bestaande objecten horen hier alleen als er betekenisvolle waarde is toegevoegd door vakmanschap, creativiteit, restauratie, herontwerp, upcycling, reparatie of artistieke transformatie. Gewone doorverkoop blijft buiten de HomeCheff-filosofie.',
  en:
    'HomeCheff is not a traditional second-hand marketplace. People create value through their own labour, craftsmanship, creativity, knowledge, service or production. Existing objects belong only when meaningful value has been added through craftsmanship, creativity, restoration, redesign, upcycling, repair or artistic transformation. Ordinary resale remains outside the HomeCheff philosophy.',
};

/** Category philosophy — people create value */
export const CATEGORY_PHILOSOPHY: Record<PhilosophyLang, string> = {
  nl:
    'Categorieën versterken maken en groeien: thuisgekookte maaltijden, thuisbakken, tuinoogst, handgemaakte producten, kunst, muziek, fotografie, design, onderwijs, reparaties, advies, creatief werk, kennisdeling, persoonlijke diensten, buurthulp en ruil. Mensen creëren waarde — ze verkopen geen anonieme massaproducten door.',
  en:
    'Categories reinforce making and growing: home-cooked meals, home baking, garden produce, handmade products, art, music, photography, design, education, repairs, consultancy, creative work, knowledge sharing, personal services, neighbourhood help and barter. People create value — they do not resell anonymous mass products.',
};

/** Short meta / OG-friendly description — derived from canonical, not a rival story */
export const ENTITY_META_DESCRIPTION: Record<PhilosophyLang, string> = {
  nl:
    'Digitale buurtmarkt: waarde door eigen vakmanschap, creativiteit en diensten. Lokaal ontdekken, aanbieden, handelen en vragen — uniek vakmanschap mag verder reiken. Alles begint dichtbij huis.',
  en:
    'Digital neighbourhood marketplace: value through craftsmanship, creativity and personal services. Discover, offer, trade and request locally — unique craft may reach further. Everything starts close to home.',
};

/** FAQ-length answer — canonical + craftsmanship / local-first clarity */
export const ENTITY_FAQ_WHAT: Record<PhilosophyLang, string> = {
  nl:
    `${CANONICAL_ENTITY_DESCRIPTION.nl} Afstand bepaalt prioriteit, niet mogelijkheid. Geen classifieds, geen gewone tweedehands-doorverkoop, geen bezorgbedrijf: waarde komt uit persoonlijk werk. Tweedehands alleen bij echte ambachtelijke of creatieve transformatie.`,
  en:
    `${CANONICAL_ENTITY_DESCRIPTION.en} Distance determines priority, not possibility. Not classifieds, not ordinary second-hand resale, not a delivery company: value comes from personal work. Second-hand only when truly transformed through craft or creativity.`,
};

/** Homepage SSR / orientation body — canonical (single source) */
export const ENTITY_HOMEPAGE_DEFINITION: Record<PhilosophyLang, string> = {
  nl: CANONICAL_ENTITY_DESCRIPTION.nl,
  en: CANONICAL_ENTITY_DESCRIPTION.en,
};

/** Stance keywords AI should always retain alongside the canonical description */
export const ENTITY_STANCE: Record<PhilosophyLang, string[]> = {
  en: [
    'digital neighbourhood marketplace',
    'community-first',
    'creator-first',
    'craftsmanship-first',
    'local-first',
    'not local-only',
    'not traditional classifieds',
    'not ordinary second-hand marketplace',
    'not a delivery company',
    'not mass retail',
    'not built around selling behavioural advertising profiles',
  ],
  nl: [
    'digitale buurtmarkt',
    'community-first',
    'creator-first',
    'craftsmanship-first',
    'local-first',
    'niet alleen-lokaal',
    'geen traditionele classifieds',
    'geen gewone tweedehands-marktplaats',
    'geen bezorgbedrijf',
    'geen mass retail',
    'niet gebouwd om gedragsadvertentieprofielen te verkopen',
  ],
};

export function entityNotLine(lang: PhilosophyLang): string {
  return lang === 'en'
    ? `HomeCheff is ${ENTITY_IS_NOT.en.join(', ')}.`
    : `HomeCheff is ${ENTITY_IS_NOT.nl.join(', ')}.`;
}

export function entityStanceLine(lang: PhilosophyLang): string {
  return ENTITY_STANCE[lang].join(' · ');
}
