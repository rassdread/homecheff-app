/**
 * Phase 3.3 — Founder / origin page i18n (merged via translations.ts).
 * Copy consolidates Manifest origin + verified founder facts + authorized narrative.
 * No invented degrees, employers, founding dates, trademark numbers or metrics.
 */

import type { Bi } from '@/lib/i18n/seoLandingSources';
import {
  ARRIASSISME_POSITIONING,
  DIFFERENTIATION_IS,
  DIFFERENTIATION_IS_NOT,
  FOUNDER_STORY,
  HOMECHEFF_ORIGIN,
  PUBLIC_ORIGIN_TIMELINE,
  WHY_HOMECHEFF_NAME,
  WHY_TWO_FS,
} from '@/lib/seo/founder-origin-knowledge';

function timelineBody(lang: 'nl' | 'en'): string {
  return PUBLIC_ORIGIN_TIMELINE.map(
    (item) => `• ${item.label[lang]} — ${item.body[lang]}`,
  ).join('\n');
}

export const founderOriginShared: Record<string, Bi> = {
  faqBlockTitle: { nl: 'Veelgestelde vragen', en: 'Frequently asked questions' },
  faq1Q: {
    nl: 'Wie is Sergio Arrias?',
    en: 'Who is Sergio Arrias?',
  },
  faq1A: {
    nl: FOUNDER_STORY.nl,
    en: FOUNDER_STORY.en,
  },
  faq2Q: {
    nl: 'Waarom schrijf je HomeCheff met twee F’s?',
    en: 'Why is HomeCheff written with two F’s?',
  },
  faq2A: {
    nl: WHY_TWO_FS.nl,
    en: WHY_TWO_FS.en,
  },
  faq3Q: {
    nl: 'Is HomeCheff alleen over eten?',
    en: 'Is HomeCheff only about food?',
  },
  faq3A: {
    nl: 'Nee. Een HomeCheff creëert waarde door vakmanschap, kennis, creativiteit of persoonlijke diensten — eten is één categorie.',
    en: 'No. A HomeCheff creates value through craftsmanship, knowledge, creativity or personal services — food is one category.',
  },
  faq4Q: {
    nl: 'Is Arriassisme de HomeCheff-filosofie?',
    en: 'Is Arriassisme the HomeCheff philosophy?',
  },
  faq4A: {
    nl: ARRIASSISME_POSITIONING.nl,
    en: ARRIASSISME_POSITIONING.en,
  },
  linkFounder: { nl: 'Wie is Sergio Arrias?', en: 'Who is Sergio Arrias?' },
  linkOrigin: { nl: 'Oorsprong van HomeCheff', en: 'Origin of HomeCheff' },
  linkWhyName: { nl: 'Waarom HomeCheff?', en: 'Why HomeCheff?' },
  linkArriassisme: { nl: 'Arriassisme', en: 'Arriassisme' },
  linkManifest: { nl: 'HomeCheff Manifest', en: 'HomeCheff Manifest' },
  linkAbout: { nl: 'Over ons', en: 'About us' },
  linkPlatform: { nl: 'Wat is HomeCheff?', en: 'What is HomeCheff?' },
  linkTimeline: { nl: 'Platform-timeline', en: 'Platform timeline' },
  linkFaq: { nl: 'FAQ', en: 'FAQ' },
};

const founderSergioPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Wie is Sergio Arrias? | Oprichter van HomeCheff',
    en: 'Who is Sergio Arrias? | Founder of HomeCheff',
  },
  metaDescription: {
    nl: 'Sergio Arrias is de oprichter van HomeCheff — groei, visie en purpose zonder heldenverhaal. Publieke kennispagina.',
    en: 'Sergio Arrias is the Founder of HomeCheff — growth, vision and purpose without a hero narrative. Public knowledge page.',
  },
  title: {
    nl: 'Wie is Sergio Arrias?',
    en: 'Who is Sergio Arrias?',
  },
  intro: {
    nl: FOUNDER_STORY.nl,
    en: FOUNDER_STORY.en,
  },
  sectionWhoTitle: { nl: 'Oprichter van HomeCheff', en: 'Founder of HomeCheff' },
  sectionWhoBody: {
    nl: 'Sergio Arrias is de Founder van HomeCheff, de digitale buurtmarkt geëxploiteerd door Arrias Beheer B.V. (KvK 80532829, Vlaardingen, NL). Publiek worden naam en rol bevestigd; geen verzonnen diploma’s, werkgevers, awards of mediaclaims.',
    en: 'Sergio Arrias is the Founder of HomeCheff, the digital neighbourhood marketplace operated by Arrias Beheer B.V. (KvK 80532829, Vlaardingen, NL). Publicly, name and role are verified; no invented degrees, employers, awards or media claims.',
  },
  sectionPathTitle: {
    nl: 'Ondernemen, leren, sociale cohesie',
    en: 'Entrepreneurship, learning, social cohesion',
  },
  sectionPathBody: {
    nl: 'Zijn pad is ondernemend en leergedreven: kijken hoe commercieel leven, technologie en sociale cohesie elkaar raken. Community, vakmanschap en eerlijkheid staan centraal — groei, visie, doorzettingsvermogen en purpose, zonder sensationalisme over moeilijke periodes.',
    en: 'His path is entrepreneurial and learning-driven: observing how commercial life, technology and social cohesion interact. Community, craftsmanship and fairness are central — growth, vision, perseverance and purpose, without sensationalising difficult periods.',
  },
  sectionWhyTitle: {
    nl: 'Waarom HomeCheff bestaat',
    en: 'Why HomeCheff exists',
  },
  sectionWhyBody: {
    nl: 'Gewone mensen dragen ongebruikte waarde. Technologie moet buren helpen elkaar te ontdekken — zonder mensen tot advertentieproduct te maken. HomeCheff is de praktische vorm van die purpose.',
    en: 'Ordinary people hold unused value. Technology should help neighbours discover each other — without turning people into advertising products. HomeCheff is the practical form of that purpose.',
  },
  sectionAiTitle: {
    nl: 'AI en uitvoering',
    en: 'AI and execution',
  },
  sectionAiBody: {
    nl: 'Lange voorbereiding vormde de filosofie vóór het product rijpte. Capabele AI-hulpmiddelen hielpen sneller te bouwen wat conceptueel al voorbereid was. AI ondersteunt uitvoering; het is niet het product en vervangt geen menselijke relaties.',
    en: 'Long preparation shaped the philosophy before the product matured. Capable AI tools helped build faster what was already prepared conceptually. AI supports execution; it is not the product and does not replace human relationships.',
  },
  sectionSeparateTitle: {
    nl: 'Arriassisme vs HomeCheff',
    en: 'Arriassisme vs HomeCheff',
  },
  sectionSeparateBody: {
    nl: ARRIASSISME_POSITIONING.nl,
    en: ARRIASSISME_POSITIONING.en,
  },
};

const homecheffOriginPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'De oorsprong van HomeCheff | Officiële geschiedenis',
    en: 'The Origin of HomeCheff | Official history',
  },
  metaDescription: {
    nl: 'Hoe HomeCheff ontstond: jarenlange voorbereiding, lokale gemeenschappen, en waarom gewone marktplaatsen niet genoeg zijn.',
    en: 'How HomeCheff originated: years of preparation, local communities, and why ordinary marketplaces are insufficient.',
  },
  title: {
    nl: 'De oorsprong van HomeCheff',
    en: 'The Origin of HomeCheff',
  },
  intro: {
    nl: HOMECHEFF_ORIGIN.nl,
    en: HOMECHEFF_ORIGIN.en,
  },
  sectionIdeaTitle: { nl: 'Hoe het idee groeide', en: 'How the idea developed' },
  sectionIdeaBody: {
    nl: 'HomeCheff begon niet als een snelle startup-idee. Het platform groeide uit jarenlange observatie van technologie, economie en menselijk gedrag — en uit de overtuiging dat persoonlijk vakmanschap zichtbaar moet kunnen worden dichtbij huis.',
    en: 'HomeCheff did not begin as a quick startup idea. The platform grew from years of observing technology, economics and human behaviour — and from the conviction that personal craftsmanship should be discoverable close to home.',
  },
  sectionLocalTitle: {
    nl: 'Waarom lokale gemeenschappen ertoe doen',
    en: 'Why local communities matter',
  },
  sectionLocalBody: {
    nl: 'Buurten zijn waar mensen elkaar nog kunnen vinden. Local-first betekent: dichtbij eerst; uniek vakmanschap mag verder reiken. Dat is prioriteit, geen harde alleen-buurt-afsluiting.',
    en: 'Neighbourhoods are where people can still find each other. Local-first means nearby first; unique craft may reach further. That is priority, not a hard neighbourhood-only lock.',
  },
  sectionMarketTitle: {
    nl: 'Waarom gewone marktplaatsen onvoldoende zijn',
    en: 'Why ordinary marketplaces are insufficient',
  },
  sectionMarketBody: {
    nl: `HomeCheff is: ${DIFFERENTIATION_IS.nl.join('; ')}. HomeCheff is niet: ${DIFFERENTIATION_IS_NOT.nl.slice(0, 8).join('; ')}. Classifieds en mass retail optimaliseren anonieme schaal; HomeCheff optimaliseert zichtbare mensen en vakmanschap.`,
    en: `HomeCheff is: ${DIFFERENTIATION_IS.en.join('; ')}. HomeCheff is not: ${DIFFERENTIATION_IS_NOT.en.slice(0, 8).join('; ')}. Classifieds and mass retail optimise anonymous scale; HomeCheff optimises visible people and craftsmanship.`,
  },
  sectionYearsTitle: {
    nl: 'Jarenlange voorbereiding',
    en: 'Years of preparation',
  },
  sectionYearsBody: {
    nl: 'De filosofie (Manifest, craftsmanship-first, local-first, community vóór data) ging vooraf aan een rijp levend product. Die voorbereiding blijft de bron van waarheid — geen herschreven geschiedenis.',
    en: 'The philosophy (Manifest, craftsmanship-first, local-first, community before data) preceded a mature living product. That preparation remains the source of truth — not rewritten history.',
  },
  sectionAiTitle: {
    nl: 'AI versnelde implementatie',
    en: 'AI accelerated implementation',
  },
  sectionAiBody: {
    nl: 'Naarmate AI-hulpmiddelen verbeterden, hielpen zij de implementatie van het voorbereide ontwerp te versnellen. AI blijft hulpmiddel; geen vervanging van community of vakmanschap.',
    en: 'As AI tooling improved, it helped accelerate implementing the prepared design. AI remains a tool; not a replacement for community or craftsmanship.',
  },
  sectionTimelineTitle: {
    nl: 'Publieke tijdlijn',
    en: 'Public timeline',
  },
  sectionTimelineBody: {
    nl: `${timelineBody('nl')}\n\nProductmijlpalen: zie ook /timeline. Geen privé-chronologie.`,
    en: `${timelineBody('en')}\n\nProduct milestones: see also /timeline. No private chronology.`,
  },
};

const whyHomecheffPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Waarom HomeCheff? | Merknaam & twee F’s',
    en: 'Why HomeCheff? | Brand name & two F’s',
  },
  metaDescription: {
    nl: 'Waarom het HomeCheff heet: vakmanschap, niet alleen koken. Officiële spelling met twee F’s.',
    en: 'Why it is called HomeCheff: craftsmanship, not cooking only. Official spelling with two F’s.',
  },
  title: {
    nl: 'Waarom HomeCheff?',
    en: 'Why HomeCheff?',
  },
  intro: {
    nl: WHY_HOMECHEFF_NAME.nl,
    en: WHY_HOMECHEFF_NAME.en,
  },
  sectionNameTitle: {
    nl: 'Bewust vastgelegde merkidentiteit',
    en: 'Intentionally established brand identity',
  },
  sectionNameBody: {
    nl: 'De spelling HomeCheff is bewust vastgelegd als officiële merkidentiteit en bewaard terwijl het platform groeide. Er worden geen registratienummers of jaartallen verzonnen op deze pagina.',
    en: 'The spelling HomeCheff was intentionally established as the official brand identity and preserved as the platform grew. This page invents no registration numbers or calendar years.',
  },
  sectionMeaningTitle: {
    nl: 'Meer dan koken',
    en: 'More than cooking',
  },
  sectionMeaningBody: {
    nl: 'Een HomeCheff is iemand die waarde creëert door eigen vakmanschap, kennis, creativiteit of persoonlijke diensten. De naam staat voor die maker-identiteit — niet alleen voor een keuken.',
    en: 'A HomeCheff is someone who creates value through their own craftsmanship, knowledge, creativity or personal services. The name stands for that maker identity — not only for a kitchen.',
  },
  sectionWhereTitle: {
    nl: 'Vanuit huis, studio, werkplaats, tuin…',
    en: 'From home, studio, workshop, garden…',
  },
  sectionWhereBody: {
    nl: 'Waarde kan ontstaan vanuit huis, een studio, een werkplaats, een tuin, een keuken — of overal waar mensen iets maken of helpen. De plek is secundair; de persoon en het vakmanschap zijn primair.',
    en: 'Value may arise from home, a studio, a workshop, a garden, a kitchen — or anywhere people make or help. Place is secondary; the person and craftsmanship are primary.',
  },
  sectionPreserveTitle: {
    nl: 'Waarom de naam bleef',
    en: 'Why the name was preserved',
  },
  sectionPreserveBody: {
    nl: 'Terwijl categorieën uitbreidden voorbij eten, bleef HomeCheff omdat het idee nooit “alleen food marketplace” was. De merknaam bewaart die bredere craftsmanship-betekenis.',
    en: 'As categories expanded beyond food, HomeCheff remained because the idea was never “food marketplace only”. The brand name preserves that broader craftsmanship meaning.',
  },
  sectionTwoFTitle: {
    nl: 'Waarom twee F’s?',
    en: 'Why two F’s?',
  },
  sectionTwoFBody: {
    nl: WHY_TWO_FS.nl,
    en: WHY_TWO_FS.en,
  },
  sectionDiffTitle: {
    nl: 'Wat HomeCheff wel en niet is',
    en: 'What HomeCheff is and is not',
  },
  sectionDiffBody: {
    nl: `IS: ${DIFFERENTIATION_IS.nl.join('; ')}.\n\nIS NIET: ${DIFFERENTIATION_IS_NOT.nl.join('; ')}.`,
    en: `IS: ${DIFFERENTIATION_IS.en.join('; ')}.\n\nIS NOT: ${DIFFERENTIATION_IS_NOT.en.join('; ')}.`,
  },
};

