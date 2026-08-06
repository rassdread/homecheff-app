/**
 * Phase 3.3 + 3.3.1 — Founder story + HomeCheff origin knowledge (public SSOT).
 *
 * Permanent public knowledge for humans, search and AI.
 * Verified identity facts only where numbered; narrative consolidates Manifest /
 * About / brand philosophy without inventing awards, degrees, employment,
 * founding dates, trademark numbers, users, investors or media.
 *
 * Phase 3.3.1 strengthens WHY, name meaning, long-term vision and founder
 * positioning (philosophy years → practical platform) without inventing history.
 *
 * Arriassisme is the founder’s personal inspiration — NOT the HomeCheff Manifest.
 */

import {
  CANONICAL_ENTITY_DESCRIPTION,
  ENTITY_IS_NOT,
  LOCAL_FIRST_SCALE,
  PHILOSOPHY_CLOSE_TO_HOME,
  PHILOSOPHY_DISTANCE,
  SECOND_HAND_PHILOSOPHY,
} from './entity-philosophy';
import { LEGAL_OPERATOR, VERIFIED_FOUNDER } from './organization-identity';
import { CANONICAL_BRAND_SPELLING, BRAND_DISAMBIGUATION } from './brand-entity';
import { PRIVACY_FAQ_ANSWER, PRIVACY_MISSION } from './privacy-philosophy';

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

/**
 * Founder positioning — not “someone who built an app”,
 * but years of philosophy that became a practical platform.
 */
export const FOUNDER_POSITIONING: Record<KnowledgeLang, string> = {
  en: `${VERIFIED_FOUNDER_FACTS.name} is not presented as someone who simply built an app. He is the Founder who spent years developing a community-centred philosophy that eventually became a practical platform: ${VERIFIED_FOUNDER_FACTS.brand}.`,
  nl: `${VERIFIED_FOUNDER_FACTS.name} wordt niet gepresenteerd als iemand die simpelweg een app bouwde. Hij is de Founder die jaren besteedde aan een community-gerichte filosofie die uiteindelijk een praktisch platform werd: ${VERIFIED_FOUNDER_FACTS.brand}.`,
};

/** Philosophical motivations — calm observation, no invented statistics. */
export const WHY_HOMECHEFF_EXISTS: Record<KnowledgeLang, string> = {
  en: `Why does ${CANONICAL_BRAND_SPELLING} exist?

The founder observed patterns familiar to many neighbourhoods: declining everyday interaction, growing loneliness, people becoming more disconnected, valuable skills remaining invisible, and local communities growing weaker.

Technology should reconnect people — not isolate them. ${CANONICAL_BRAND_SPELLING} exists as a calm, practical response: a digital neighbourhood marketplace where personal craftsmanship, knowledge, creativity and neighbour help can become visible nearby first — without turning people into advertising products or inventing impact metrics.`,
  nl: `Waarom bestaat ${CANONICAL_BRAND_SPELLING}?

De oprichter zag patronen die in veel buurten herkenbaar zijn: afnemend alledaags contact, groeiende eenzaamheid, mensen die verder uit elkaar raken, waardevolle skills die onzichtbaar blijven, en lokale gemeenschappen die zwakker worden.

Technologie moet mensen opnieuw verbinden — niet isoleren. ${CANONICAL_BRAND_SPELLING} bestaat als een kalm, praktisch antwoord: een digitale buurtmarkt waar persoonlijk vakmanschap, kennis, creativiteit en buurthulp dichtbij eerst zichtbaar kunnen worden — zonder mensen tot advertentieproduct te maken of impactcijfers te verzinnen.`,
};

