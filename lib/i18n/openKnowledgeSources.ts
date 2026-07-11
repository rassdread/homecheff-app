/**
 * Phase 13V — Open Knowledge public documentation i18n (NL/EN).
 */

import type { Bi } from '@/lib/i18n/seoLandingSources';
import { OPEN_KNOWLEDGE_LAST_REVIEWED } from '@/lib/open-knowledge/docs-registry';

const LAST_REVIEWED_NL = '11 juli 2026';
const LAST_REVIEWED_EN = '11 July 2026';

type DocInput = {
  metaTitle: Bi;
  metaDescription: Bi;
  title: Bi;
  intro: Bi;
  purpose: Bi;
  how: Bi;
  limits: Bi;
  impact: Bi;
  truth: Bi;
  faq1: { q: Bi; a: Bi };
  faq2: { q: Bi; a: Bi };
  faq3: { q: Bi; a: Bi };
};

function docPage(input: DocInput): Record<string, Bi> {
  return {
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    title: input.title,
    intro: input.intro,
    sectionPurposeTitle: { nl: 'Waarom dit bestaat', en: 'Why this exists' },
    sectionPurposeBody: input.purpose,
    sectionHowTitle: { nl: 'Hoe het werkt', en: 'How it works' },
    sectionHowBody: input.how,
    sectionLimitsTitle: { nl: 'Beperkingen', en: 'Limitations' },
    sectionLimitsBody: input.limits,
    sectionImpactTitle: { nl: 'Impact op gebruikers', en: 'User impact' },
    sectionImpactBody: input.impact,
    sectionTruthTitle: { nl: 'Waarheidsgrenzen', en: 'Truth boundaries' },
    sectionTruthBody: input.truth,
    faqBlockTitle: { nl: 'Veelgestelde vragen', en: 'Frequently asked questions' },
    faq1Q: input.faq1.q,
    faq1A: input.faq1.a,
    faq2Q: input.faq2.q,
    faq2A: input.faq2.a,
    faq3Q: input.faq3.q,
    faq3A: input.faq3.a,
    lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
    lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
  };
}

export const openKnowledgeShared: Record<string, Bi> = {
  linkDocsHub: { nl: 'Documentatie-overzicht', en: 'Documentation hub' },
  linkManifest: { nl: 'HomeCheff Manifest', en: 'HomeCheff Manifest' },
  linkConstitution: { nl: 'Constitution', en: 'Constitution' },
  linkTrust: { nl: 'Trust & transparantie', en: 'Trust & transparency' },
  linkGlossary: { nl: 'Begrippenlijst', en: 'Glossary' },
  linkDocRanking: { nl: 'Ranking-documentatie', en: 'Ranking documentation' },
  linkDocBusinessDna: { nl: 'Business DNA', en: 'Business DNA' },
  linkTrustPhilosophy: { nl: 'Trust-filosofie', en: 'Trust philosophy' },
  linkPrivacyPolicy: { nl: 'Privacyverklaring', en: 'Privacy policy' },
  linkAiPublic: { nl: 'Publieke AI-pagina', en: 'Public AI page' },
  linkChangelog: { nl: 'Changelog', en: 'Changelog' },
  linkRoadmap: { nl: 'Roadmap', en: 'Roadmap' },
  linkPrinciples: { nl: 'Principes', en: 'Principles' },
  linkAi: { nl: 'AI op HomeCheff', en: 'AI on HomeCheff' },
  linkEvidence: { nl: 'Platformbewijs', en: 'Platform evidence' },
  linkStatistics: { nl: 'Statistieken', en: 'Statistics' },
  linkStories: { nl: 'Verhalen', en: 'Stories' },
  linkTimeline: { nl: 'Tijdlijn', en: 'Timeline' },
  linkReports: { nl: 'Rapporten', en: 'Reports' },
  linkHowGrows: { nl: 'Hoe HomeCheff groeit', en: 'How HomeCheff grows' },
};