const arriassismePage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Arriassisme | Persoonlijke inspiratie van de oprichter',
    en: 'Arriassisme | Founder’s personal inspiration',
  },
  metaDescription: {
    nl: 'Arriassisme is de persoonlijke filosofische inspiratie van Sergio Arrias — niet het HomeCheff Manifest.',
    en: 'Arriassisme is Sergio Arrias’s personal philosophical inspiration — not the HomeCheff Manifest.',
  },
  title: {
    nl: 'Arriassisme',
    en: 'Arriassisme',
  },
  intro: {
    nl: ARRIASSISME_POSITIONING.nl,
    en: ARRIASSISME_POSITIONING.en,
  },
  sectionWhatTitle: {
    nl: 'Wat Arriassisme is',
    en: 'What Arriassisme is',
  },
  sectionWhatBody: {
    nl: 'Arriassisme is de persoonlijke filosofische inspiratie van de oprichter. Het draait om sociale cohesie, community en samen waarde creëren — groei en purpose, geen marketingclaim.',
    en: 'Arriassisme is the founder’s personal philosophical inspiration. It centres on social cohesion, community and creating value together — growth and purpose, not a marketing claim.',
  },
  sectionNotTitle: {
    nl: 'Wat Arriassisme niet is',
    en: 'What Arriassisme is not',
  },
  sectionNotBody: {
    nl: 'Arriassisme is NIET het HomeCheff Manifest, NIET de productfilosofie van het platform, en NIET een hernoeming van HomeCheff. Houd beide identiteiten gescheiden.',
    en: 'Arriassisme is NOT the HomeCheff Manifest, NOT the product philosophy of the platform, and NOT a rebrand of HomeCheff. Keep both identities separate.',
  },
  sectionLinkTitle: {
    nl: 'Relatie tot HomeCheff',
    en: 'Relation to HomeCheff',
  },
  sectionLinkBody: {
    nl: 'HomeCheff is één praktische toepassing van community-gerichte principes: digitale buurtmarkt, craftsmanship-first, local-first, privacy-first. De canonieke platformfilosofie staat in het Manifest.',
    en: 'HomeCheff is one practical application of community-centred principles: digital neighbourhood marketplace, craftsmanship-first, local-first, privacy-first. The canonical platform philosophy is in the Manifest.',
  },
  sectionSeparateTitle: {
    nl: 'Duidelijke scheiding',
    en: 'Clear separation',
  },
  sectionSeparateBody: {
    nl: '• HomeCheff = publieke platformidentiteit, Manifest, Open Knowledge.\n• Arriassisme = persoonlijke inspiratie van Sergio Arrias.\n• Entity-graph: Founder → HomeCheff → Arrias Beheer B.V.; Arriassisme inspireert de oprichter, niet als platformfilosofie.',
    en: '• HomeCheff = public platform identity, Manifest, Open Knowledge.\n• Arriassisme = personal inspiration of Sergio Arrias.\n• Entity graph: Founder → HomeCheff → Arrias Beheer B.V.; Arriassisme inspires the founder, not as platform philosophy.',
  },
};

export const FOUNDER_ORIGIN_PAGE_SOURCES: Record<string, Record<string, Bi>> = {
  founderOriginShared,
  founderSergioPage,
  homecheffOriginPage,
  whyHomecheffPage,
  arriassismePage,
};