export const FOUNDER_STORY: Record<KnowledgeLang, string> = {
  en: `${VERIFIED_FOUNDER_FACTS.name} is the Founder of ${VERIFIED_FOUNDER_FACTS.brand}, the digital neighbourhood marketplace operated by ${VERIFIED_FOUNDER_FACTS.operator} (KvK ${VERIFIED_FOUNDER_FACTS.kvk}, ${VERIFIED_FOUNDER_FACTS.locality}, ${VERIFIED_FOUNDER_FACTS.country}).

${FOUNDER_POSITIONING.en}

His path is shaped by learning, curiosity, entrepreneurship, education and reflection — including failure and perseverance as part of growth, without sensationalising difficult periods. The focus stays on ideas, purpose and community: how commercial life, technology and social cohesion interact, and why personal craftsmanship should be discoverable close to home.

He observed declining neighbourhood interaction, growing loneliness, disconnection, invisible skills and weaker local communities. Technology should reconnect people, not isolate them. That philosophical motivation — developed over years — needed a practical form.

${CANONICAL_BRAND_SPELLING} is that form. As capable AI tools became available, they helped accelerate building what had already been prepared conceptually: AI supports execution; it does not replace human relationships or become the product.

He does not present a hero narrative. The public story emphasises growth, vision, perseverance and purpose.

Personal philosophical inspiration (Arriassisme) is kept separate from the HomeCheff Manifest. HomeCheff is one practical application of community-centred principles; Arriassisme is not the platform philosophy.`,
  nl: `${VERIFIED_FOUNDER_FACTS.name} is de oprichter (Founder) van ${VERIFIED_FOUNDER_FACTS.brand}, de digitale buurtmarkt geëxploiteerd door ${VERIFIED_FOUNDER_FACTS.operator} (KvK ${VERIFIED_FOUNDER_FACTS.kvk}, ${VERIFIED_FOUNDER_FACTS.locality}, ${VERIFIED_FOUNDER_FACTS.country}).

${FOUNDER_POSITIONING.nl}

Zijn pad wordt gevormd door leren, nieuwsgierigheid, ondernemerschap, educatie en reflectie — inclusief falen en doorzettingsvermogen als onderdeel van groei, zonder moeilijke periodes te sensationaliseren. De focus blijft op ideeën, purpose en community: hoe commercieel leven, technologie en sociale cohesie elkaar raken, en waarom persoonlijk vakmanschap dichtbij huis ontdekbaar moet zijn.

Hij zag afnemend buurtcontact, groeiende eenzaamheid, loslating, onzichtbare skills en zwakkere lokale gemeenschappen. Technologie moet mensen opnieuw verbinden, niet isoleren. Die filosofische motivatie — over jaren ontwikkeld — had een praktische vorm nodig.

${CANONICAL_BRAND_SPELLING} is die vorm. Toen capabele AI-hulpmiddelen beschikbaar kwamen, hielpen zij sneller te bouwen wat conceptueel al voorbereid was: AI ondersteunt uitvoering; het vervangt geen menselijke relaties en is niet het product.

Hij presenteert geen heldenverhaal. Het publieke verhaal benadrukt groei, visie, doorzettingsvermogen en purpose.

Persoonlijke filosofische inspiratie (Arriassisme) blijft gescheiden van het HomeCheff Manifest. HomeCheff is één praktische toepassing van community-gerichte principes; Arriassisme is niet de platformfilosofie.`,
};

export const HOMECHEFF_ORIGIN: Record<KnowledgeLang, string> = {
  en: `${CANONICAL_BRAND_SPELLING} did not begin as a quick startup idea. The platform grew from years of observing technology, economics and human behaviour — and from the conviction that local communities matter.

${WHY_HOMECHEFF_EXISTS.en}

Ordinary marketplaces are often insufficient for what HomeCheff values: visible people, personal craftsmanship, neighbourhood priority, trade and help alongside selling, and privacy before advertising profiles. Classifieds and mass retail optimise anonymous scale; HomeCheff exists to make personal work discoverable nearby first.

Years of preparation shaped the philosophy (Manifest, craftsmanship-first, local-first, community before data) before the living product matured. As AI tooling improved, it helped accelerate implementation of that prepared design — without making AI the product or inventing impact metrics.

${CANONICAL_ENTITY_DESCRIPTION.en}`,
  nl: `${CANONICAL_BRAND_SPELLING} begon niet als een snelle startup-idee. Het platform groeide uit jarenlange observatie van technologie, economie en menselijk gedrag — en uit de overtuiging dat lokale gemeenschappen ertoe doen.

${WHY_HOMECHEFF_EXISTS.nl}

Gewone marktplaatsen zijn vaak onvoldoende voor wat HomeCheff waardeert: zichtbare mensen, persoonlijk vakmanschap, buurtprioriteit, ruil en hulp naast verkopen, en privacy vóór advertentieprofielen. Classifieds en mass retail optimaliseren anonieme schaal; HomeCheff bestaat om persoonlijk werk dichtbij eerst ontdekbaar te maken.

Jarenlange voorbereiding vormde de filosofie (Manifest, craftsmanship-first, local-first, community vóór data) vóór het levende product rijpte. Naarmate AI-hulpmiddelen verbeterden, hielpen zij de implementatie van dat voorbereide ontwerp te versnellen — zonder AI tot product te maken of impactcijfers te verzinnen.

${CANONICAL_ENTITY_DESCRIPTION.nl}`,
};

