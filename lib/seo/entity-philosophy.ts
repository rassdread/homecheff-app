/**
 * Permanent HomeCheff entity philosophy (semantic SSOT).
 * Brand entity = ecosystem; Marketplace = SELL layer (neighbourhood marketplace).
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
 * Single canonical parent-brand description — reuse across Organization, WebSite,
 * FAQ "What is HomeCheff?", homepage SSR identity, machine briefs, and knowledge surfaces.
 * Do not paraphrase into conflicting meanings.
 *
 * Marketplace neighbourhood-market copy lives in MARKETPLACE_ENTITY_DESCRIPTION —
 * never use that as the sole definition of the HomeCheff brand.
 */
export const CANONICAL_ENTITY_DESCRIPTION: Record<PhilosophyLang, string> = {
  en:
    'HomeCheff is an ecosystem for local entrepreneurship, creation and earning. It connects Marketplace, HomeCheff Studio, HomeCheff Growth and Affiliate/Partners in one system. People and businesses can create, offer and sell, produce content, find customers, promote and earn.',
  nl:
    'HomeCheff is een ecosysteem voor lokaal ondernemerschap, creatie en verdienen. Het verbindt Marketplace, HomeCheff Studio, HomeCheff Growth en Affiliate/Partners in één systeem. Mensen en bedrijven kunnen er maken, aanbieden en verkopen, content creëren, klanten vinden, promoten en verdienen.',
};

/**
 * Marketplace (SELL) layer — digital neighbourhood marketplace.
 * Use on Marketplace-specific surfaces; always keep parent ecosystem in scope.
 */
export const MARKETPLACE_ENTITY_DESCRIPTION: Record<PhilosophyLang, string> = {
  en:
    'HomeCheff Marketplace is the SELL layer of HomeCheff — a digital neighbourhood marketplace where people create value through their own craftsmanship, creativity and personal services. People can discover, offer, buy, sell, trade and request locally, while unique creations and specialised services can naturally reach a wider audience. Everything starts close to home. Food is one category within Marketplace, not the definition of HomeCheff.',
  nl:
    'HomeCheff Marketplace is de SELL-laag van HomeCheff — een digitale buurtmarkt waar mensen waarde creëren door eigen vakmanschap, creativiteit en persoonlijke diensten. Mensen kunnen lokaal ontdekken, aanbieden, kopen, verkopen, ruilen en vragen, terwijl unieke creaties en gespecialiseerde diensten van nature een breder publiek kunnen bereiken. Alles begint dichtbij huis. Eten is één categorie binnen Marketplace, niet de definitie van HomeCheff.',
};

/** Participation loop — machine + human readable */
export const ECOSYSTEM_PARTICIPATION_LOOP = 'CREATE → SELL → GROW → PROMOTE → EARN → REPEAT' as const;

/** What HomeCheff (parent brand) is — aligned to canonical. */
export const ENTITY_IS: Record<PhilosophyLang, string> = {
  nl: CANONICAL_ENTITY_DESCRIPTION.nl,
  en: CANONICAL_ENTITY_DESCRIPTION.en,
};

/** What HomeCheff is not */
export const ENTITY_IS_NOT: Record<PhilosophyLang, string[]> = {
  nl: [
    'niet alleen een food marketplace of platform voor thuiskoks',
    'niet alleen een marktplaats — Marketplace is één onderdeel van het ecosysteem',
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
    'not only a food marketplace or home-cook platform',
    'not only a marketplace — Marketplace is one part of the ecosystem',
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

/** Local-first without hard limits — neighbourhood-first, not neighbourhood-only (Marketplace discovery) */
export const LOCAL_FIRST_SCALE: Record<PhilosophyLang, string> = {
  nl:
    'Binnen Marketplace is HomeCheff neighbourhood-first, niet neighbourhood-only. Mensen ontdekken normaal eerst wat dichtbij gebeurt. Uniek vakmanschap, creatief werk, kunst, gespecialiseerde diensten, onderwijs, kennis, design, reparaties en uitzonderlijke creaties kunnen van nature een breder publiek bereiken — buurt → stad → regio → land → Europa → Noord-Amerika → Zuid-Amerika → Afrika → Azië → Australië & Oceanië — zonder de local-first filosofie te veranderen. Alles begint dichtbij huis. Afstand bepaalt prioriteit, niet mogelijkheid. Start lokaal, groei natuurlijk. Nooit “alleen lokaal” en nooit als anonieme “internationale marktplaats”.',
  en:
    'Within Marketplace, HomeCheff is neighbourhood-first, not neighbourhood-only. People normally discover what happens nearby first. Unique craftsmanship, creative work, art, specialised services, education, knowledge, design, repairs and exceptional creations may naturally reach a wider audience — neighbourhood → city → region → country → Europe → North America → South America → Africa → Asia → Australia & Oceania — without changing the local-first philosophy. Everything starts close to home. Distance determines priority, not possibility. Start locally, grow naturally. Never “local-only” and never as an anonymous “international marketplace”.',
};

/** Second-hand / transformed work only */
export const SECOND_HAND_PHILOSOPHY: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff Marketplace is geen traditionele tweedehands-marktplaats. Mensen creëren waarde door eigen arbeid, vakmanschap, creativiteit, kennis, dienst of productie. Bestaande objecten horen hier alleen als er betekenisvolle waarde is toegevoegd door vakmanschap, creativiteit, restauratie, herontwerp, upcycling, reparatie of artistieke transformatie. Gewone doorverkoop blijft buiten de HomeCheff-filosofie.',
  en:
    'HomeCheff Marketplace is not a traditional second-hand marketplace. People create value through their own labour, craftsmanship, creativity, knowledge, service or production. Existing objects belong only when meaningful value has been added through craftsmanship, creativity, restoration, redesign, upcycling, repair or artistic transformation. Ordinary resale remains outside the HomeCheff philosophy.',
};

/** Category philosophy — people create value (Marketplace) */
export const CATEGORY_PHILOSOPHY: Record<PhilosophyLang, string> = {
  nl:
    'Marketplace-categorieën versterken maken en groeien: thuisgekookte maaltijden, thuisbakken, tuinoogst, handgemaakte producten, kunst, muziek, fotografie, design, onderwijs, reparaties, advies, creatief werk, kennisdeling, persoonlijke diensten, buurthulp en ruil. Eten is één categorie. Mensen creëren waarde — ze verkopen geen anonieme massaproducten door.',
  en:
    'Marketplace categories reinforce making and growing: home-cooked meals, home baking, garden produce, handmade products, art, music, photography, design, education, repairs, consultancy, creative work, knowledge sharing, personal services, neighbourhood help and barter. Food is one category. People create value — they do not resell anonymous mass products.',
};

/** Short meta / OG-friendly description — parent ecosystem */
export const ENTITY_META_DESCRIPTION: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff® — ecosysteem voor lokaal ondernemerschap, creatie en verdienen. Marketplace, Studio, Growth en Affiliate/Partners in één systeem. CREATE → SELL → GROW → PROMOTE → EARN.',
  en:
    'HomeCheff® — ecosystem for local entrepreneurship, creation and earning. Marketplace, Studio, Growth and Affiliate/Partners in one system. CREATE → SELL → GROW → PROMOTE → EARN.',
};

