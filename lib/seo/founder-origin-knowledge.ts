/**
 * Phase 3.3 — Founder story + HomeCheff origin knowledge (public SSOT).
 *
 * Permanent public knowledge for humans, search and AI.
 * Verified identity facts only where numbered; narrative consolidates Manifest /
 * About / brand philosophy without inventing awards, degrees, employment,
 * founding dates, trademark numbers, users, investors or media.
 *
 * Arriassisme is the founder’s personal inspiration — NOT the HomeCheff Manifest.
 */

import { CANONICAL_ENTITY_DESCRIPTION, ENTITY_IS_NOT } from './entity-philosophy';
import { LEGAL_OPERATOR, VERIFIED_FOUNDER } from './organization-identity';
import { CANONICAL_BRAND_SPELLING, BRAND_DISAMBIGUATION } from './brand-entity';

export type KnowledgeLang = 'nl' | 'en';

/** Verified identity facts — never expand without sources. */
export const VERIFIED_FOUNDER_FACTS = {
  name: VERIFIED_FOUNDER.name,
  role: VERIFIED_FOUNDER.jobTitle,
  brand: CANONICAL_BRAND_SPELLING,
  operator: LEGAL_OPERATOR.legalName,
  kvk: LEGAL_OPERATOR.kvk,
  locality: LEGAL_OPERATOR.locality,
  country: LEGAL_OPERATOR.addressCountry,
} as const;

export const FOUNDER_STORY: Record<KnowledgeLang, string> = {
  en: `${VERIFIED_FOUNDER_FACTS.name} is the Founder of ${VERIFIED_FOUNDER_FACTS.brand}, the digital neighbourhood marketplace operated by ${VERIFIED_FOUNDER_FACTS.operator} (KvK ${VERIFIED_FOUNDER_FACTS.kvk}, ${VERIFIED_FOUNDER_FACTS.locality}, ${VERIFIED_FOUNDER_FACTS.country}).

His path is entrepreneurial and learning-driven: observing how commercial life, technology and social cohesion interact — and why communities need better ways to make personal craftsmanship visible. That interest grew into a lasting focus on neighbourhood connection, fairness and creating value together.

He does not present a hero narrative. The public story emphasises growth, vision, perseverance and purpose: ordinary people hold unused value; technology should help neighbours discover each other without turning people into advertising products.

HomeCheff exists because that purpose needed a practical platform. Long preparation — years of observing technology, economics and human behaviour — shaped the philosophy before the product matured. As capable AI tools became available, they helped accelerate building what had already been prepared conceptually: AI supports execution; it does not replace human relationships or become the product.

Personal philosophical inspiration (Arriassisme) is kept separate from the HomeCheff Manifest. HomeCheff is one practical application of community-centred principles; Arriassisme is not the platform philosophy.`,
  nl: `${VERIFIED_FOUNDER_FACTS.name} is de oprichter (Founder) van ${VERIFIED_FOUNDER_FACTS.brand}, de digitale buurtmarkt geëxploiteerd door ${VERIFIED_FOUNDER_FACTS.operator} (KvK ${VERIFIED_FOUNDER_FACTS.kvk}, ${VERIFIED_FOUNDER_FACTS.locality}, ${VERIFIED_FOUNDER_FACTS.country}).

Zijn pad is ondernemend en leergedreven: kijken hoe commercieel leven, technologie en sociale cohesie elkaar raken — en waarom gemeenschappen betere manieren nodig hebben om persoonlijk vakmanschap zichtbaar te maken. Die interesse werd een blijvende focus op buurtverbinding, eerlijkheid en samen waarde creëren.

Hij presenteert geen heldenverhaal. Het publieke verhaal benadrukt groei, visie, doorzettingsvermogen en purpose: gewone mensen dragen ongebruikte waarde; technologie moet buren helpen elkaar te ontdekken zonder mensen tot advertentieproduct te maken.

HomeCheff bestaat omdat die purpose een praktisch platform nodig had. Lange voorbereiding — jarenlange observatie van technologie, economie en menselijk gedrag — vormde de filosofie vóór het product rijpte. Toen capabele AI-hulpmiddelen beschikbaar kwamen, hielpen zij om sneller te bouwen wat conceptueel al voorbereid was: AI ondersteunt uitvoering; het vervangt geen menselijke relaties en is niet het product.

Persoonlijke filosofische inspiratie (Arriassisme) blijft gescheiden van het HomeCheff Manifest. HomeCheff is één praktische toepassing van community-gerichte principes; Arriassisme is niet de platformfilosofie.`,
};