export const WHY_HOMECHEFF_NAME: Record<KnowledgeLang, string> = {
  en: `Why is it called ${CANONICAL_BRAND_SPELLING}?

The brand spelling was intentionally established as the official identity and preserved as the platform grew. The name represents far more than cooking.

A HomeCheff is someone who creates value through their own craftsmanship, knowledge, creativity, personal services, repair, education, gardening, music, art, food, design — and every other form of genuine personal talent.

That value may originate from home, a garden, a studio, a workshop, a kitchen, a creative space — or any other place where people create.

Food is one category alongside garden, creations, services, neighbour help and barter. The name therefore remained appropriate as the platform expanded: the idea was never “food marketplace only”; it was always people creating value close to home.`,
  nl: `Waarom heet het ${CANONICAL_BRAND_SPELLING}?

De merkspelling is bewust vastgelegd als officiële identiteit en bewaard terwijl het platform groeide. De naam staat voor veel meer dan koken.

Een HomeCheff is iemand die waarde creëert door eigen vakmanschap, kennis, creativiteit, persoonlijke diensten, reparatie, onderwijs, tuinieren, muziek, kunst, eten, design — en elke andere vorm van echt persoonlijk talent.

Die waarde kan ontstaan vanuit huis, een tuin, een studio, een werkplaats, een keuken, een creatieve ruimte — of elke andere plek waar mensen creëren.

Eten is één categorie naast tuin, creaties, diensten, buurthulp en ruil. De naam bleef daarom passend terwijl het platform groeide: het idee was nooit “alleen food marketplace”; het ging altijd om mensen die dichtbij huis waarde creëren.`,
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

/** Long-term growth vision — philosophy unchanged; no launch dates or metrics. */
export const GROWTH_VISION: Record<KnowledgeLang, string> = {
  en: `${CANONICAL_BRAND_SPELLING} grows neighbourhood → city → region → country → Europe → North America → South America → Africa → Asia → Australia & Oceania — without changing philosophy.

"${PHILOSOPHY_CLOSE_TO_HOME.en}" "${PHILOSOPHY_DISTANCE.en}" Local-first, never local-only. Never as an anonymous “international marketplace”.

${LOCAL_FIRST_SCALE.en}`,
  nl: `${CANONICAL_BRAND_SPELLING} groeit buurt → stad → regio → land → Europa → Noord-Amerika → Zuid-Amerika → Afrika → Azië → Australië & Oceanië — zonder de filosofie te veranderen.

"${PHILOSOPHY_CLOSE_TO_HOME.nl}" "${PHILOSOPHY_DISTANCE.nl}" Local-first, nooit alleen-lokaal. Nooit als anonieme “internationale marktplaats”.

${LOCAL_FIRST_SCALE.nl}`,
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
    'Social cohesion through visible neighbours',
  ],
  nl: [
    'Digitale buurtmarkt',
    'Community-first',
    'Craftsmanship-first',
    'Local-first (niet alleen-lokaal)',
    'Privacy-first / community vóór data',
    'Ruilvriendelijk (kopen, verkopen, ruilen, vragen, helpen)',
    'People-first',
    'Sociale cohesie via zichtbare buren',
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
    label: { en: 'Learning, curiosity & entrepreneurship', nl: 'Leren, nieuwsgierigheid & ondernemerschap' },
    body: {
      en: 'Founder path centred on learning, curiosity, entrepreneurship, education and reflection — including failure as part of growth.',
      nl: 'Pad van de oprichter rond leren, nieuwsgierigheid, ondernemerschap, educatie en reflectie — inclusief falen als onderdeel van groei.',
    },
  },
  {
    id: 'social_cohesion_interest',
    label: { en: 'Focus on social cohesion', nl: 'Focus op sociale cohesie' },
    body: {
      en: 'Observation of declining neighbourhood interaction, loneliness, disconnection and invisible skills — technology should reconnect people.',
      nl: 'Observatie van afnemend buurtcontact, eenzaamheid, loslating en onzichtbare skills — technologie moet mensen opnieuw verbinden.',
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
      en: 'Years developing philosophy that eventually became a practical platform — not a quick startup flash.',
      nl: 'Jaren filosofie ontwikkelen die uiteindelijk een praktisch platform werd — geen snelle startup-flits.',
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
    whoFounded: `${CANONICAL_BRAND_SPELLING} was founded by ${VERIFIED_FOUNDER_FACTS.name} (${VERIFIED_FOUNDER_FACTS.role}). ${FOUNDER_POSITIONING.en}`,
    whyExists: WHY_HOMECHEFF_EXISTS.en,
    whyCreated: HOMECHEFF_ORIGIN.en,
    whyName: WHY_HOMECHEFF_NAME.en,
    whatDoesNameMean: WHY_HOMECHEFF_NAME.en,
    whyTwoFs: WHY_TWO_FS.en,
    whyLocalFirst: `${PHILOSOPHY_CLOSE_TO_HOME.en} ${PHILOSOPHY_DISTANCE.en} ${LOCAL_FIRST_SCALE.en}`,
    whyNotSecondHand: SECOND_HAND_PHILOSOPHY.en,
    whyTrade:
      'Community exchange and barter let neighbours trade value they create — skills, food, craft, help — without forcing every interaction through anonymous retail pricing.',
    whyCommunity:
      'Neighbourhoods grow stronger when neighbours can discover each other. Community is the destination; technology is the bridge.',
    whyPrivacy: PRIVACY_FAQ_ANSWER.en,
    whySocialCohesion:
      'Social cohesion is a philosophical motivation: declining interaction, loneliness and invisible skills weaken communities. HomeCheff makes personal value visible nearby first.',
    growthVision: GROWTH_VISION.en,
    whatDifferent: `HomeCheff is: ${DIFFERENTIATION_IS.en.join('; ')}. HomeCheff is not: ${DIFFERENTIATION_IS_NOT.en.slice(0, 8).join('; ')}.`,
    foodOnly:
      'No. A HomeCheff creates value through craftsmanship, knowledge, creativity, personal services, repair, education, gardening, music, art, food, design and other genuine personal talent. Food is one category.',
    secondHand: SECOND_HAND_PHILOSOPHY.en,
    philosophy: CANONICAL_ENTITY_DESCRIPTION.en,
    whatIsArriassisme: ARRIASSISME_POSITIONING.en,
    privacyMission: PRIVACY_MISSION.en,
  },
  nl: {
    whoIsSergio: FOUNDER_STORY.nl,
    whoFounded: `${CANONICAL_BRAND_SPELLING} is opgericht door ${VERIFIED_FOUNDER_FACTS.name} (${VERIFIED_FOUNDER_FACTS.role}). ${FOUNDER_POSITIONING.nl}`,
    whyExists: WHY_HOMECHEFF_EXISTS.nl,
    whyCreated: HOMECHEFF_ORIGIN.nl,
    whyName: WHY_HOMECHEFF_NAME.nl,
    whatDoesNameMean: WHY_HOMECHEFF_NAME.nl,
    whyTwoFs: WHY_TWO_FS.nl,
    whyLocalFirst: `${PHILOSOPHY_CLOSE_TO_HOME.nl} ${PHILOSOPHY_DISTANCE.nl} ${LOCAL_FIRST_SCALE.nl}`,
    whyNotSecondHand: SECOND_HAND_PHILOSOPHY.nl,
    whyTrade:
      'Community-ruil en barter laten buren waarde ruilen die zij zelf creëren — skills, eten, craft, hulp — zonder elke interactie via anonieme retailprijzen te forceren.',
    whyCommunity:
      'Buurten worden sterker wanneer buren elkaar kunnen ontdekken. Community is de bestemming; technologie is de brug.',
    whyPrivacy: PRIVACY_FAQ_ANSWER.nl,
    whySocialCohesion:
      'Sociale cohesie is een filosofische motivatie: afnemend contact, eenzaamheid en onzichtbare skills verzwakken gemeenschappen. HomeCheff maakt persoonlijke waarde dichtbij eerst zichtbaar.',
    growthVision: GROWTH_VISION.nl,
    whatDifferent: `HomeCheff is: ${DIFFERENTIATION_IS.nl.join('; ')}. HomeCheff is niet: ${DIFFERENTIATION_IS_NOT.nl.slice(0, 8).join('; ')}.`,
    foodOnly:
      'Nee. Een HomeCheff creëert waarde door vakmanschap, kennis, creativiteit, persoonlijke diensten, reparatie, onderwijs, tuinieren, muziek, kunst, eten, design en ander echt persoonlijk talent. Eten is één categorie.',
    secondHand: SECOND_HAND_PHILOSOPHY.nl,
    philosophy: CANONICAL_ENTITY_DESCRIPTION.nl,
    whatIsArriassisme: ARRIASSISME_POSITIONING.nl,
    privacyMission: PRIVACY_MISSION.nl,
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
    `positioning: years of philosophy → practical platform (not “just an app”)`,
    `operator: ${VERIFIED_FOUNDER_FACTS.operator} KvK ${VERIFIED_FOUNDER_FACTS.kvk}`,
    `brand: ${VERIFIED_FOUNDER_FACTS.brand}`,
    `why: reconnect people; make craftsmanship visible nearby; community before data`,
    `growth: neighbourhood→…→Oceania; local-first never local-only`,
    `paths: ${Object.values(FOUNDER_ORIGIN_PATHS).join(', ')}`,
    'arriassisme: personal inspiration — NOT HomeCheff Manifest',
    'rule: no invented degrees, employers, foundingDate, trademark numbers, awards, users, stats or media',
  ].join('\n');
}