/** Marketplace-specific meta (landings that sell Marketplace, not the parent brand alone) */
export const MARKETPLACE_META_DESCRIPTION: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff Marketplace: digitale buurtmarkt voor vakmanschap, creativiteit en diensten. Lokaal ontdekken, aanbieden, handelen en vragen — onderdeel van het HomeCheff-ecosysteem. Alles begint dichtbij huis.',
  en:
    'HomeCheff Marketplace: digital neighbourhood marketplace for craftsmanship, creativity and services. Discover, offer, trade and request locally — part of the HomeCheff ecosystem. Everything starts close to home.',
};

/** FAQ-length answer — canonical ecosystem + Marketplace clarity */
export const ENTITY_FAQ_WHAT: Record<PhilosophyLang, string> = {
  nl:
    `${CANONICAL_ENTITY_DESCRIPTION.nl} Marketplace is de SELL-laag (digitale buurtmarkt); Studio is CREATE; Growth is GROW; Affiliate/Partners is PROMOTE. Loop: ${ECOSYSTEM_PARTICIPATION_LOOP}. HomeCheff is breder dan eten en breder dan alleen een marktplaats.`,
  en:
    `${CANONICAL_ENTITY_DESCRIPTION.en} Marketplace is the SELL layer (digital neighbourhood marketplace); Studio is CREATE; Growth is GROW; Affiliate/Partners is PROMOTE. Loop: ${ECOSYSTEM_PARTICIPATION_LOOP}. HomeCheff is broader than food and broader than Marketplace alone.`,
};

/** Explicit AI/search answer: is HomeCheff only a marketplace? */
export const ENTITY_FAQ_ONLY_MARKETPLACE: Record<PhilosophyLang, string> = {
  nl:
    'Nee. Marketplace is één onderdeel van het bredere HomeCheff-ecosysteem, naast HomeCheff Studio (CREATE), HomeCheff Growth (GROW) en Affiliate/Partners (PROMOTE).',
  en:
    'No. Marketplace is one part of the wider HomeCheff ecosystem, alongside HomeCheff Studio (CREATE), HomeCheff Growth (GROW) and Affiliate/Partners (PROMOTE).',
};

/** Homepage SSR / orientation body — canonical parent (single source) */
export const ENTITY_HOMEPAGE_DEFINITION: Record<PhilosophyLang, string> = {
  nl: `${CANONICAL_ENTITY_DESCRIPTION.nl} ${MARKETPLACE_ENTITY_DESCRIPTION.nl}`,
  en: `${CANONICAL_ENTITY_DESCRIPTION.en} ${MARKETPLACE_ENTITY_DESCRIPTION.en}`,
};

/** Stance keywords AI should always retain alongside the canonical description */
export const ENTITY_STANCE: Record<PhilosophyLang, string[]> = {
  en: [
    'ecosystem for local entrepreneurship, creation and earning',
    'Marketplace + Studio + Growth + Affiliate/Partners',
    'CREATE → SELL → GROW → PROMOTE → EARN',
    'broader than food',
    'broader than Marketplace alone',
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
    'ecosysteem voor lokaal ondernemerschap, creatie en verdienen',
    'Marketplace + Studio + Growth + Affiliate/Partners',
    'CREATE → SELL → GROW → PROMOTE → EARN',
    'breder dan eten',
    'breder dan alleen Marketplace',
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