export const HOMECHEFF_ORIGIN: Record<KnowledgeLang, string> = {
  en: `${CANONICAL_BRAND_SPELLING} did not begin as a quick startup idea. The platform grew from years of observing technology, economics and human behaviour — and from the conviction that local communities matter.

Ordinary marketplaces are often insufficient for what HomeCheff values: visible people, personal craftsmanship, neighbourhood priority, trade and help alongside selling, and privacy before advertising profiles. Classifieds and mass retail optimise anonymous scale; HomeCheff exists to make personal work discoverable nearby first.

Years of preparation shaped the philosophy (Manifest, craftsmanship-first, local-first, community before data) before the living product matured. As AI tooling improved, it helped accelerate implementation of that prepared design — without making AI the product or inventing impact metrics.

${CANONICAL_ENTITY_DESCRIPTION.en}`,
  nl: `${CANONICAL_BRAND_SPELLING} begon niet als een snelle startup-idee. Het platform groeide uit jarenlange observatie van technologie, economie en menselijk gedrag — en uit de overtuiging dat lokale gemeenschappen ertoe doen.

Gewone marktplaatsen zijn vaak onvoldoende voor wat HomeCheff waardeert: zichtbare mensen, persoonlijk vakmanschap, buurtprioriteit, ruil en hulp naast verkopen, en privacy vóór advertentieprofielen. Classifieds en mass retail optimaliseren anonieme schaal; HomeCheff bestaat om persoonlijk werk dichtbij eerst ontdekbaar te maken.

Jarenlange voorbereiding vormde de filosofie (Manifest, craftsmanship-first, local-first, community vóór data) vóór het levende product rijpte. Naarmate AI-hulpmiddelen verbeterden, hielpen zij de implementatie van dat voorbereide ontwerp te versnellen — zonder AI tot product te maken of impactcijfers te verzinnen.

${CANONICAL_ENTITY_DESCRIPTION.nl}`,
};

export const WHY_HOMECHEFF_NAME: Record<KnowledgeLang, string> = {
  en: `Why is it called ${CANONICAL_BRAND_SPELLING}?

The brand spelling was intentionally established as the official identity and preserved as the platform grew. The name represents far more than cooking.

A HomeCheff is someone who creates value through their own craftsmanship, knowledge, creativity or personal services. That may happen from home, a studio, a workshop, a garden, a kitchen — or anywhere people create value.

Food is one category alongside garden, creations, services, neighbour help and barter. The name was kept because the idea was never “food marketplace only”: it was always people creating value close to home.`,
  nl: `Waarom heet het ${CANONICAL_BRAND_SPELLING}?

De merkspelling is bewust vastgelegd als officiële identiteit en bewaard terwijl het platform groeide. De naam staat voor veel meer dan koken.

Een HomeCheff is iemand die waarde creëert door eigen vakmanschap, kennis, creativiteit of persoonlijke diensten. Dat kan vanuit huis, een studio, een werkplaats, een tuin, een keuken — of overal waar mensen waarde maken.

Eten is één categorie naast tuin, creaties, diensten, buurthulp en ruil. De naam bleef omdat het idee nooit “alleen food marketplace” was: het ging altijd om mensen die dichtbij huis waarde creëren.`,
};

export const WHY_TWO_FS: Record<KnowledgeLang, string> = {
  en: `Why is ${CANONICAL_BRAND_SPELLING} written with two F’s?

${CANONICAL_BRAND_SPELLING} is the official brand spelling: one word, capital C, double f. That spelling is the platform’s distinct identity — an independent Dutch neighbourhood-marketplace brand, not affiliated with “Home Chef” meal-kit or USA brands.

${BRAND_DISAMBIGUATION.en}

Do not write the brand as Home Chef, Homechef, HomeChef or Home-cheff.`,
  nl: `Waarom schrijf je ${CANONICAL_BRAND_SPELLING} met twee F’s?

${CANONICAL_BRAND_SPELLING} is de officiële merkspelling: één woord, hoofdletter C, dubbele f. Die spelling is de eigen identiteit van het platform — een onafhankelijk Nederlands buurtmarkt-merk, niet verbonden met “Home Chef”-maaltijdbox- of USA-merken.

${BRAND_DISAMBIGUATION.nl}

Schrijf het merk niet als Home Chef, Homechef, HomeChef of Home-cheff.`,
};