export const openKnowledgeHub = {
  metaTitle: {
    nl: 'HomeCheff documentatie | Open kennis voor mensen en AI',
    en: 'HomeCheff documentation | Open knowledge for people and AI',
  },
  metaDescription: {
    nl: 'Open documentatie over ranking, Business DNA, HCP, affiliate, marketplace, trust, privacy en AI — verifieerbaar en afgestemd op het Manifest.',
    en: 'Open documentation on ranking, Business DNA, HCP, affiliate, marketplace, trust, privacy and AI — verifiable and aligned with the Manifest.',
  },
  title: { nl: 'Open kennis', en: 'Open knowledge' },
  intro: {
    nl: 'Deze documentatie legt uit hoe HomeCheff werkt — voor gebruikers, partners, onderzoekers en AI-systemen. Geen marketing: alleen traceerbare uitleg met beperkingen en waarheidsgrenzen (Phase 13O).',
    en: 'This documentation explains how HomeCheff works — for users, partners, researchers and AI systems. Not marketing: only traceable explanation with limitations and truth boundaries (Phase 13O).',
  },
  sectionIndexTitle: { nl: 'Onderwerpen', en: 'Topics' },
  sectionIndexBody: {
    nl: 'Kies een onderwerp. Elke pagina beantwoordt: waarom bestaat dit, hoe werkt het, wat doet het niet, en welke beperkingen gelden.',
    en: 'Choose a topic. Each page answers: why it exists, how it works, what it does not do, and which limits apply.',
  },
  linkRanking: { nl: 'Ranking & feed', en: 'Ranking & feed' },
  linkBusinessDna: { nl: 'Business DNA', en: 'Business DNA' },
  linkHcp: { nl: 'HCP', en: 'HCP' },
  linkAffiliate: { nl: 'Affiliate', en: 'Affiliate' },
  linkCommunityOrders: { nl: 'Community orders', en: 'Community orders' },
  linkBarter: { nl: 'Ruil & barter', en: 'Barter' },
  linkDelivery: { nl: 'Bezorging', en: 'Delivery' },
  linkMarketplace: { nl: 'Marketplace', en: 'Marketplace' },
  linkTrustDoc: { nl: 'Trust (operations)', en: 'Trust (operations)' },
  linkPrivacyDoc: { nl: 'Privacy (product)', en: 'Privacy (product)' },
  linkAiDoc: { nl: 'AI (technisch)', en: 'AI (technical)' },
  linkApiDoc: { nl: 'API & agents', en: 'API & agents' },
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const openKnowledgeDocRanking = docPage({
  metaTitle: {
    nl: 'Ranking & feed | HomeCheff documentatie',
    en: 'Ranking & feed | HomeCheff documentation',
  },
  metaDescription: {
    nl: 'Hoe de HomeCheff geo-feed secties rankt, wat Business DNA wel en niet doet in ranking, en fairness voor individuele makers.',
    en: 'How the HomeCheff geo feed ranks sections, what Business DNA does and does not do in ranking, and fairness for individual makers.',
  },
  title: { nl: 'Ranking & feed', en: 'Ranking & feed' },
  intro: {
    nl: 'De geo-feed (Dorpsplein) toont lokale aanbod in secties zoals nearby, trusted maker en diversiteit. Ranking ondersteunt ontdekking — geen engagement-maximalisatie.',
    en: 'The geo feed (Village Square) shows local offers in sections such as nearby, trusted maker and diversity. Ranking supports discovery — not engagement maximisation.',
  },
  purpose: {
    nl: 'Ranking helpt buren relevante makers en aanbod te vinden op afstand, vertrouwen en diversiteit — zonder anonieme massa-catalogus.',
    en: 'Ranking helps neighbours find relevant makers and offers by distance, trust and diversity — without an anonymous mass catalogue.',
  },
  how: {
    nl: 'De feed bouwt secties met vaste ranking-profielen (bijv. nearby, trusted_maker). Dedup-regels voorkomen dat één seller of listing meerdere secties domineert. Business DNA beschrijft abonnementsvoordelen; paid feed-boost is niet live in ranking (BUSINESS_DISCOVERY_RANKING_WIRED = false).',
    en: 'The feed builds sections with fixed ranking profiles (e.g. nearby, trusted_maker). Dedup rules prevent one seller or listing from dominating multiple sections. Business DNA describes subscription benefits; paid feed boost is not live in ranking (BUSINESS_DISCOVERY_RANKING_WIRED = false).',
  },
  limits: {
    nl: 'Ranking is niet personaliseerd op engagement-traps. Geen belofte dat betalen zichtbaarheid in de feed garandeert. Lege regio’s tonen minder — geen spam-steden.',
    en: 'Ranking is not personalised for engagement traps. No promise that paying guarantees feed visibility. Sparse regions show less — no spam cities.',
  },
  impact: {
    nl: 'Kopers zien gevarieerd lokaal aanbod. Nieuwe en onbetaalde makers blijven discoverable via diversiteitssecties. Zakelijke abonnementen verlagen vooral fees en tonen badges — geen stille ranking-overmacht.',
    en: 'Buyers see varied local offers. New and unpaid makers remain discoverable via diversity sections. Business subscriptions mainly lower fees and show badges — no silent ranking dominance.',
  },
  truth: {
    nl: 'Publieke copy over feed-zichtbaarheidsboosts of beloftes over gegarandeerde zichtbaarheid is verwijderd of afgezwakt (Phase 13T). Documentatie volgt live code, niet marketing.',
    en: 'Public copy about feed visibility boosts or promises of guaranteed visibility was removed or softened (Phase 13T). Documentation follows live code, not marketing.',
  },
  faq1: {
    q: { nl: 'Krijgen betaalde abonnementen hogere feed-ranking?', en: 'Do paid plans get higher feed ranking?' },
    a: {
      nl: 'Niet gegarandeerd en momenteel niet live als feed-boost. Fees en badges wel; ranking-boost alleen als end-to-end bewezen en capped.',
      en: 'Not guaranteed and not currently live as feed boost. Fees and badges yes; ranking boost only if proven end-to-end and capped.',
    },
  },
  faq2: {
    q: { nl: 'Welke secties bestaan er?', en: 'Which sections exist?' },
    a: {
      nl: 'O.a. nearby, trusted maker, new creators en diversiteit — afhankelijk van regio en activiteit. Zie /hoe-homecheff-werkt.',
      en: 'Including nearby, trusted maker, new creators and diversity — depending on region and activity. See /hoe-homecheff-werkt.',
    },
  },
  faq3: {
    q: { nl: 'Is dit hetzelfde als social media ranking?', en: 'Is this the same as social media ranking?' },
    a: {
      nl: 'Nee. Doel is lokaal vakmanschap ontdekken, niet maximale scrolltijd.',
      en: 'No. The goal is discovering local craft, not maximising scroll time.',
    },
  },
});

export const openKnowledgeDocBusinessDna = docPage({
  metaTitle: {
    nl: 'Business DNA | HomeCheff documentatie',
    en: 'Business DNA | HomeCheff documentation',
  },
  metaDescription: {
    nl: 'Zakelijke abonnementen: fees, badges, profiel — en wat niet live is in feed-ranking.',
    en: 'Business subscriptions: fees, badges, profile — and what is not live in feed ranking.',
  },
  title: { nl: 'Business DNA', en: 'Business DNA' },
  intro: {
    nl: 'Business DNA is de SSOT voor zakelijke abonnementen (individual, basic, pro, premium): commission, badges, analytics-labels en profielvoordelen.',
    en: 'Business DNA is the SSOT for business subscriptions (individual, basic, pro, premium): commission, badges, analytics labels and profile benefits.',
  },
  purpose: {
    nl: 'Transparante abonnementsvergelijking voor KVK/bedrijven — lagere platformfee waar van toepassing, verified badge, profielversterking.',
    en: 'Transparent subscription comparison for registered businesses — lower platform fee where applicable, verified badge, profile strength.',
  },
  how: {
    nl: 'getBusinessVisibilityProfile() leest planconfig. UI op /sell en dashboards deriveert daarvan. Live checkout en fees gebruiken deze SSOT.',
    en: 'getBusinessVisibilityProfile() reads plan config. UI on /sell and dashboards derives from it. Live checkout and fees use this SSOT.',
  },
  limits: {
    nl: 'rankingBoost in config is niet wired naar live feed (Phase 13T). Geen aparte analytics-module tenzij product dat levert. Website/social promotion vaak “ready/future”.',
    en: 'rankingBoost in config is not wired to live feed (Phase 13T). No separate analytics module unless the product delivers it. Website/social promotion often “ready/future”.',
  },
  impact: {
    nl: 'Zakelijke verkopers zien lagere fees en badges. Kopers zien verified/business signalen op profiel en tiles — geen belofte van feed-dominantie.',
    en: 'Business sellers see lower fees and badges. Buyers see verified/business signals on profile and tiles — no promise of feed dominance.',
  },
  truth: {
    nl: 'Vergelijkings- en DNA-copy vermeldt expliciet: geen gegarandeerd feed-ranking vooruitdeel.',
    en: 'Comparison and DNA copy explicitly states: no guaranteed feed ranking advantage.',
  },
  faq1: {
    q: { nl: 'Verhoogt Premium mijn feed-positie?', en: 'Does Premium raise my feed position?' },
    a: { nl: 'Niet live als ranking-boost. Wel lagere fee en badge-voordelen.', en: 'Not live as ranking boost. Lower fee and badge benefits yes.' },
  },
  faq2: {
    q: { nl: 'Waar staat de SSOT?', en: 'Where is the SSOT?' },
    a: { nl: 'lib/business/visibility-profile.ts — alle plan checks moeten daar vandaan komen.', en: 'lib/business/visibility-profile.ts — all plan checks must come from there.' },
  },
  faq3: {
    q: { nl: 'Is dit verplicht om te verkopen?', en: 'Is this required to sell?' },
    a: { nl: 'Nee. Particulieren verkopen gratis; abonnement is upgrade voor bedrijven.', en: 'No. Individuals sell for free; subscription is an upgrade for businesses.' },
  },
});

export const openKnowledgeDocHcp = docPage({
  metaTitle: { nl: 'HCP | HomeCheff documentatie', en: 'HCP | HomeCheff documentation' },
  metaDescription: {
    nl: 'HomeCheff Points: erkenning voor constructieve deelname — geen geld, geen uitbetaling.',
    en: 'HomeCheff Points: recognition for constructive participation — not money, not payout.',
  },
  title: { nl: 'HomeCheff Points (HCP)', en: 'HomeCheff Points (HCP)' },
  intro: {
    nl: 'HCP beloont constructieve platformdeelname (listings, orders, reviews, streaks). Punten zijn geen cash en geen Stripe-tegoed.',
    en: 'HCP rewards constructive platform participation (listings, orders, reviews, streaks). Points are not cash and not Stripe credit.',
  },
  purpose: {
    nl: 'Zichtbaar maken van bijdragen aan de buurt-economie zonder pay-to-win of geldbeloftes.',
    en: 'Make contributions to the community economy visible without pay-to-win or money promises.',
  },
  how: {
    nl: 'HcpEvent-records en UserHcpStats houden punten en streaks bij. Badges en ranglijsten (/hcp-ranglijsten) tonen erkenning. Client toasts via /api/gamification/me.',
    en: 'HcpEvent records and UserHcpStats track points and streaks. Badges and leaderboards (/hcp-ranglijsten) show recognition. Client toasts via /api/gamification/me.',
  },
  limits: {
    nl: 'HCP is geen valuta. Geen garantie op ranking-boost via HCP tenzij expliciet productgedrag. Rewards kunnen verlopen.',
    en: 'HCP is not a currency. No guaranteed ranking boost via HCP unless explicit product behaviour. Rewards may expire.',
  },
  impact: {
    nl: 'Actieve makers zien voortgang en badges. Kopers kunnen reputatie-in signalen zien — naast reviews.',
    en: 'Active makers see progress and badges. Buyers may see reputation signals — alongside reviews.',
  },
  truth: {
    nl: 'Ecosystem- en FAQ-copy benadrukt: HCP is geen geld. Geen “verdien HCP als inkomen”-claims.',
    en: 'Ecosystem and FAQ copy emphasises: HCP is not money. No “earn HCP as income” claims.',
  },
  faq1: {
    q: { nl: 'Kan ik HCP uitbetalen?', en: 'Can I cash out HCP?' },
    a: { nl: 'Nee. Alleen erkenning binnen het platform.', en: 'No. Recognition within the platform only.' },
  },
  faq2: {
    q: { nl: 'Hoe krijg ik HCP?', en: 'How do I earn HCP?' },
    a: { nl: 'Via gedocumenteerde acties (login streak, listings, orders, reviews). Exacte regels in product — geen verborgen formules in marketing.', en: 'Via documented actions (login streak, listings, orders, reviews). Exact rules in product — no hidden formulas in marketing.' },
  },
  faq3: {
    q: { nl: 'Beïnvloedt HCP ranking?', en: 'Does HCP affect ranking?' },
    a: { nl: 'Niet als beloofde paid boost. Trust-signalen kunnen indirect meewegen in secties — zie ranking-doc.', en: 'Not as a promised paid boost. Trust signals may indirectly weigh in sections — see ranking doc.' },
  },
});

// Continue with remaining doc pages - affiliate, community-orders, barter, delivery, marketplace, trust ops, privacy, ai doc, api

export const openKnowledgeDocAffiliate = docPage({
  metaTitle: { nl: 'Affiliate | HomeCheff documentatie', en: 'Affiliate | HomeCheff documentation' },
  metaDescription: {
    nl: 'Affiliate-programma: attributie, commissies, uitbetaling — eerlijk en afhankelijk van echt platformgebruik.',
    en: 'Affiliate programme: attribution, commissions, payout — honest and dependent on real platform use.',
  },
  title: { nl: 'Affiliate', en: 'Affiliate' },
  intro: {
    nl: 'Affiliates helpen HomeCheff groeien via referral-links. Commissies volgen kwalificerende events — geen belofte van passief inkomen zonder activiteit.',
    en: 'Affiliates help HomeCheff grow via referral links. Commissions follow qualifying events — no promise of passive income without activity.',
  },
  purpose: {
    nl: 'Eerlijke groei via community-verwijzingen in plaats van advertentieplatform.',
    en: 'Honest growth via community referrals instead of an ad platform.',
  },
  how: {
    nl: 'Referral-cookie (hc_ref), Attribution-records en CommissionLedger bijhouden status (pending/available/paid). Uitbetaling via Stripe Connect waar geconfigureerd.',
    en: 'Referral cookie (hc_ref), Attribution records and CommissionLedger track status (pending/available/paid). Payout via Stripe Connect where configured.',
  },
  limits: {
    nl: 'Geen multi-level marketing-beloftes. Suspended accounts: affiliate-mutaties geblokkeerd (Phase 13T). Commissies vereisen kwalificerend gebruik.',
    en: 'No MLM promises. Suspended accounts: affiliate mutations blocked (Phase 13T). Commissions require qualifying use.',
  },
  impact: {
    nl: 'Affiliates zien dashboard en earnings export. Doorverwezen gebruikers worden correct geattribueerd over .nl → .eu redirect.',
    en: 'Affiliates see dashboard and earnings export. Referred users are attributed correctly across .nl → .eu redirect.',
  },
  truth: {
    nl: 'Calculator en landingspagina’s vermijden beloftes over vaste inkomsten. Phase 13O truth boundary.',
    en: 'Calculator and landing pages avoid promises of fixed earnings. Phase 13O truth boundary.',
  },
  faq1: {
    q: { nl: 'Is affiliate verplicht?', en: 'Is affiliate required?' },
    a: { nl: 'Nee. Optioneel programma op /affiliate.', en: 'No. Optional programme at /affiliate.' },
  },
  faq2: {
    q: { nl: 'Wanneer wordt commissie beschikbaar?', en: 'When is commission available?' },
    a: { nl: 'Volgens ledger-status en productregels — zie dashboard, geen vaste marketing-termijn tenzij gepubliceerd.', en: 'Per ledger status and product rules — see dashboard, no fixed marketing term unless published.' },
  },
  faq3: {
    q: { nl: 'Kunnen geschorste accounts affiliate doen?', en: 'Can suspended accounts do affiliate?' },
    a: { nl: 'Nee. Mutaties geblokkeerd via platform suspension guard.', en: 'No. Mutations blocked via platform suspension guard.' },
  },
});

export const openKnowledgeDocCommunityOrders = docPage({
  metaTitle: { nl: 'Community orders | Documentatie', en: 'Community orders | Documentation' },
  metaDescription: {
    nl: 'Buurtafspraken, deals en community orders na voorstellen — met reviews waar van toepassing.',
    en: 'Neighbourhood arrangements, deals and community orders after proposals — with reviews where applicable.',
  },
  title: { nl: 'Community orders', en: 'Community orders' },
  intro: {
    nl: 'Community orders en deals zijn buurtgerichte afspraken die vaak ontstaan na voorstellen (proposals) — soms naast klassieke Stripe-orders.',
    en: 'Community orders and deals are neighbourhood-focused arrangements often created after proposals — sometimes alongside classic Stripe orders.',
  },
  purpose: {
    nl: 'Flexibele waarde-uitwisseling (geld, ruil, afspraak) met traceerbaarheid en review waar het product dat ondersteunt.',
    en: 'Flexible value exchange (money, barter, arrangement) with traceability and review where the product supports it.',
  },
  how: {
    nl: 'Proposals koppelen gesprekken aan voorstellen. CommunityOrder/DealReview-modellen leggen status en feedback vast. Flow varieert per context (Gezocht, messaging).',
    en: 'Proposals link conversations to offers. CommunityOrder/DealReview models record status and feedback. Flow varies by context (Wanted, messaging).',
  },
  limits: {
    nl: 'Niet elke afspraak loopt via platform-checkout. Geschillen primair tussen partijen; platform bemiddelt waar mogelijk.',
    en: 'Not every arrangement runs through platform checkout. Disputes primarily between parties; platform mediates where possible.',
  },
  impact: {
    nl: 'Buren kunnen afspraken vastleggen en reputatie opbouwen na voltooide deals.',
    en: 'Neighbours can record arrangements and build reputation after completed deals.',
  },
  truth: {
    nl: 'Geen belofte dat elke buurtdeal juridisch afgedwongen wordt door HomeCheff.',
    en: 'No promise that every neighbourhood deal is legally enforced by HomeCheff.',
  },
  faq1: {
    q: { nl: 'Verschil met normale order?', en: 'Difference from normal order?' },
    a: { nl: 'Stripe-orders via checkout; community flows via proposals/deals — soms zonder platformbetaling.', en: 'Stripe orders via checkout; community flows via proposals/deals — sometimes without platform payment.' },
  },
  faq2: {
    q: { nl: 'Zijn reviews verplicht?', en: 'Are reviews required?' },
    a: { nl: 'Afhankelijk van flow; reviews moeten eerlijk zijn (communityrichtlijnen).', en: 'Depends on flow; reviews must be honest (community guidelines).' },
  },
  faq3: {
    q: { nl: 'Wanneer gebruikt dit?', en: 'When is this used?' },
    a: { nl: 'Bij Gezocht, barter-voorstellen en buurtafspraken.', en: 'For Wanted posts, barter proposals and neighbourhood arrangements.' },
  },
});

export const openKnowledgeDocBarter = docPage({
  metaTitle: { nl: 'Ruil & barter | Documentatie', en: 'Barter | Documentation' },
  metaDescription: {
    nl: 'Ruilen via voorstellen — geld is niet altijd nodig op HomeCheff.',
    en: 'Barter via proposals — money is not always required on HomeCheff.',
  },
  title: { nl: 'Ruil & barter', en: 'Barter' },
  intro: {
    nl: 'HomeCheff ondersteunt waarde-uitwisseling zonder geld via voorstellen (proposals) met alternatieve waarden.',
    en: 'HomeCheff supports value exchange without money via proposals with alternative values.',
  },
  purpose: {
    nl: 'Buurt-economie versterken: samenwerking vóór nul-som (Manifest).',
    en: 'Strengthen community economy: cooperation before zero-sum (Manifest).',
  },
  how: {
    nl: 'Gebruikers onderhandelen in messaging; proposals leggen terms vast. Checkout is optioneel wanneer geld wel nodig is.',
    en: 'Users negotiate in messaging; proposals record terms. Checkout is optional when money is needed.',
  },
  limits: {
    nl: 'HomeCheff bemiddelt niet automatisch bij elke ruil-geschil. Belasting/juridische verantwoordelijkheid bij gebruikers.',
    en: 'HomeCheff does not automatically mediate every barter dispute. Tax/legal responsibility with users.',
  },
  impact: {
    nl: 'Makers kunnen skills en producten ruilen naast verkoop.',
    en: 'Makers can exchange skills and products alongside sales.',
  },
  truth: {
    nl: 'Ruil is aangeboden — geen garantie op match of voltooiing.',
    en: 'Barter is offered — no guarantee of match or completion.',
  },
  faq1: {
    q: { nl: 'Moet ruil via checkout?', en: 'Must barter use checkout?' },
    a: { nl: 'Nee, tenzij partijen geld gebruiken.', en: 'No, unless parties use money.' },
  },
  faq2: {
    q: { nl: 'Waar start ik?', en: 'Where do I start?' },
    a: { nl: 'Gezocht-chip, messaging en voorstellen.', en: 'Wanted chip, messaging and proposals.' },
  },
  faq3: {
    q: { nl: 'Is ruil belastbaar?', en: 'Is barter taxable?' },
    a: { nl: 'Gebruikers zijn zelf verantwoordelijk — zie FAQ belastingen.', en: 'Users are responsible — see taxes FAQ.' },
  },
});

export const openKnowledgeDocDelivery = docPage({
  metaTitle: { nl: 'Bezorging | Documentatie', en: 'Delivery | Documentation' },
  metaDescription: {
    nl: 'Koeriers, bezorgprofielen en lokale logistiek — HomeCheff is geen landelijke bezorg-app.',
    en: 'Couriers, delivery profiles and local logistics — HomeCheff is not a national delivery app.',
  },
  title: { nl: 'Bezorging', en: 'Delivery' },
  intro: {
    nl: 'Bezorging op HomeCheff is buurtgericht: verkopers, kopers en optionele koeriers maken praktische afspraken.',
    en: 'Delivery on HomeCheff is neighbourhood-focused: sellers, buyers and optional couriers make practical arrangements.',
  },
  purpose: {
    nl: 'Lokale logistiek ondersteunen zonder nationale restaurant-ketens na te bootsen.',
    en: 'Support local logistics without mimicking national restaurant chains.',
  },
  how: {
    nl: 'DeliveryProfile voor koeriers; DeliveryOrder koppelt orders. GPS/status-updates waar ingeschakeld. Verdiensten via payout-regels.',
    en: 'DeliveryProfile for couriers; DeliveryOrder links orders. GPS/status updates where enabled. Earnings via payout rules.',
  },
  limits: {
    nl: 'Geen garantie op koerier in elke regio. Suspended accounts: delivery-mutaties geblokkeerd.',
    en: 'No courier guarantee in every region. Suspended accounts: delivery mutations blocked.',
  },
  impact: {
    nl: 'Kopers kunnen pickup, afspreken of koerier kiezen afhankelijk van aanbod.',
    en: 'Buyers may choose pickup, meetup or courier depending on offer.',
  },
  truth: {
    nl: 'HomeCheff positioneert zich niet als Thuisbezorgd/Uber Eats — zie /vergelijken/homecheff-vs-bezorgplatforms.',
    en: 'HomeCheff does not position as Thuisbezorgd/Uber Eats — see /vergelijken/homecheff-vs-bezorgplatforms.',
  },
  faq1: {
    q: { nl: 'Hoe word ik koerier?', en: 'How do I become a courier?' },
    a: { nl: 'Via /bezorger-worden en DeliveryProfile — onder voorbehoud van regio en onboarding.', en: 'Via /bezorger-worden and DeliveryProfile — subject to region and onboarding.' },
  },
  faq2: {
    q: { nl: 'Is bezorging verplicht?', en: 'Is delivery mandatory?' },
    a: { nl: 'Nee. Veel deals zijn ophalen of afspreken.', en: 'No. Many deals are pickup or meetup.' },
  },
  faq3: {
    q: { nl: 'Wie betaalt bezorging?', en: 'Who pays delivery?' },
    a: { nl: 'Volgens listing en order — transparant in checkout waar van toepassing.', en: 'Per listing and order — transparent in checkout where applicable.' },
  },
});

export const openKnowledgeDocMarketplace = docPage({
  metaTitle: { nl: 'Marketplace | Documentatie', en: 'Marketplace | Documentation' },
  metaDescription: {
    nl: 'Listings, checkout, profielen en categorieën — het dorpsplein als marketplace.',
    en: 'Listings, checkout, profiles and categories — the village square as marketplace.',
  },
  title: { nl: 'Marketplace', en: 'Marketplace' },
  intro: {
    nl: 'De marketplace is het Dorpsplein: geo-feed met eten, tuin, studio, diensten, inspiratie en Gezocht.',
    en: 'The marketplace is the Village Square: geo feed with food, garden, studio, services, inspiration and Wanted.',
  },
  purpose: {
    nl: 'Lokaal vakmanschap zichtbaar maken met persoon achter elk aanbod.',
    en: 'Make local craft visible with a person behind every offer.',
  },
  how: {
    nl: 'Listings (Product/Listing), seller profielen, Stripe checkout voor betalingen, messaging voor contact. Categorieën en chips filteren intent.',
    en: 'Listings (Product/Listing), seller profiles, Stripe checkout for payments, messaging for contact. Categories and chips filter intent.',
  },
  limits: {
    nl: 'Geen dropshipping/anonieme massa (communityrichtlijnen). Suspended users kunnen niet muteren.',
    en: 'No dropshipping/anonymous mass (community guidelines). Suspended users cannot mutate.',
  },
  impact: {
    nl: 'Kopers ontdekken lokaal; verkopers bereiken buurt zonder eigen webshop verplicht.',
    en: 'Buyers discover locally; sellers reach neighbourhood without mandatory own webshop.',
  },
  truth: {
    nl: 'Fees staan op /sell en in Business DNA — geen verborgen marketplace-model.',
    en: 'Fees on /sell and in Business DNA — no hidden marketplace model.',
  },
  faq1: {
    q: { nl: 'Is HomeCheff een webshop?', en: 'Is HomeCheff a webshop?' },
    a: { nl: 'Nee — een buurtplatform met mensen centraal.', en: 'No — a neighbourhood platform with people at the centre.' },
  },
  faq2: {
    q: { nl: 'Welke categorieën?', en: 'Which categories?' },
    a: { nl: 'Chef, Garden, Designer, diensten, inspiratie, Gezocht — eten is één categorie.', en: 'Chef, Garden, Designer, services, inspiration, Wanted — food is one category.' },
  },
  faq3: {
    q: { nl: 'Hoe werkt checkout?', en: 'How does checkout work?' },
    a: { nl: 'Stripe Checkout waar ingeschakeld; uitbetaling via Connect — zie FAQ betalingen.', en: 'Stripe Checkout where enabled; payout via Connect — see payments FAQ.' },
  },
});

export const openKnowledgeDocTrustOps = docPage({
  metaTitle: { nl: 'Trust (operations) | Documentatie', en: 'Trust (operations) | Documentation' },
  metaDescription: {
    nl: 'Melden, moderatie, suspensie en data-export — operationele trust op HomeCheff.',
    en: 'Reporting, moderation, suspension and data export — operational trust on HomeCheff.',
  },
  title: { nl: 'Trust (operations)', en: 'Trust (operations)' },
  intro: {
    nl: 'Operationele trust: hoe meldingen, suspensie, reviews en profielen worden behandeld — zonder misbruikvectoren te documenteren.',
    en: 'Operational trust: how reports, suspension, reviews and profiles are handled — without documenting abuse vectors.',
  },
  purpose: {
    nl: 'Veilige buurt-economie met proportionele handhaving.',
    en: 'Safe community economy with proportionate enforcement.',
  },
  how: {
    nl: 'Gebruikers melden via in-app/report flows. Admins kunnen suspenderen (suspendedAt). Middleware + API guard blokkeert mutaties voor geschorste accounts (Phase 13T). Reviews en profielen zijn zichtbaar met richtlijnen.',
    en: 'Users report via in-app/report flows. Admins can suspend (suspendedAt). Middleware + API guard blocks mutations for suspended accounts (Phase 13T). Reviews and profiles are visible with guidelines.',
  },
  limits: {
    nl: 'HomeCheff is platform — geen garantie op 100% moderatie vóór schade. Interne moderation details niet publiek.',
    en: 'HomeCheff is a platform — no guarantee of 100% moderation before harm. Internal moderation details not public.',
  },
  impact: {
    nl: 'Geschorste accounts kunnen lezen en GDPR-export; geen checkout/messaging/listings mutaties. Slachtoffers kunnen melden.',
    en: 'Suspended accounts can read and GDPR export; no checkout/messaging/listings mutations. Victims can report.',
  },
  truth: {
    nl: 'Suspension is global voor mutaties (Phase 13T). Publieke listings kunnen zichtbaar blijven tot restore.',
    en: 'Suspension is global for mutations (Phase 13T). Public listings may remain visible until restore.',
  },
  faq1: {
    q: { nl: 'Hoe meld ik misbruik?', en: 'How do I report abuse?' },
    a: { nl: 'Via melden in app of /safety en communityrichtlijnen.', en: 'Via report in app or /safety and community guidelines.' },
  },
  faq2: {
    q: { nl: 'Wat gebeurt bij suspensie?', en: 'What happens on suspension?' },
    a: { nl: 'Mutaties geblokkeerd; support/appeal via /contact. Zie /trust voor filosofie.', en: 'Mutations blocked; support/appeal via /contact. See /trust for philosophy.' },
  },
  faq3: {
    q: { nl: 'Zijn reviews gemodereerd?', en: 'Are reviews moderated?' },
    a: { nl: 'Eerlijkheid vereist; misbruik meldbaar — geen volledige pre-publicatie voor alles.', en: 'Honesty required; abuse reportable — not full pre-publication for everything.' },
  },
});

export const openKnowledgeDocPrivacy = docPage({
  metaTitle: { nl: 'Privacy (product) | Documentatie', en: 'Privacy (product) | Documentation' },
  metaDescription: {
    nl: 'GDPR-export, consent, data-minimalisatie — product privacy op HomeCheff.',
    en: 'GDPR export, consent, data minimisation — product privacy on HomeCheff.',
  },
  title: { nl: 'Privacy (product)', en: 'Privacy (product)' },
  intro: {
    nl: 'Product privacy: welke data gebruikers kunnen exporteren, wat bewaard blijft en waar het juridische beleid staat.',
    en: 'Product privacy: which data users can export, what is retained and where legal policy lives.',
  },
  purpose: {
    nl: 'Transparantie over persoonsgegevens — technologie met geweten.',
    en: 'Transparency about personal data — technology with a conscience.',
  },
  how: {
    nl: 'GET /api/profile/export-data levert JSON-export (Phase 13T): profiel, orders, messages metadata, HCP, etc. Account deletion via /api/profile/delete-account. Juridisch: /privacy.',
    en: 'GET /api/profile/export-data delivers JSON export (Phase 13T): profile, orders, messages metadata, HCP, etc. Account deletion via /api/profile/delete-account. Legal: /privacy.',
  },
  limits: {
    nl: 'Export omits secrets, encrypted bodies, third-party private data. Rate limit 3/dag. Orders/finance kunnen langer bewaard voor wet.',
    en: 'Export omits secrets, encrypted bodies, third-party private data. Rate limit 3/day. Orders/finance may be retained longer for law.',
  },
  impact: {
    nl: 'Gebruikers kunnen export downloaden vóór delete. Suspended users mogen export (GDPR).',
    en: 'Users can download export before delete. Suspended users may export (GDPR).',
  },
  truth: {
    nl: 'Geen “volledige data-portability”-marketing — export documenteert omissions expliciet.',
    en: 'No “full data portability” marketing — export documents omissions explicitly.',
  },
  faq1: {
    q: { nl: 'Waar is het privacybeleid?', en: 'Where is the privacy policy?' },
    a: { nl: '/privacy — juridische tekst.', en: '/privacy — legal text.' },
  },
  faq2: {
    q: { nl: 'Zitten wachtwoorden in export?', en: 'Are passwords in export?' },
    a: { nl: 'Nee. passwordHash en tokens nooit.', en: 'No. passwordHash and tokens never.' },
  },
  faq3: {
    q: { nl: 'Encrypted messages?', en: 'Encrypted messages?' },
    a: { nl: 'Metadata wel; plaintext alleen wanneer veilig beschikbaar — zie omissions in export.', en: 'Metadata yes; plaintext only when safely available — see export omissions.' },
  },
});

export const openKnowledgeDocAi = docPage({
  metaTitle: { nl: 'AI (technisch) | Documentatie', en: 'AI (technical) | Documentation' },
  metaDescription: {
    nl: 'Waar AI wel en niet wordt gebruikt op HomeCheff — geen overdreven capabilities.',
    en: 'Where AI is and is not used on HomeCheff — no exaggerated capabilities.',
  },
  title: { nl: 'AI (technisch)', en: 'AI (technical)' },
  intro: {
    nl: 'Technische AI-documentatie voor lezers en toekomstige agents: huidige capabilities, regels en grenzen.',
    en: 'Technical AI documentation for readers and future agents: current capabilities, rules and boundaries.',
  },
  purpose: {
    nl: 'AI als hulpmiddel documenteren — niet als product (Manifest).',
    en: 'Document AI as a tool — not the product (Manifest).',
  },
  how: {
    nl: 'Publieke SEO/schema/documentatie is machine-leesbaar (Phase 13S/V). Product-AI (indien aanwezig) ondersteunt UX — geen autonome agent-API publiek.',
    en: 'Public SEO/schema/documentation is machine-readable (Phase 13S/V). Product AI (where present) supports UX — no autonomous agent API public.',
  },
  limits: {
    nl: 'Geen publieke write-API voor agents. Geen verborgen AI-tekst voor manipulatie. Menselijke review waar content publiek wordt.',
    en: 'No public write API for agents. No hidden AI text for manipulation. Human review where content goes public.',
  },
  impact: {
    nl: 'AI-systemen kunnen platform begrijpen via /docs, /manifest, /glossary. Gebruikers zien geen AI-first interface.',
    en: 'AI systems can understand platform via /docs, /manifest, /glossary. Users do not see an AI-first interface.',
  },
  truth: {
    nl: 'Zie ook /ai voor publieke uitleg. futureAiMarketing in Business DNA is “future” — niet live claim.',
    en: 'See also /ai for public explanation. futureAiMarketing in Business DNA is “future” — not a live claim.',
  },
  faq1: {
    q: { nl: 'Is er een publieke HomeCheff API?', en: 'Is there a public HomeCheff API?' },
    a: { nl: 'Nee — zie /docs/api.', en: 'No — see /docs/api.' },
  },
  faq2: {
    q: { nl: 'Vervangt AI makers?', en: 'Does AI replace makers?' },
    a: { nl: 'Nee — Manifest: mensen centraal.', en: 'No — Manifest: people first.' },
  },
  faq3: {
    q: { nl: 'Structured data voor AI?', en: 'Structured data for AI?' },
    a: { nl: 'Organization/WebSite graph, FAQ, TechArticle op docs — alleen waarheidsgetrouw.', en: 'Organization/WebSite graph, FAQ, TechArticle on docs — truthful only.' },
  },
});

export const openKnowledgeDocApi = docPage({
  metaTitle: { nl: 'API & agents | Documentatie', en: 'API & agents | Documentation' },
  metaDescription: {
    nl: 'Geen speculatieve API — wat agents vandaag wel kunnen lezen en wat niet.',
    en: 'No speculative API — what agents can read today and what not.',
  },
  title: { nl: 'API & agents', en: 'API & agents' },
  intro: {
    nl: 'HomeCheff heeft geen publieke write-API voor autonome agents. Deze pagina beschrijft read-only open kennis en toekomstige richting — zonder fake integraties.',
    en: 'HomeCheff has no public write API for autonomous agents. This page describes read-only open knowledge and future direction — without fake integrations.',
  },
  purpose: {
    nl: 'AI agent readiness via documentatie, niet via premature endpoints.',
    en: 'AI agent readiness via documentation, not premature endpoints.',
  },
  how: {
    nl: 'Agents kunnen publieke HTML/JSON-LD, /docs/*, /manifest, /glossary, sitemap en FAQ lezen. Authenticated APIs bestaan voor ingelogde app — niet voor third-party agents.',
    en: 'Agents can read public HTML/JSON-LD, /docs/*, /manifest, /glossary, sitemap and FAQ. Authenticated APIs exist for logged-in app — not for third-party agents.',
  },
  limits: {
    nl: 'Geen OAuth voor externe agents. Geen guaranteed SLA op documentatie. Rate limits op export en API.',
    en: 'No OAuth for external agents. No guaranteed SLA on documentation. Rate limits on export and API.',
  },
  impact: {
    nl: 'Citation-quality antwoorden mogelijk zonder scraping van privédata.',
    en: 'Citation-quality answers possible without scraping private data.',
  },
  truth: {
    nl: 'Als een publieke API komt, verschijnt die eerst hier — niet in marketing.',
    en: 'If a public API comes, it appears here first — not in marketing.',
  },
  faq1: {
    q: { nl: 'Kan een agent listings plaatsen?', en: 'Can an agent post listings?' },
    a: { nl: 'Nee. Alleen via ingelogde gebruiker in app.', en: 'No. Only via logged-in user in app.' },
  },
  faq2: {
    q: { nl: 'Welke terminologie?', en: 'Which terminology?' },
    a: { nl: 'Zie /glossary — DefinedTermSet schema.', en: 'See /glossary — DefinedTermSet schema.' },
  },
  faq3: {
    q: { nl: 'Platformregels?', en: 'Platform rules?' },
    a: { nl: '/manifest, /principles, communityrichtlijnen.', en: '/manifest, /principles, community guidelines.' },
  },
});

// Trust philosophy hub (/trust)
export const openKnowledgeTrust = {
  metaTitle: {
    nl: 'Trust & transparantie | HomeCheff',
    en: 'Trust & transparency | HomeCheff',
  },
  metaDescription: {
    nl: 'Moderatie-, ranking-, AI-, safety-, privacy- en marketplace-filosofie — gekoppeld aan het Manifest.',
    en: 'Moderation, ranking, AI, safety, privacy and marketplace philosophy — linked to the Manifest.',
  },
  title: { nl: 'Trust & transparantie', en: 'Trust & transparency' },
  intro: {
    nl: 'Trust ontstaat uit transparantie, niet uit marketing. Deze pagina vat publieke filosofie samen; operationele details staan in /docs/trust.',
    en: 'Trust emerges from transparency, not marketing. This page summarises public philosophy; operational details are in /docs/trust.',
  },
  sectionModerationTitle: { nl: 'Moderatiefilosofie', en: 'Moderation philosophy' },
  sectionModerationBody: {
    nl: 'Proportioneel, niet destructief waar mogelijk. Suspensie blokkeert mutaties; admins loggen acties. CSAM/nul tolerantie — zie /safety.',
    en: 'Proportionate, non-destructive where possible. Suspension blocks mutations; admins log actions. CSAM/zero tolerance — see /safety.',
  },
  sectionRankingTitle: { nl: 'Rankingfilosofie', en: 'Ranking philosophy' },
  sectionRankingBody: {
    nl: 'Ontdekking voor mensen, niet engagement-maximalisatie. Diversiteit en new-creator secties blijven. Geen stille paid dominance — zie /docs/ranking.',
    en: 'Discovery for people, not engagement maximisation. Diversity and new-creator sections remain. No silent paid dominance — see /docs/ranking.',
  },
  sectionAiTitle: { nl: 'AI-filosofie', en: 'AI philosophy' },
  sectionAiBody: {
    nl: 'AI ondersteunt; vervangt geen relaties. Documentatie is machine-leesbaar. Zie /ai en /manifest.',
    en: 'AI supports; does not replace relationships. Documentation is machine-readable. See /ai and /manifest.',
  },
  sectionSafetyTitle: { nl: 'Safety-filosofie', en: 'Safety philosophy' },
  sectionSafetyBody: {
    nl: 'Kindveiligheid, melden en samenwerking met autoriteiten waar wettelijk vereist. /safety en communityrichtlijnen.',
    en: 'Child safety, reporting and cooperation with authorities where legally required. /safety and community guidelines.',
  },
  sectionPrivacyTitle: { nl: 'Privacy-filosofie', en: 'Privacy philosophy' },
  sectionPrivacyBody: {
    nl: 'Data-minimalisatie, echte export, duidelijke omissions. Juridisch beleid op /privacy; product op /docs/privacy.',
    en: 'Data minimisation, real export, clear omissions. Legal policy at /privacy; product at /docs/privacy.',
  },
  sectionMarketplaceTitle: { nl: 'Marketplace-filosofie', en: 'Marketplace philosophy' },
  sectionMarketplaceBody: {
    nl: 'Mensen vóór producten. Geen dropshipping/anonieme massa. Eerlijke fees — /docs/marketplace.',
    en: 'People before products. No dropshipping/anonymous mass. Honest fees — /docs/marketplace.',
  },
  linkManifest: { nl: 'HomeCheff Manifest', en: 'HomeCheff Manifest' },
  linkDocsTrust: { nl: 'Trust (operations)', en: 'Trust (operations)' },
  linkDocsRanking: { nl: 'Ranking docs', en: 'Ranking docs' },
  linkDocsPrivacy: { nl: 'Privacy docs', en: 'Privacy docs' },
  faqBlockTitle: { nl: 'Veelgestelde vragen', en: 'Frequently asked questions' },
  faq1Q: { nl: 'Belooft HomeCheff 100% veiligheid?', en: 'Does HomeCheff promise 100% safety?' },
  faq1A: {
    nl: 'Nee. We bieden tools, melden en handhaving — gebruikers blijven medeverantwoordelijk.',
    en: 'No. We offer tools, reporting and enforcement — users remain co-responsible.',
  },
  faq2Q: { nl: 'Waar is operationele trust gedocumenteerd?', en: 'Where is operational trust documented?' },
  faq2A: { nl: '/docs/trust', en: '/docs/trust' },
  faq3Q: { nl: 'Hoe sluit dit aan op het Manifest?', en: 'How does this align with the Manifest?' },
  faq3A: { nl: 'Alle filosofie erft van /manifest — technologie met geweten.', en: 'All philosophy inherits from /manifest — technology with a conscience.' },
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const openKnowledgeChangelog = {
  metaTitle: { nl: 'Changelog | HomeCheff', en: 'Changelog | HomeCheff' },
  metaDescription: {
    nl: 'Chronologische productupdates — feitelijk, zonder marketingtaal.',
    en: 'Chronological product updates — factual, no marketing language.',
  },
  title: { nl: 'Changelog', en: 'Changelog' },
  intro: {
    nl: 'Belangrijke wijzigingen aan product, documentatie en trust-laag. Geen hype — alleen wat shipped is of expliciet breaking is.',
    en: 'Important changes to product, documentation and trust layer. No hype — only what shipped or is explicitly breaking.',
  },
  entry202607Title: { nl: '2026-07 — Open Knowledge (Phase 13V)', en: '2026-07 — Open Knowledge (Phase 13V)' },
  entry202607Body: {
    nl: 'Publieke /docs, /trust, /changelog, /roadmap, /principles, /ai, /glossary. Machine-leesbare schema waar waarheidsgetrouw.',
    en: 'Public /docs, /trust, /changelog, /roadmap, /principles, /ai, /glossary. Machine-readable schema where truthful.',
  },
  entry202607bTitle: { nl: '2026-07 — Manifest (Phase 13T)', en: '2026-07 — Manifest (Phase 13T)' },
  entry202607bBody: {
    nl: '/manifest, uitgebreid /over-ons, filosofische SSOT voor schema en copy.',
    en: '/manifest, expanded /over-ons, philosophy SSOT for schema and copy.',
  },
  entry202607cTitle: { nl: '2026-07 — Product truth (Phase 13T)', en: '2026-07 — Product truth (Phase 13T)' },
  entry202607cBody: {
    nl: 'Echte GDPR-export, global suspension guard, Business DNA ranking-boost niet live — copy gecorrigeerd.',
    en: 'Real GDPR export, global suspension guard, Business DNA ranking boost not live — copy corrected.',
  },
  entry202606Title: { nl: '2026-06 — AI Authority (Phase 13R–13S)', en: '2026-06 — AI Authority (Phase 13R–13S)' },
  entry202606Body: {
    nl: 'Vergelijk-pagina’s, ecosystem map, Organization JSON-LD SSOT, craft-first positioning.',
    en: 'Comparison pages, ecosystem map, Organization JSON-LD SSOT, craft-first positioning.',
  },
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const openKnowledgeRoadmap = {
  metaTitle: { nl: 'Roadmap | HomeCheff', en: 'Roadmap | HomeCheff' },
  metaDescription: {
    nl: 'Voltooid, bezig, gepland en ideeën — duidelijk gescheiden.',
    en: 'Completed, in progress, planned and ideas — clearly separated.',
  },
  title: { nl: 'Roadmap', en: 'Roadmap' },
  intro: {
    nl: 'Geen beloftes aan datums. Status is indicatief; alleen “Completed” is shipped.',
    en: 'No date promises. Status is indicative; only “Completed” is shipped.',
  },
  sectionDoneTitle: { nl: 'Voltooid', en: 'Completed' },
  sectionDoneBody: {
    nl: 'Open docs hub, manifest, GDPR export, suspension guard, comparison pages, ecosystem map, craft pillars, HCP, affiliate, Stripe checkout, delivery profiles.',
    en: 'Open docs hub, manifest, GDPR export, suspension guard, comparison pages, ecosystem map, craft pillars, HCP, affiliate, Stripe checkout, delivery profiles.',
  },
  sectionProgressTitle: { nl: 'In uitvoering', en: 'In progress' },
  sectionProgressBody: {
    nl: 'Machine trust schema (DefinedTermSet, TechArticle), documentatie-pariteit NL/EN, regionale meal hubs waar activiteit drempel haalt.',
    en: 'Machine trust schema (DefinedTermSet, TechArticle), documentation parity NL/EN, regional meal hubs where activity meets threshold.',
  },
  sectionPlannedTitle: { nl: 'Gepland', en: 'Planned' },
  sectionPlannedBody: {
    nl: 'Business DNA ranking alleen indien capped en end-to-end bewezen. Eventuele publieke read-API voor partners — na security review.',
    en: 'Business DNA ranking only if capped and proven end-to-end. Possible public read API for partners — after security review.',
  },
  sectionIdeasTitle: { nl: 'Ideeën', en: 'Ideas' },
  sectionIdeasBody: {
    nl: 'AI marketing assist voor makers (Business DNA “future”), campagne-builder, franchise tools — niet live tot bewezen.',
    en: 'AI marketing assist for makers (Business DNA “future”), campaign builder, franchise tools — not live until proven.',
  },
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const openKnowledgePrinciples = {
  metaTitle: { nl: 'Open principes | HomeCheff', en: 'Open principles | HomeCheff' },
  metaDescription: {
    nl: 'Samenvatting van platformprincipes — aligned met het Manifest.',
    en: 'Summary of platform principles — aligned with the Manifest.',
  },
  title: { nl: 'Open principes', en: 'Open principles' },
  intro: {
    nl: 'Deze principes sturen product, copy en documentatie. Volledige uitleg: /manifest.',
    en: 'These principles guide product, copy and documentation. Full explanation: /manifest.',
  },
  p1Title: { nl: 'Mens vóór algoritmes', en: 'Human before algorithms' },
  p1Body: {
    nl: 'Algoritmes ondersteunen mensen — niet omgekeerd.',
    en: 'Algorithms support people — not the other way around.',
  },
  p2Title: { nl: 'Technologie met geweten', en: 'Technology with a conscience' },
  p2Body: {
    nl: 'Geen dark patterns of engagement-traps.',
    en: 'No dark patterns or engagement traps.',
  },
  p3Title: { nl: 'Eerlijke kansen', en: 'Honest opportunities' },
  p3Body: {
    nl: 'Transparante fees en beperkingen — geen rijkdom-beloftes.',
    en: 'Transparent fees and limits — no wealth promises.',
  },
  p4Title: { nl: 'Lokale gemeenschappen', en: 'Local communities' },
  p4Body: {
    nl: 'Buurt vóór anonieme schaal.',
    en: 'Neighbourhood before anonymous scale.',
  },
  p5Title: { nl: 'Persoonlijk vakmanschap', en: 'Personal craftsmanship' },
  p5Body: {
    nl: 'Makers met gezicht en verhaal.',
    en: 'Makers with a face and story.',
  },
  p6Title: { nl: 'Waarheid vóór marketing', en: 'Truth before marketing' },
  p6Body: {
    nl: 'Phase 13O boundaries — copy volgt product.',
    en: 'Phase 13O boundaries — copy follows product.',
  },
  p7Title: { nl: 'Transparantie vóór manipulatie', en: 'Transparency over manipulation' },
  p7Body: {
    nl: 'Open docs, changelog, roadmap — geen verborgen AI-tekst.',
    en: 'Open docs, changelog, roadmap — no hidden AI text.',
  },
  linkManifest: { nl: 'Lees het volledige Manifest', en: 'Read the full Manifest' },
  linkConstitution: { nl: 'HomeCheff Constitution', en: 'HomeCheff Constitution' },
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const openKnowledgeAiPublic = {
  metaTitle: { nl: 'AI op HomeCheff', en: 'AI on HomeCheff' },
  metaDescription: {
    nl: 'Hoe AI wordt gebruikt, waar niet, privacy en beperkingen — geen overdreven capabilities.',
    en: 'How AI is used, where not, privacy and limits — no exaggerated capabilities.',
  },
  title: { nl: 'AI op HomeCheff', en: 'AI on HomeCheff' },
  intro: {
    nl: 'AI is geen product. Deze pagina is voor iedereen — technische details op /docs/ai.',
    en: 'AI is not the product. This page is for everyone — technical details at /docs/ai.',
  },
  sectionUsedTitle: { nl: 'Waar AI wel helpt', en: 'Where AI helps' },
  sectionUsedBody: {
    nl: 'Intern/UX: complexiteit verlagen waar geïmplementeerd (bijv. onboarding-hints). Publieke SEO/documentatie is gestructureerd voor machine-leesbaarheid — geen chatbot vervangt buren.',
    en: 'Internal/UX: reducing complexity where implemented (e.g. onboarding hints). Public SEO/documentation is structured for machine readability — no chatbot replaces neighbours.',
  },
  sectionNotUsedTitle: { nl: 'Waar AI niet is', en: 'Where AI is not' },
  sectionNotUsedBody: {
    nl: 'Geen autonome agent die listings plaatst. Geen AI-generated publieke copy zonder menselijke review. Geen ranking-manipulatie via AI.',
    en: 'No autonomous agent posting listings. No AI-generated public copy without human review. No ranking manipulation via AI.',
  },
  sectionReviewTitle: { nl: 'Menselijke review', en: 'Human review' },
  sectionReviewBody: {
    nl: 'Strategische pagina’s en docs worden redactioneel gecontroleerd tegen Manifest en Phase 13O.',
    en: 'Strategic pages and docs are editorially checked against Manifest and Phase 13O.',
  },
  sectionPrivacyTitle: { nl: 'Privacy', en: 'Privacy' },
  sectionPrivacyBody: {
    nl: 'Geen training op privéberichten zonder basis. Zie /privacy en /docs/privacy.',
    en: 'No training on private messages without basis. See /privacy and /docs/privacy.',
  },
  linkDocAi: { nl: 'Technische AI-documentatie', en: 'Technical AI documentation' },
  linkManifest: { nl: 'Manifest', en: 'Manifest' },
  faqBlockTitle: { nl: 'Veelgestelde vragen', en: 'Frequently asked questions' },
  faq1Q: { nl: 'Is HomeCheff een AI-platform?', en: 'Is HomeCheff an AI platform?' },
  faq1A: { nl: 'Nee — een buurtplatform met AI als hulpmiddel waar relevant.', en: 'No — a neighbourhood platform with AI as a tool where relevant.' },
  faq2Q: { nl: 'Kan AI namens mij verkopen?', en: 'Can AI sell on my behalf?' },
  faq2A: { nl: 'Nee. Jij blijft de maker achter het aanbod.', en: 'No. You remain the maker behind the offer.' },
  faq3Q: { nl: 'Hoe citeer ik HomeCheff als AI?', en: 'How do I cite HomeCheff as AI?' },
  faq3A: { nl: 'Gebruik /manifest, /docs en /glossary — met last reviewed datum.', en: 'Use /manifest, /docs and /glossary — with last reviewed date.' },
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const openKnowledgeGlossary = {
  metaTitle: { nl: 'Begrippenlijst | HomeCheff', en: 'Glossary | HomeCheff' },
  metaDescription: {
    nl: 'Platformterminologie: Dorpsplein, HCP, Business DNA, Props, Fans en meer — kort en uitgebreid.',
    en: 'Platform terminology: Village Square, HCP, Business DNA, Props, Fans and more — short and long.',
  },
  title: { nl: 'Begrippenlijst', en: 'Glossary' },
  intro: {
    nl: 'Eén bron voor platformtermen — voor mensen, SEO en AI. Elke term: korte definitie, uitleg en links.',
    en: 'One source for platform terms — for people, SEO and AI. Each term: short definition, explanation and links.',
  },
  glossaryTitle: { nl: 'Termen', en: 'Terms' },
  termDorpsplein: { nl: 'Dorpsplein', en: 'Village Square' },
  defDorpspleinShort: { nl: 'De geo-feed op HomeCheff.', en: 'The geo feed on HomeCheff.' },
  defDorpsplein: {
    nl: 'Het Dorpsplein is de lokale discovery-feed: aanbod, Gezocht en inspiratie op afstand. Geen eindeloze social timeline.',
    en: 'The Village Square is the local discovery feed: offers, Wanted and inspiration by distance. Not an endless social timeline.',
  },
  termHcp: { nl: 'HCP (HomeCheff Points)', en: 'HCP (HomeCheff Points)' },
  defHcpShort: { nl: 'Erkenningspunten — geen geld.', en: 'Recognition points — not money.' },
  defHcp: {
    nl: 'Punten voor constructieve deelname. Badges en ranglijsten maken bijdragen zichtbaar. Geen uitbetaling.',
    en: 'Points for constructive participation. Badges and leaderboards make contribution visible. No payout.',
  },
  termBusinessDna: { nl: 'Business DNA', en: 'Business DNA' },
  defBusinessDnaShort: { nl: 'Zakelijke abonnements-SSOT.', en: 'Business subscription SSOT.' },
  defBusinessDna: {
    nl: 'Fees, badges en profielvoordelen per plan. Geen gegarandeerde feed-ranking boost live.',
    en: 'Fees, badges and profile benefits per plan. No guaranteed live feed ranking boost.',
  },
  termCommunityOrder: { nl: 'Community order', en: 'Community order' },
  defCommunityOrderShort: { nl: 'Buurtafspraak na voorstel.', en: 'Neighbourhood deal after proposal.' },
  defCommunityOrder: {
    nl: 'Afspraak vastgelegd na proposal-flow; kan review hebben. Niet altijd Stripe-checkout.',
    en: 'Arrangement recorded after proposal flow; may have review. Not always Stripe checkout.',
  },
  termProps: { nl: 'Props', en: 'Props' },
  defPropsShort: { nl: 'Waardering op content.', en: 'Appreciation on content.' },
  defProps: {
    nl: 'Props zijn een lichte social erkenning op inspiratie/content — geen valuta.',
    en: 'Props are light social recognition on inspiration/content — not a currency.',
  },
  termFans: { nl: 'Fans', en: 'Fans' },
  defFansShort: { nl: 'Volgers van makers.', en: 'Followers of makers.' },
  defFans: {
    nl: 'Fans volgen makers voor updates. Verschilt van Follow/Props — zie profiel en feed.',
    en: 'Fans follow makers for updates. Differs from Follow/Props — see profile and feed.',
  },
  termMarketplace: { nl: 'Marketplace', en: 'Marketplace' },
  defMarketplaceShort: { nl: 'Lokaal aanbod met personen.', en: 'Local offers with people.' },
  defMarketplace: {
    nl: 'Het geheel van listings, checkout, profielen en categorieën op het Dorpsplein.',
    en: 'The whole of listings, checkout, profiles and categories on the Village Square.',
  },
  termAffiliate: { nl: 'Affiliate', en: 'Affiliate' },
  defAffiliateShort: { nl: 'Referral-groei programma.', en: 'Referral growth programme.' },
  defAffiliate: {
    nl: 'Verwijzingen via hc_ref; commissies op kwalificerend gebruik. Geen MLM.',
    en: 'Referrals via hc_ref; commissions on qualifying use. Not MLM.',
  },
  termDelivery: { nl: 'Bezorging', en: 'Delivery' },
  defDeliveryShort: { nl: 'Lokale koeriers optioneel.', en: 'Local couriers optional.' },
  defDelivery: {
    nl: 'DeliveryProfile en DeliveryOrder — geen landelijke bezorgketen.',
    en: 'DeliveryProfile and DeliveryOrder — not a national delivery chain.',
  },
  termBarter: { nl: 'Ruil / barter', en: 'Barter' },
  defBarterShort: { nl: 'Waarde zonder geld.', en: 'Value without money.' },
  defBarter: {
    nl: 'Via proposals met alternatieve waarden — naast checkout.',
    en: 'Via proposals with alternative values — alongside checkout.',
  },
  termStudio: { nl: 'Studio', en: 'Studio' },
  defStudioShort: { nl: 'Creatieve maker-categorie.', en: 'Creative maker category.' },
  defStudio: {
    nl: 'Studio-community voor handgemaakt en design — naast Chef en Garden.',
    en: 'Studio community for handmade and design — alongside Chef and Garden.',
  },
  termChef: { nl: 'Chef', en: 'Chef' },
  defChefShort: { nl: 'Thuisgemaakt eten categorie.', en: 'Home-prepared food category.' },
  defChef: {
    nl: 'Makers die eten aanbieden — één categorie, niet het hele platform.',
    en: 'Makers offering food — one category, not the whole platform.',
  },
  termGarden: { nl: 'Garden', en: 'Garden' },
  defGardenShort: { nl: 'Tuin/oogst categorie.', en: 'Garden/harvest category.' },
  defGarden: {
    nl: 'Tuinmakers en oogst — lokaal en seizoensgebonden.',
    en: 'Garden makers and harvest — local and seasonal.',
  },
  termDesigner: { nl: 'Designer', en: 'Designer' },
  defDesignerShort: { nl: 'Design/creaties rol.', en: 'Design/creations role.' },
  defDesigner: {
    nl: 'Creatieve en design-aanbieders in studio-context.',
    en: 'Creative and design providers in studio context.',
  },
  termGezocht: { nl: 'Gezocht', en: 'Wanted' },
  defGezochtShort: { nl: 'Buurtoproep chip.', en: 'Neighbourhood request chip.' },
  defGezocht: {
    nl: 'Wat je zoekt in de buurt — reacties via voorstellen, geld of ruil.',
    en: 'What you need nearby — responses via proposals, money or barter.',
  },
  lastReviewedLabel: { nl: 'Laatst gecontroleerd', en: 'Last reviewed' },
  lastReviewedDate: { nl: LAST_REVIEWED_NL, en: LAST_REVIEWED_EN },
};

export const OPEN_KNOWLEDGE_SOURCES: Record<string, Record<string, Bi>> = {
  openKnowledgeShared,
  openKnowledgeHub,
  openKnowledgeDocRanking,
  openKnowledgeDocBusinessDna,
  openKnowledgeDocHcp,
  openKnowledgeDocAffiliate,
  openKnowledgeDocCommunityOrders,
  openKnowledgeDocBarter,
  openKnowledgeDocDelivery,
  openKnowledgeDocMarketplace,
  openKnowledgeDocTrustOps,
  openKnowledgeDocPrivacy,
  openKnowledgeDocAi,
  openKnowledgeDocApi,
  openKnowledgeTrust,
  openKnowledgeChangelog,
  openKnowledgeRoadmap,
  openKnowledgePrinciples,
  openKnowledgeAiPublic,
  openKnowledgeGlossary,
};

export { OPEN_KNOWLEDGE_LAST_REVIEWED };
