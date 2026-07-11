/**
 * Phase 13X — Constitution & Operating System i18n (NL/EN).
 */

import type { Bi } from '@/lib/i18n/seoLandingSources';
import { OPERATING_SYSTEM_LAST_REVIEWED } from '@/lib/governance/homecheff-operating-system';

const LAST_REVIEWED_NL = '11 juli 2026';
const LAST_REVIEWED_EN = '11 July 2026';

export const constitutionPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'HomeCheff Constitution | Operating System & governance',
    en: 'HomeCheff Constitution | Operating System & governance',
  },
  metaDescription: {
    nl: 'Constitutionele laag: beslissingskader, AI charter, groei, moderatie, investering en cultuur — voor founders, team, partners en AI. Geen marketing.',
    en: 'Constitutional layer: decision framework, AI charter, growth, moderation, investment and culture — for founders, team, partners and AI. Not marketing.',
  },
  title: { nl: 'HomeCheff Constitution', en: 'HomeCheff Constitution' },
  intro: {
    nl: 'Dit is het operating system van HomeCheff — hoger dan features, roadmap of software. Het beschrijft hoe elke toekomstige beslissing wordt beoordeeld. Filosofische basis: het Manifest (/manifest). Dit document voegt governance charters toe voor product, AI, groei, moderatie, investering en cultuur.',
    en: 'This is the HomeCheff operating system — above features, roadmap or software. It describes how every future decision is evaluated. Philosophical foundation: the Manifest (/manifest). This document adds governance charters for product, AI, growth, moderation, investment and culture.',
  },
  sectionConstitutionTitle: { nl: 'Constitution — permanente principes', en: 'Constitution — permanent principles' },
  sectionConstitutionBody: {
    nl: 'HomeCheff bestaat om onzichtbare menselijke waarde zichtbaar te maken in buurten — niet om aandacht of engagement te maximaliseren. We worden een digitaal dorpsplein waar mensen mensen ontdekken. We worden nooit een engagement-machine, advertentieplatform of anonieme massa-marktplaats. Mensen gaan vóór algoritmes; technologie ondersteunt mensen — vervangt ze niet.',
    en: 'HomeCheff exists to make invisible human value visible in neighbourhoods — not to maximise attention or engagement. We are becoming a digital village square where people discover people. We will never become an engagement machine, advertising platform or anonymous mass marketplace. People come before algorithms; technology supports people — it does not replace them.',
  },
  sectionProblemTitle: { nl: 'Welk probleem lossen we op?', en: 'What problem are we solving?' },
  sectionProblemBody: {
    nl: 'Veel mensen koken, kweken, maken, repareren en helpen — maar een deel blijft economisch en sociaal onzichtbaar. HomeCheff verbindt dat vakmanschap met buren, zonder mensen te veranderen of te manipuleren.',
    en: 'Many people cook, grow, make, repair and help — yet part of that remains economically and socially invisible. HomeCheff connects that craftsmanship with neighbours, without changing or manipulating people.',
  },
  sectionBecomingTitle: { nl: 'Wat voor platform worden we?', en: 'What kind of platform are we becoming?' },
  sectionBecomingBody: {
    nl: 'Een lokaal, menselijk, transparant platform voor vakmanschap, buurt-economie en eerlijke kansen — met open documentatie (/docs), bewijs (/evidence) en trust (/trust).',
    en: 'A local, human, transparent platform for craft, community economy and honest opportunity — with open documentation (/docs), evidence (/evidence) and trust (/trust).',
  },
  sectionNeverTitle: { nl: 'Wat worden we nooit?', en: 'What will we never become?' },
  sectionNeverBody: {
    nl: 'Geen bezorg-app, dropshipping-hub, social feed, aandachts-economie of platform dat engagement boven welzijn stelt. Zie /wat-we-niet-zijn en het Manifest.',
    en: 'Not a delivery app, dropshipping hub, social feed, attention economy or platform that puts engagement above wellbeing. See /wat-we-niet-zijn and the Manifest.',
  },
  sectionPeopleFirstTitle: { nl: 'Mensen vóór algoritmes', en: 'People before algorithms' },
  sectionPeopleFirstBody: {
    nl: 'Algoritmes ondersteunen ontdekking en fairness — geen verslaving. Ranking heeft diversiteitssecties; paid dominance is niet beloofd (Phase 13O). Technologie is de brug; mensen blijven de bestemming.',
    en: 'Algorithms support discovery and fairness — not addiction. Ranking includes diversity sections; paid dominance is not promised (Phase 13O). Technology is the bridge; people remain the destination.',
  },
  sectionDecisionTitle: { nl: 'Decision Framework', en: 'Decision Framework' },
  sectionDecisionBody: {
    nl: 'Elke feature moet minstens één pijler versterken: menselijke waardigheid, vakmanschap, lokale economie, buurten, transparantie, eerlijke kans, technologie met geweten. Versterkt het geen enkele pijler → bouw het niet. Dit kader geldt voor founders, developers, moderators en toekomstige partners.',
    en: 'Every feature must strengthen at least one pillar: human dignity, craftsmanship, local economy, neighbourhoods, transparency, honest opportunity, technology with a conscience. If it strengthens none → do not build it. This framework applies to founders, developers, moderators and future partners.',
  },
  sectionFeatureTitle: { nl: 'Feature Acceptance Charter', en: 'Feature Acceptance Charter' },
  sectionFeatureBody: {
    nl: 'Een idee wordt geaccepteerd alleen als het: (1) een echt probleem oplost, (2) mensen verbetert i.p.v. verslaafd maakt, (3) complexiteit verlaagt, (4) trust verhoogt, (5) past bij het Manifest, (6) past bij deze Constitution. Geen uitzonderingen zonder expliciete governance-review.',
    en: 'An idea is accepted only if it: (1) solves a real problem, (2) improves people instead of addicting them, (3) reduces complexity, (4) improves trust, (5) fits the Manifest, (6) fits this Constitution. No exceptions without explicit governance review.',
  },
  sectionFeatureRejectTitle: { nl: 'Wat we bewust afwijzen — en waarom', en: 'What we deliberately reject — and why' },
  sectionFeatureRejectBody: {
    nl: 'Geen infinite scroll voor engagement, gokmechanica, lootboxes, nep-urgentie, dark patterns, manipulatie of “engagement om engagement”. Waarom: het ondermijnt vertrouwen, verslaving en welzijn, en past niet bij “technologie met geweten”.',
    en: 'No infinite scroll for engagement, gambling mechanics, loot boxes, fake urgency, dark patterns, manipulation or “engagement for engagement”. Why: it undermines trust, addiction and wellbeing, and does not fit “technology with a conscience”.',
  },
  sectionModerationTitle: { nl: 'Moderation Philosophy', en: 'Moderation Philosophy' },
  sectionModerationBody: {
    nl: 'Moderators vragen niet alleen “breekt dit een regel?” maar “versterkt dit de community?”. Fairness, consistentie, transparantie en menselijk oordeel staan centraal. Appeal via /contact. Technologie ondersteunt moderatie (melden, suspensie) — vervangt geen menselijkheid. Operationele details: /docs/trust.',
    en: 'Moderators ask not only “does this break a rule?” but “does this strengthen the community?”. Fairness, consistency, transparency and human judgement are central. Appeal via /contact. Technology supports moderation (reporting, suspension) — it does not replace humanity. Operational details: /docs/trust.',
  },
  sectionAiCharterTitle: { nl: 'AI Charter', en: 'AI Charter' },
  sectionAiCharterBody: {
    nl: 'AI gebruiken we om: tijd te besparen, creativiteit te helpen, administratie te verlagen, toegankelijkheid te verbeteren, mensen te verbinden. AI gebruiken we niet om: gedrag te manipuleren, schermtijd te maximaliseren, aankopen af te dwingen, relaties te vervangen, psychologie uit te buiten. Technologie blijft de brug; mensen de bestemming. Details: /ai en /docs/ai.',
    en: 'We use AI to: save time, help creativity, reduce administration, improve accessibility, connect people. We do not use AI to: manipulate behaviour, maximise screen time, force purchases, replace relationships, exploit psychology. Technology remains the bridge; people the destination. Details: /ai and /docs/ai.',
  },
  sectionGrowthTitle: { nl: 'Ethical Growth Charter', en: 'Ethical Growth Charter' },
  sectionGrowthBody: {
    nl: 'We wijzen af: groei om elke prijs, vanity metrics, investeerdersdruk boven missie, spam, clickbait, kunstmatige engagement. We accepteren: gezonde groei, communities, trust, mond-tot-mond, kwaliteit, lange-termijn waarde. Groei mag integriteit nooit inhalen.',
    en: 'We reject: growth at any cost, vanity metrics, investor pressure over mission, spam, clickbait, artificial engagement. We accept: healthy growth, communities, trust, word of mouth, quality, long-term value. Growth must never outrun integrity.',
  },
  sectionInvestmentTitle: { nl: 'Investment Principles', en: 'Investment Principles' },
  sectionInvestmentBody: {
    nl: 'Voor elke investering: versterkt het de missie? Blijft het platform onafhankelijk genoeg? Beïnvloedt geld onze ethiek? Zouden we funding afwijzen die manipulatie vereist? HomeCheff wijst partnerschap af dat dark patterns of engagement-traps verplicht stelt — ook als het financieel aantrekkelijk is.',
    en: 'For every investment: does it strengthen the mission? Does the platform remain independent enough? Does money influence our ethics? Would we reject funding that requires manipulation? HomeCheff declines partnerships that mandate dark patterns or engagement traps — even when financially attractive.',
  },
  sectionGovernanceTitle: { nl: 'Open Governance', en: 'Open Governance' },
  sectionGovernanceBody: {
    nl: 'Prioriteiten: Manifest + Constitution → roadmap (/roadmap) → development → release → changelog (/changelog) → documentatie (/docs) → bewijs (/evidence). Fouten worden erkend in changelog; geen stille rollback-marketing. Gebruikersinvloed via feedback (/contact), communityrichtlijnen en open rapporten (/reports) wanneer feitelijk.',
    en: 'Priorities: Manifest + Constitution → roadmap (/roadmap) → development → release → changelog (/changelog) → documentation (/docs) → evidence (/evidence). Mistakes are acknowledged in changelog; no silent rollback marketing. User influence via feedback (/contact), community guidelines and open reports (/reports) when factual.',
  },
  sectionCultureTitle: { nl: 'Company Culture', en: 'Company Culture' },
  sectionCultureBody: {
    nl: 'Toekomstige medewerkers moeten begrijpen: waarom HomeCheff bestaat, hoe beslissingen worden genomen, hoe gebruikers/collega’s/gemeenschappen worden behandeld. Succes is niet alleen omzet — ook mensen geholpen, trust opgebouwd, vakmanschap mogelijk gemaakt, communities versterkt. Publiek communiceren we alleen meetbare uitkomsten wanneer bewijs bestaat (Phase 13O).',
    en: 'Future employees must understand: why HomeCheff exists, how decisions are made, how users/colleagues/communities are treated. Success is not revenue alone — also people helped, trust built, craftsmanship enabled, communities strengthened. We communicate measurable outcomes publicly only when evidence exists (Phase 13O).',
  },
  sectionFuture25Title: { nl: 'HomeCheff in 25 jaar — richting, geen belofte', en: 'HomeCheff in 25 years — direction, not promise' },
  sectionFuture25Body: {
    nl: 'Aspirationeel: technologie wordt stiller; mensen zichtbaarder; lokale economieën sterker; vakmanschap waardevoller; AI een assistent; communities gezonder. Dit zijn geen voorspellingen of meetbare claims — alleen richting. Het platform moet herkenbaar blijven als elke regel code vervangen is.',
    en: 'Aspirational: technology becomes quieter; people more visible; local economies stronger; craftsmanship more valuable; AI an assistant; communities healthier. These are not predictions or measurable claims — direction only. The platform must remain recognisable even if every line of code is replaced.',
  },
  linkManifest: { nl: 'Manifest', en: 'Manifest' },
  linkPrinciples: { nl: 'Open principes', en: 'Open principles' },
  linkTrust: { nl: 'Trust', en: 'Trust' },
  linkDocs: { nl: 'Documentatie', en: 'Documentation' },
  linkEvidence: { nl: 'Bewijs', en: 'Evidence' },
  linkRoadmap: { nl: 'Roadmap', en: 'Roadmap' },
  linkHowGrows: { nl: 'Hoe HomeCheff groeit', en: 'How HomeCheff grows' },
  linkAi: { nl: 'AI', en: 'AI' },
  faqBlockTitle: { nl: 'Veelgestelde vragen', en: 'Frequently asked questions' },
  faq1Q: { nl: 'Verschil Manifest vs Constitution?', en: 'Manifest vs Constitution?' },
  faq1A: {
    nl: 'Manifest = filosofie en missie. Constitution = operating system met beslissings- en governance charters.',
    en: 'Manifest = philosophy and mission. Constitution = operating system with decision and governance charters.',
  },
  faq2Q: { nl: 'Is dit juridisch bindend?', en: 'Is this legally binding?' },
  faq2A: {
    nl: 'Dit is het publieke governance-kader voor product en cultuur. Juridische voorwaarden staan op /terms.',
    en: 'This is the public governance framework for product and culture. Legal terms are at /terms.',
  },
  faq3Q: { nl: 'Hoe valideren jullie dit?', en: 'How do you validate this?' },
  faq3A: {
    nl: 'Scripts controleren SSOT, integratie en Phase 13O truth boundaries. Zie /how-homecheff-grows.',
    en: 'Scripts check SSOT, integration and Phase 13O truth boundaries. See /how-homecheff-grows.',
  },
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const OPERATING_SYSTEM_PAGE_SOURCES: Record<string, Record<string, Bi>> = {
  constitutionPage,
};

export { OPERATING_SYSTEM_LAST_REVIEWED };