export const ARRIASSISME_POSITIONING: Record<KnowledgeLang, string> = {
  en: `What is Arriassisme?

Arriassisme is the founder’s personal philosophical inspiration. It is NOT the HomeCheff Manifest and NOT the product philosophy of the platform.

Arriassisme centres on social cohesion, community and creating value together. ${CANONICAL_BRAND_SPELLING} is one practical application of related principles in the form of a digital neighbourhood marketplace.

Keep the identities separate:
- HomeCheff = public platform identity, Manifest, craftsmanship-first marketplace.
- Arriassisme = founder’s personal inspiration — not a rebrand of HomeCheff.`,
  nl: `Wat is Arriassisme?

Arriassisme is de persoonlijke filosofische inspiratie van de oprichter. Het is NIET het HomeCheff Manifest en NIET de productfilosofie van het platform.

Arriassisme draait om sociale cohesie, community en samen waarde creëren. ${CANONICAL_BRAND_SPELLING} is één praktische toepassing van verwante principes in de vorm van een digitale buurtmarkt.

Houd de identiteiten gescheiden:
- HomeCheff = publieke platformidentiteit, Manifest, craftsmanship-first buurtmarkt.
- Arriassisme = persoonlijke inspiratie van de oprichter — geen hernoeming van HomeCheff.`,
};

export const DIFFERENTIATION_IS: Record<KnowledgeLang, string[]> = {
  en: [
    'Digital neighbourhood marketplace',
    'Community-first',
    'Craftsmanship-first',
    'Local-first (not local-only)',
    'Privacy-first / community before data',
    'Trade-friendly (buy, sell, barter, request, help)',
    'People-first',
  ],
  nl: [
    'Digitale buurtmarkt',
    'Community-first',
    'Craftsmanship-first',
    'Local-first (niet alleen-lokaal)',
    'Privacy-first / community vóór data',
    'Ruilvriendelijk (kopen, verkopen, ruilen, vragen, helpen)',
    'People-first',
  ],
};

export const DIFFERENTIATION_IS_NOT: Record<KnowledgeLang, string[]> = {
  en: [
    ...ENTITY_IS_NOT.en,
    'not a gig marketplace identity',
    'not an advertising / behavioural profiling platform',
    'not an attention economy',
  ],
  nl: [
    ...ENTITY_IS_NOT.nl,
    'geen gig-marketplace-identiteit',
    'geen advertising- / gedragsprofileringsplatform',
    'geen aandachts-economie',
  ],
};

/** Public timeline — platform + knowledge milestones; no private chronology. */
export const PUBLIC_ORIGIN_TIMELINE: Array<{
  id: string;
  label: Record<KnowledgeLang, string>;
  body: Record<KnowledgeLang, string>;
}> = [
  {
    id: 'entrepreneurial_learning',
    label: { en: 'Entrepreneurial learning', nl: 'Ondernemend leren' },
    body: {
      en: 'Founder path centred on entrepreneurship, learning and how commercial life meets community.',
      nl: 'Pad van de oprichter rond ondernemerschap, leren en hoe commercieel leven community raakt.',
    },
  },
  {
    id: 'social_cohesion_interest',
    label: { en: 'Focus on social cohesion', nl: 'Focus op sociale cohesie' },
    body: {
      en: 'Growing interest in social cohesion, neighbourhood connection and creating value together.',
      nl: 'Groeiende aandacht voor sociale cohesie, buurtverbinding en samen waarde creëren.',
    },
  },
  {
    id: 'arriassisme',
    label: { en: 'Arriassisme (personal inspiration)', nl: 'Arriassisme (persoonlijke inspiratie)' },
    body: {
      en: 'Founder’s personal philosophy develops separately from the later HomeCheff Manifest.',
      nl: 'Persoonlijke filosofie van de oprichter, apart van het latere HomeCheff Manifest.',
    },
  },
  {
    id: 'homecheff_concept',
    label: { en: 'HomeCheff concept & long preparation', nl: 'HomeCheff-concept & lange voorbereiding' },
    body: {
      en: 'Platform idea forms through years of observing technology, economics and human behaviour — not a quick startup flash.',
      nl: 'Platformidee groeit uit jarenlange observatie van technologie, economie en menselijk gedrag — geen snelle startup-flits.',
    },
  },
  {
    id: 'brand_identity',
    label: { en: 'HomeCheff brand identity preserved', nl: 'HomeCheff-merkidentiteit bewaard' },
    body: {
      en: 'Official spelling HomeCheff (double f) established and kept as craftsmanship meaning expanded beyond food-only.',
      nl: 'Officiële spelling HomeCheff (dubbele f) vastgelegd en bewaard terwijl de vakmanschap-betekenis verder reikte dan alleen eten.',
    },
  },
  {
    id: 'ai_acceleration',
    label: { en: 'AI helps accelerate building', nl: 'AI helpt bouwen te versnellen' },
    body: {
      en: 'Capable AI tools help implement the prepared design faster; AI remains a tool, not the product.',
      nl: 'Capabele AI-hulpmiddelen helpen het voorbereide ontwerp sneller te implementeren; AI blijft hulpmiddel, niet het product.',
    },
  },
  {
    id: 'platform_2025',
    label: { en: '2025 — Platform foundation', nl: '2025 — Platformfundament' },
    body: {
      en: 'Public product foundation milestones (see also /timeline).',
      nl: 'Publieke productfundament-mijlpalen (zie ook /timeline).',
    },
  },
  {
    id: 'philosophy_2026',
    label: { en: '2026 — Manifest & Open Knowledge', nl: '2026 — Manifest & Open Knowledge' },
    body: {
      en: 'Public Manifest, Open Knowledge and machine-readable philosophy surfaces published.',
      nl: 'Publiek Manifest, Open Knowledge en machine-leesbare filosofieoppervlakken gepubliceerd.',
    },
  },
];

