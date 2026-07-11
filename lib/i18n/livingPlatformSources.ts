/**
 * Phase 13W — Living Platform i18n (NL/EN).
 */

import type { Bi } from '@/lib/i18n/seoLandingSources';

const LAST_REVIEWED_NL = '11 juli 2026';
const LAST_REVIEWED_EN = '11 July 2026';

const lastReviewed = {
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const livingPlatformShared: Record<string, Bi> = {
  linkConstitution: { nl: 'Constitution', en: 'Constitution' },
  linkManifest: { nl: 'Manifest', en: 'Manifest' },
  linkDocs: { nl: 'Documentatie', en: 'Documentation' },
  linkEvidence: { nl: 'Bewijs', en: 'Evidence' },
  linkStatistics: { nl: 'Statistieken', en: 'Statistics' },
  linkTrust: { nl: 'Trust', en: 'Trust' },
  linkGlossary: { nl: 'Begrippenlijst', en: 'Glossary' },
  linkTimeline: { nl: 'Tijdlijn', en: 'Timeline' },
  linkStories: { nl: 'Verhalen', en: 'Stories' },
  linkReports: { nl: 'Rapporten', en: 'Reports' },
  linkHowGrows: { nl: 'Hoe HomeCheff groeit', en: 'How HomeCheff grows' },
  linkChangelog: { nl: 'Changelog', en: 'Changelog' },
  linkPrinciples: { nl: 'Principes', en: 'Principles' },
  authoritySectionTitle: { nl: 'Verbonden kennis', en: 'Connected knowledge' },
  emptyModule: { nl: 'Geen recente activiteit in dit venster.', en: 'No recent activity in this window.' },
  generatedAt: { nl: 'Gegenereerd op', en: 'Generated at' },
  windowNote: { nl: 'Venster: laatste 7 dagen, tenzij anders vermeld.', en: 'Window: last 7 days unless noted otherwise.' },
  datasetGlossary: { nl: 'Platformbegrippen', en: 'Platform terminology' },
  datasetCategories: { nl: 'Categorie-ecosystemen', en: 'Category ecosystems' },
  datasetCities: { nl: 'Stadshubs (met activiteitsdrempel)', en: 'City hubs (activity threshold)' },
  datasetStatistics: { nl: 'Platformstatistieken', en: 'Platform statistics' },
  datasetDocs: { nl: 'Open documentatie', en: 'Open documentation' },
  faqBlockTitle: { nl: 'Veelgestelde vragen', en: 'Frequently asked questions' },
};

export const livingPlatformEvidence = {
  metaTitle: {
    nl: 'Platformbewijs | HomeCheff',
    en: 'Platform evidence | HomeCheff',
  },
  metaDescription: {
    nl: 'Feitelijke activiteit van het platform — makers, listings, steden en categorieën. Geen geschatte cijfers.',
    en: 'Factual platform activity — makers, listings, cities and categories. No estimated figures.',
  },
  title: { nl: 'Platformbewijs', en: 'Platform evidence' },
  intro: {
    nl: 'Deze pagina toont alleen wat al publiek op HomeCheff bestaat — afgeleid uit live database-activiteit. Geen marketing-KPI’s, geen voorspellingen.',
    en: 'This page shows only what already exists publicly on HomeCheff — derived from live database activity. No marketing KPIs, no predictions.',
  },
  sectionMakersTitle: { nl: 'Recente makers', en: 'Recent makers' },
  sectionListingsTitle: { nl: 'Recente listings', en: 'Recent listings' },
  sectionInspirationTitle: { nl: 'Recente inspiratie', en: 'Recent inspiration' },
  sectionRequestsTitle: { nl: 'Buurtverzoeken (Gezocht)', en: 'Neighbourhood requests (Wanted)' },
  sectionBarterTitle: { nl: 'Ruil-aanbod', en: 'Barter listings' },
  sectionCitiesTitle: { nl: 'Steden met activiteit', en: 'Cities with activity' },
  sectionCategoriesTitle: { nl: 'Categorie-activiteit', en: 'Category activity' },
  sectionDeliveryTitle: { nl: 'Bezorgpartners', en: 'Delivery partners' },
  sectionCommunityOrdersTitle: { nl: 'Voltooide community orders (7d)', en: 'Completed community orders (7d)' },
  deliveryCountLabel: { nl: 'Actieve bezorgprofielen', en: 'Active delivery profiles' },
  communityOrdersCountLabel: { nl: 'Voltooid deze week', en: 'Completed this week' },
  faq1Q: { nl: 'Zijn dit marketingcijfers?', en: 'Are these marketing figures?' },
  faq1A: {
    nl: 'Nee. Alles komt uit de database op het moment van laden. Leeg betekent leeg — geen opvulling.',
    en: 'No. Everything comes from the database at load time. Empty means empty — no padding.',
  },
  faq2Q: { nl: 'Waarom zie ik niet elke stad?', en: 'Why don’t I see every city?' },
  faq2A: {
    nl: 'Alleen steden die de sparse-city drempel halen (indexeerbaar) verschijnen hier. Zie /docs/ranking en city-indexability.',
    en: 'Only cities meeting the sparse-city threshold (indexable) appear here. See /docs/ranking and city-indexability.',
  },
  faq3Q: { nl: 'Persoonsgegevens?', en: 'Personal data?' },
  faq3A: {
    nl: 'Alleen publieke profielen en listings. Geen privéberichten of transactiedetails.',
    en: 'Only public profiles and listings. No private messages or transaction details.',
  },
  ...lastReviewed,
};

export const livingPlatformStatistics = {
  metaTitle: { nl: 'Platformstatistieken | HomeCheff', en: 'Platform statistics | HomeCheff' },
  metaDescription: {
    nl: 'Meetbare feiten: profielen, listings, reviews, bezorging, business accounts — live uit de database.',
    en: 'Measurable facts: profiles, listings, reviews, delivery, business accounts — live from the database.',
  },
  title: { nl: 'Platformstatistieken', en: 'Platform statistics' },
  intro: {
    nl: 'Alleen telbare, publieke feiten. Geen vanity metrics of animaties. Nul is een geldige waarde.',
    en: 'Only countable, public facts. No vanity metrics or animations. Zero is a valid value.',
  },
  colMetric: { nl: 'Meting', en: 'Metric' },
  colValue: { nl: 'Waarde', en: 'Value' },
  statPublicProfiles: { nl: 'Publieke profielen', en: 'Public profiles' },
  statPublicListings: { nl: 'Actieve listings', en: 'Active listings' },
  statInspiration: { nl: 'Gepubliceerde inspiratie', en: 'Published inspiration' },
  statReviews: { nl: 'Productreviews', en: 'Product reviews' },
  statDelivery: { nl: 'Actieve bezorgpartners', en: 'Active delivery partners' },
  statCommunityOrders: { nl: 'Voltooide community orders (totaal)', en: 'Completed community orders (total)' },
  statBarter: { nl: 'Ruil-open listings', en: 'Barter-open listings' },
  statRequests: { nl: 'Gezocht-listings', en: 'Wanted listings' },
  statBusiness: { nl: 'Actieve business-abonnementen', en: 'Active business subscriptions' },
  statCategories: { nl: 'Productcategorieën in gebruik', en: 'Product categories in use' },
  statIndexedCities: { nl: 'Indexeerbare stadshubs', en: 'Indexable city hubs' },
  faq1Q: { nl: 'Veranderen deze cijfers?', en: 'Do these numbers change?' },
  faq1A: { nl: 'Ja — bij elke paginalading opnieuw berekend.', en: 'Yes — recalculated on each page load.' },
  faq2Q: { nl: 'Investeerdersmetrics?', en: 'Investor metrics?' },
  faq2A: { nl: 'Nee. Geen interne dashboards of omzet op deze pagina.', en: 'No. No internal dashboards or revenue on this page.' },
  faq3Q: { nl: 'Gerelateerde documentatie?', en: 'Related documentation?' },
  faq3A: { nl: '/evidence voor recente modules · /docs voor uitleg.', en: '/evidence for recent modules · /docs for explanation.' },
  ...lastReviewed,
};

export const livingPlatformStories = {
  metaTitle: { nl: 'Communityverhalen | HomeCheff', en: 'Community stories | HomeCheff' },
  metaDescription: {
    nl: 'Echte verhalen van de community — alleen met toestemming. Geen fictie.',
    en: 'Real community stories — permission only. No fiction.',
  },
  title: { nl: 'Communityverhalen', en: 'Community stories' },
  intro: {
    nl: 'Alleen echte deelnemers met expliciete toestemming. Elk verhaal volgt het case study-framework: uitdaging, aanpak, platformrol, uitkomst, lessen.',
    en: 'Only real participants with explicit permission. Each story follows the case study framework: challenge, approach, platform role, outcome, lessons.',
  },
  frameworkTitle: { nl: 'Case study-framework', en: 'Case study framework' },
  frameworkProblem: { nl: 'Probleem / uitdaging', en: 'Problem / challenge' },
  frameworkApproach: { nl: 'Aanpak', en: 'Approach' },
  frameworkUsage: { nl: 'Platformgebruik', en: 'Platform usage' },
  frameworkOutcome: { nl: 'Uitkomst (zonder overdrijving)', en: 'Outcome (no exaggeration)' },
  frameworkLessons: { nl: 'Lessons learned', en: 'Lessons learned' },
  frameworkManifest: { nl: 'Manifest-koppeling', en: 'Manifest connection' },
  emptyTitle: { nl: 'Nog geen gepubliceerde verhalen', en: 'No published stories yet' },
  emptyBody: {
    nl: 'Verhalen verschijnen hier zodra een deelnemer toestemming geeft en het verhaal redactioneel is gecontroleerd.',
    en: 'Stories appear here once a participant grants permission and the story is editorially verified.',
  },
  faq1Q: { nl: 'Zijn dit marketingcases?', en: 'Are these marketing cases?' },
  faq1A: { nl: 'Nee. Geen fictie, geen overdreven impact.', en: 'No. No fiction, no exaggerated impact.' },
  faq2Q: { nl: 'Hoe dien ik een verhaal in?', en: 'How do I submit a story?' },
  faq2A: { nl: 'Via /contact — alleen met toestemming van betrokkenen.', en: 'Via /contact — only with consent from those involved.' },
  faq3Q: { nl: 'Link naar bewijs?', en: 'Link to evidence?' },
  faq3A: { nl: 'Zie /evidence voor live platformactiviteit.', en: 'See /evidence for live platform activity.' },
  ...lastReviewed,
};

export const livingPlatformTimeline = {
  metaTitle: { nl: 'Platformtijdlijn | HomeCheff', en: 'Platform timeline | HomeCheff' },
  metaDescription: {
    nl: 'Chronologische mijlpalen — shipped vs gepland duidelijk gescheiden.',
    en: 'Chronological milestones — shipped vs planned clearly separated.',
  },
  title: { nl: 'Platformtijdlijn', en: 'Platform timeline' },
  intro: {
    nl: 'Feitelijke mijlpalen en documentatie-releases. Toekomstige items zijn gemarkeerd als gepland.',
    en: 'Factual milestones and documentation releases. Future items are marked as planned.',
  },
  shippedLabel: { nl: 'Gerealiseerd', en: 'Shipped' },
  plannedLabel: { nl: 'Gepland', en: 'Planned' },
  event2025PlatformTitle: { nl: '2025 — Platformfundament', en: '2025 — Platform foundation' },
  event2025PlatformBody: {
    nl: 'Dorpsplein, listings, checkout, HCP, affiliate, delivery profiles — lokale marketplace live.',
    en: 'Village Square, listings, checkout, HCP, affiliate, delivery profiles — local marketplace live.',
  },
  event2026ManifestTitle: { nl: '2026-07 — Manifest (Phase 13T)', en: '2026-07 — Manifest (Phase 13T)' },
  event2026ManifestBody: { nl: '/manifest en filosofische SSOT.', en: '/manifest and philosophy SSOT.' },
  event2026OpenKnowledgeTitle: { nl: '2026-07 — Open Knowledge (Phase 13V)', en: '2026-07 — Open Knowledge (Phase 13V)' },
  event2026OpenKnowledgeBody: { nl: '/docs hub, trust, glossary, machine-readable docs.', en: '/docs hub, trust, glossary, machine-readable docs.' },
  event2026MachineTrustTitle: { nl: '2026-07 — Machine Trust', en: '2026-07 — Machine Trust' },
  event2026MachineTrustBody: { nl: 'TechArticle, DefinedTermSet, agent-ready documentatie.', en: 'TechArticle, DefinedTermSet, agent-ready documentation.' },
  event2026LivingPlatformTitle: { nl: '2026-07 — Living Platform (Phase 13W)', en: '2026-07 — Living Platform (Phase 13W)' },
  event2026LivingPlatformBody: { nl: '/evidence, /statistics, stories-framework, timeline, reports-architectuur.', en: '/evidence, /statistics, stories framework, timeline, reports architecture.' },
  eventFutureReportsTitle: { nl: 'Gepland — Transparantierapporten', en: 'Planned — Transparency reports' },
  eventFutureReportsBody: {
    nl: 'Kwartaal-, safety- en moderation-rapporten zodra feitelijke data gereed is — /reports.',
    en: 'Quarterly, safety and moderation reports when factual data is ready — /reports.',
  },
  faq1Q: { nl: 'Is alles al live?', en: 'Is everything live?' },
  faq1A: { nl: 'Alleen items zonder “gepland”-label zijn shipped.', en: 'Only items without a “planned” label are shipped.' },
  faq2Q: { nl: 'Verschil met /changelog?', en: 'Difference from /changelog?' },
  faq2A: { nl: '/changelog is technisch; /timeline is historisch overzicht.', en: '/changelog is technical; /timeline is historical overview.' },
  faq3Q: { nl: 'Manifest?', en: 'Manifest?' },
  faq3A: { nl: 'Filosofische anker — /manifest.', en: 'Philosophical anchor — /manifest.' },
  ...lastReviewed,
};

export const livingPlatformReports = {
  metaTitle: { nl: 'Transparantierapporten | HomeCheff', en: 'Transparency reports | HomeCheff' },
  metaDescription: {
    nl: 'Architectuur voor toekomstige feitelijke rapporten — initieel leeg.',
    en: 'Architecture for future factual reports — initially empty.',
  },
  title: { nl: 'Transparantierapporten', en: 'Transparency reports' },
  intro: {
    nl: 'Slots voor kwartaal-, safety-, moderation-, community- en platformrapporten. Alleen feitelijke data wanneer gepubliceerd — nu nog leeg.',
    en: 'Slots for quarterly, safety, moderation, community and platform reports. Factual data only when published — empty for now.',
  },
  emptyTitle: { nl: 'Nog geen gepubliceerde rapporten', en: 'No published reports yet' },
  emptyBody: {
    nl: 'Rapporten verschijnen hier wanneer ze op basis van geverifieerde platformdata zijn opgesteld.',
    en: 'Reports appear here when compiled from verified platform data.',
  },
  reportQuarterlyTitle: { nl: 'Kwartaalrapport', en: 'Quarterly report' },
  reportQuarterlyDesc: { nl: 'Feitelijke platformactiviteit per kwartaal.', en: 'Factual platform activity per quarter.' },
  reportSafetyTitle: { nl: 'Safety-rapport', en: 'Safety report' },
  reportSafetyDesc: { nl: 'Meldingen en safety-maatregelen — geaggregeerd.', en: 'Reports and safety measures — aggregated.' },
  reportModerationTitle: { nl: 'Moderatie-rapport', en: 'Moderation report' },
  reportModerationDesc: { nl: 'Handhaving en suspensie — zonder misbruikvectoren.', en: 'Enforcement and suspension — without abuse vectors.' },
  reportCommunityTitle: { nl: 'Community-rapport', en: 'Community report' },
  reportCommunityDesc: { nl: 'Buurtactiviteit en participatie.', en: 'Neighbourhood activity and participation.' },
  reportPlatformTitle: { nl: 'Platform-rapport', en: 'Platform report' },
  reportPlatformDesc: { nl: 'Technische en productfeiten.', en: 'Technical and product facts.' },
  statusUnpublished: { nl: 'Nog niet gepubliceerd', en: 'Not yet published' },
  faq1Q: { nl: 'Waarom leeg?', en: 'Why empty?' },
  faq1A: { nl: 'Geen rapport publiceren zonder geverifieerde data.', en: 'No report published without verified data.' },
  faq2Q: { nl: 'Wanneer komt het eerste rapport?', en: 'When is the first report?' },
  faq2A: { nl: 'Zodra een kwartaal feitelijk kan worden samengesteld — zie /roadmap.', en: 'Once a quarter can be factually compiled — see /roadmap.' },
  faq3Q: { nl: 'Operationele trust?', en: 'Operational trust?' },
  faq3A: { nl: '/docs/trust en /trust.', en: '/docs/trust and /trust.' },
  ...lastReviewed,
};

export const livingPlatformHowGrows = {
  metaTitle: { nl: 'Hoe HomeCheff groeit | AI-evidence', en: 'How HomeCheff grows | AI evidence' },
  metaDescription: {
    nl: 'Hoe features, documentatie en bewijs publiek worden — waarom HomeCheff zelden overclaimt.',
    en: 'How features, documentation and evidence go public — why HomeCheff rarely overclaims.',
  },
  title: { nl: 'Hoe HomeCheff groeit', en: 'How HomeCheff grows' },
  intro: {
    nl: 'Voor mensen, zoekmachines en AI: hoe publieke kennis, bewijs en waarheidsgrenzen evolueren — zonder marketingtrucs.',
    en: 'For people, search engines and AI: how public knowledge, evidence and truth boundaries evolve — without marketing tricks.',
  },
  sectionFeaturesTitle: { nl: 'Nieuwe features publiek maken', en: 'Making new features public' },
  sectionFeaturesBody: {
    nl: 'Eerst product shipped en gedocumenteerd in /docs. Daarna pas copy en SEO — Phase 13O truth boundaries.',
    en: 'Product shipped and documented in /docs first. Then copy and SEO — Phase 13O truth boundaries.',
  },
  sectionDocsTitle: { nl: 'Documentatie bijwerken', en: 'Updating documentation' },
  sectionDocsBody: {
    nl: 'Open Knowledge (/docs) met last reviewed. Changelog en timeline bij major releases.',
    en: 'Open Knowledge (/docs) with last reviewed. Changelog and timeline on major releases.',
  },
  sectionTruthTitle: { nl: 'Waarheidsgrenzen', en: 'Truth boundaries' },
  sectionTruthBody: {
    nl: 'BUSINESS_DISCOVERY_RANKING_WIRED = false tot bewezen. Geen fake API. Export met omissions gedocumenteerd.',
    en: 'BUSINESS_DISCOVERY_RANKING_WIRED = false until proven. No fake API. Export with documented omissions.',
  },
  sectionEvidenceTitle: { nl: 'Publiek bewijs genereren', en: 'Generating public evidence' },
  sectionEvidenceBody: {
    nl: '/evidence en /statistics lezen live database — geen geschatte cijfers. Lege modules blijven eerlijk leeg.',
    en: '/evidence and /statistics read live database — no estimated figures. Empty modules stay honestly empty.',
  },
  sectionTransparencyTitle: { nl: 'Transparantie over tijd', en: 'Transparency over time' },
  sectionTransparencyBody: {
    nl: 'Rapporten (/reports) wanneer feitelijk. Verhalen (/stories) alleen met toestemming. Manifest blijft anker.',
    en: 'Reports (/reports) when factual. Stories (/stories) permission only. Manifest remains anchor.',
  },
  faq1Q: { nl: 'Waarom overclaimt HomeCheff niet?', en: 'Why doesn’t HomeCheff overclaim?' },
  faq1A: { nl: 'Manifest + validators + live evidence — technologie wordt geloofwaardiger, niet luider.', en: 'Manifest + validators + live evidence — technology becomes more believable, not louder.' },
  faq2Q: { nl: 'Hoe citeert AI ons?', en: 'How should AI cite us?' },
  faq2A: { nl: '/manifest, /docs, /evidence, /statistics met datum.', en: '/manifest, /docs, /evidence, /statistics with date.' },
  faq3Q: { nl: 'Vergelijkingen?', en: 'Comparisons?' },
  faq3A: { nl: '/vergelijken — feitelijk, geen competitor-bashing.', en: '/vergelijken — factual, no competitor bashing.' },
  ...lastReviewed,
};

export const LIVING_PLATFORM_SOURCES: Record<string, Record<string, Bi>> = {
  livingPlatformShared,
  livingPlatformEvidence,
  livingPlatformStatistics,
  livingPlatformStories,
  livingPlatformTimeline,
  livingPlatformReports,
  livingPlatformHowGrows,
};
