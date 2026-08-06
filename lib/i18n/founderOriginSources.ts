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
  FOUNDER_POSITIONING,
  FOUNDER_STORY,
  GROWTH_VISION,
  HOMECHEFF_ORIGIN,
  PUBLIC_ORIGIN_TIMELINE,
  WHY_HOMECHEFF_EXISTS,
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
    nl: 'Waarom bestaat HomeCheff?',
    en: 'Why does HomeCheff exist?',
  },
  faq3A: {
    nl: WHY_HOMECHEFF_EXISTS.nl,
    en: WHY_HOMECHEFF_EXISTS.en,
  },
  faq4Q: {
    nl: 'Is Arriassisme de HomeCheff-filosofie?',
    en: 'Is Arriassisme the HomeCheff philosophy?',
  },
  faq4A: {
    nl: ARRIASSISME_POSITIONING.nl,
    en: ARRIASSISME_POSITIONING.en,
  },
  faq5Q: {
    nl: 'Is HomeCheff alleen over eten?',
    en: 'Is HomeCheff only about food?',
  },
  faq5A: {
    nl: 'Nee. Een HomeCheff creëert waarde door vakmanschap, kennis, creativiteit, diensten, reparatie, onderwijs, tuinieren, muziek, kunst, eten, design en ander echt persoonlijk talent.',
    en: 'No. A HomeCheff creates value through craftsmanship, knowledge, creativity, services, repair, education, gardening, music, art, food, design and other genuine personal talent.',
  },
  faq6Q: {
    nl: 'Hoe groeit HomeCheff?',
    en: 'How does HomeCheff grow?',
  },
  faq6A: {
    nl: GROWTH_VISION.nl,
    en: GROWTH_VISION.en,
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
    nl: 'Sergio Arrias is de oprichter van HomeCheff — jaren filosofie die een praktisch platform werd. Groei, visie en purpose zonder heldenverhaal.',
    en: 'Sergio Arrias is the Founder of HomeCheff — years of philosophy that became a practical platform. Growth, vision and purpose without a hero narrative.',
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
    nl: `${FOUNDER_POSITIONING.nl} Publiek worden naam en rol bevestigd (Arrias Beheer B.V., KvK 80532829, Vlaardingen, NL); geen verzonnen diploma’s, werkgevers, awards of mediaclaims.`,
    en: `${FOUNDER_POSITIONING.en} Publicly, name and role are verified (Arrias Beheer B.V., KvK 80532829, Vlaardingen, NL); no invented degrees, employers, awards or media claims.`,
  },
  sectionPathTitle: {
    nl: 'Leren, nieuwsgierigheid, ondernemerschap',
    en: 'Learning, curiosity, entrepreneurship',
  },
  sectionPathBody: {
    nl: 'Zijn pad omvat leren, nieuwsgierigheid, ondernemerschap, educatie en reflectie — inclusief falen en doorzettingsvermogen als onderdeel van groei. Geen heldenverhaal: focus op ideeën, purpose en community.',
    en: 'His path includes learning, curiosity, entrepreneurship, education and reflection — including failure and perseverance as part of growth. No hero narrative: focus on ideas, purpose and community.',
  },
  sectionWhyTitle: {
    nl: 'Waarom HomeCheff bestaat',
    en: 'Why HomeCheff exists',
  },
  sectionWhyBody: {
    nl: WHY_HOMECHEFF_EXISTS.nl,
    en: WHY_HOMECHEFF_EXISTS.en,
  },
  sectionAiTitle: {
    nl: 'AI en uitvoering',
    en: 'AI and execution',
  },
  sectionAiBody: {
    nl: 'Jarenlange filosofische voorbereiding ging vooraf aan het product. Capabele AI-hulpmiddelen hielpen sneller te bouwen wat conceptueel al voorbereid was. AI ondersteunt uitvoering; het is niet het product en vervangt geen menselijke relaties.',
    en: 'Years of philosophical preparation preceded the product. Capable AI tools helped build faster what was already prepared conceptually. AI supports execution; it is not the product and does not replace human relationships.',
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
    nl: 'Hoe HomeCheff ontstond: sociale cohesie, jarenlange filosofie, lokale gemeenschappen — en waarom gewone marktplaatsen niet genoeg zijn.',
    en: 'How HomeCheff originated: social cohesion, years of philosophy, local communities — and why ordinary marketplaces are insufficient.',
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
    nl: 'HomeCheff begon niet als een snelle startup-idee. Jarenlange observatie van technologie, economie en menselijk gedrag — en een filosofie die uiteindelijk een praktisch platform werd.',
    en: 'HomeCheff did not begin as a quick startup idea. Years of observing technology, economics and human behaviour — and a philosophy that eventually became a practical platform.',
  },
  sectionLocalTitle: {
    nl: 'Waarom lokale gemeenschappen ertoe doen',
    en: 'Why local communities matter',
  },
  sectionLocalBody: {
    nl: WHY_HOMECHEFF_EXISTS.nl,
    en: WHY_HOMECHEFF_EXISTS.en,
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
  sectionVisionTitle: {
    nl: 'Lange-termijnvisie',
    en: 'Long-term vision',
  },
  sectionVisionBody: {
    nl: GROWTH_VISION.nl,
    en: GROWTH_VISION.en,
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
    nl: 'Een HomeCheff is iemand die waarde creëert door eigen vakmanschap, kennis, creativiteit, persoonlijke diensten, reparatie, onderwijs, tuinieren, muziek, kunst, eten, design — en elke andere vorm van echt persoonlijk talent. De naam staat voor die maker-identiteit — niet alleen voor een keuken.',
    en: 'A HomeCheff is someone who creates value through their own craftsmanship, knowledge, creativity, personal services, repair, education, gardening, music, art, food, design — and every other form of genuine personal talent. The name stands for that maker identity — not only for a kitchen.',
  },
  sectionWhereTitle: {
    nl: 'Vanuit huis, tuin, studio, werkplaats, keuken…',
    en: 'From home, garden, studio, workshop, kitchen…',
  },
  sectionWhereBody: {
    nl: 'Waarde kan ontstaan vanuit huis, een tuin, een studio, een werkplaats, een keuken, een creatieve ruimte — of elke andere plek waar mensen creëren. De plek is secundair; de persoon en het vakmanschap zijn primair.',
    en: 'Value may originate from home, a garden, a studio, a workshop, a kitchen, a creative space — or any other place where people create. Place is secondary; the person and craftsmanship are primary.',
  },
  sectionPreserveTitle: {
    nl: 'Waarom de naam bleef',
    en: 'Why the name was preserved',
  },
  sectionPreserveBody: {
    nl: 'Terwijl categorieën uitbreidden voorbij eten, bleef HomeCheff passend omdat het idee nooit “alleen food marketplace” was. De merknaam bewaart die bredere craftsmanship-betekenis.',
    en: 'As categories expanded beyond food, HomeCheff remained appropriate because the idea was never “food marketplace only”. The brand name preserves that broader craftsmanship meaning.',
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