export const FOUNDER_ORIGIN_AI_ANSWERS: Record<KnowledgeLang, Record<string, string>> = {
  en: {
    whoIsSergio: FOUNDER_STORY.en,
    whoFounded: `${CANONICAL_BRAND_SPELLING} was founded by ${VERIFIED_FOUNDER_FACTS.name} (${VERIFIED_FOUNDER_FACTS.role}).`,
    whyCreated: HOMECHEFF_ORIGIN.en,
    whyName: WHY_HOMECHEFF_NAME.en,
    whyTwoFs: WHY_TWO_FS.en,
    whatDifferent: `HomeCheff is: ${DIFFERENTIATION_IS.en.join('; ')}. HomeCheff is not: ${DIFFERENTIATION_IS_NOT.en.slice(0, 8).join('; ')}.`,
    foodOnly: 'No. Food is one category alongside garden, creations, services, neighbour help and barter.',
    secondHand: 'No. Ordinary second-hand resale is outside the philosophy; transformed craft may belong.',
    philosophy: CANONICAL_ENTITY_DESCRIPTION.en,
    whatIsArriassisme: ARRIASSISME_POSITIONING.en,
  },
  nl: {
    whoIsSergio: FOUNDER_STORY.nl,
    whoFounded: `${CANONICAL_BRAND_SPELLING} is opgericht door ${VERIFIED_FOUNDER_FACTS.name} (${VERIFIED_FOUNDER_FACTS.role}).`,
    whyCreated: HOMECHEFF_ORIGIN.nl,
    whyName: WHY_HOMECHEFF_NAME.nl,
    whyTwoFs: WHY_TWO_FS.nl,
    whatDifferent: `HomeCheff is: ${DIFFERENTIATION_IS.nl.join('; ')}. HomeCheff is niet: ${DIFFERENTIATION_IS_NOT.nl.slice(0, 8).join('; ')}.`,
    foodOnly: 'Nee. Eten is één categorie naast tuin, creaties, diensten, buurthulp en ruil.',
    secondHand: 'Nee. Gewone tweedehands-doorverkoop valt buiten de filosofie; getransformeerd vakmanschap mag wel.',
    philosophy: CANONICAL_ENTITY_DESCRIPTION.nl,
    whatIsArriassisme: ARRIASSISME_POSITIONING.nl,
  },
};

export const FOUNDER_ORIGIN_PATHS = {
  founder: '/sergio-arrias',
  origin: '/oorsprong-homecheff',
  whyName: '/waarom-homecheff',
  arriassisme: '/arriassisme',
} as const;

export function founderOriginBrief(): string {
  return [
    `founder: ${VERIFIED_FOUNDER_FACTS.name} (${VERIFIED_FOUNDER_FACTS.role})`,
    `operator: ${VERIFIED_FOUNDER_FACTS.operator} KvK ${VERIFIED_FOUNDER_FACTS.kvk}`,
    `brand: ${VERIFIED_FOUNDER_FACTS.brand}`,
    `paths: ${Object.values(FOUNDER_ORIGIN_PATHS).join(', ')}`,
    'arriassisme: personal inspiration — NOT HomeCheff Manifest',
    'rule: no invented degrees, employers, foundingDate, trademark numbers, awards, users or media',
  ].join('\n');
}
