/**
 * Opportunity-specific share copy + channel formatters.
 * No guaranteed-income claims. Delivery 18+ preserved in delivery messaging where relevant.
 */

import type { OpportunityId } from '@/lib/share/ecosystem-opportunities';

export type ShareLang = 'nl' | 'en';

export type OpportunityShareCopy = {
  title: string;
  shortText: string;
  longText: string;
  /** LinkedIn / professional */
  professionalText: string;
  /** Facebook / community */
  communityText: string;
  /** X — keep short */
  shortPost: string;
  emailSubject: string;
  emailBody: string;
  /** Instagram / TikTok caption (no fake publish) */
  socialCaption: string;
  hashtags: string[];
  ogTitle: string;
  ogDescription: string;
  ogHeadline: string;
  ogSubline: string;
  ecosystem: 'marketplace' | 'studio' | 'growth' | 'ecosystem';
  imageAlt: string;
};

const NL: Record<OpportunityId, OpportunityShareCopy> = {
  hub: {
    title: 'Verdien met HomeCheff',
    shortText:
      'Er zijn verschillende manieren om mee te doen én te verdienen met HomeCheff.',
    longText:
      'Er zijn verschillende manieren om mee te doen én te verdienen met HomeCheff. Verkoop wat je maakt, bezorg in je buurt, promoot het platform of werk mee aan HomeCheff. Bekijk wat bij jou past.',
    professionalText:
      'HomeCheff bouwt aan een lokaal ecosysteem waarin mensen kunnen verkopen, bezorgen, promoten en ondernemen.\n\nBekijk welke mogelijkheid bij jou past.',
    communityText:
      'Ken je iemand die wil verkopen, bezorgen of meebouwen? Deel HomeCheff — er is voor ieder wat wils in het ecosysteem.',
    shortPost: 'Verdien met HomeCheff — verkoop, bezorg, promoot of bouw mee.',
    emailSubject: 'Verdien met HomeCheff',
    emailBody:
      'Er zijn verschillende manieren om mee te doen én te verdienen met HomeCheff. Verkoop wat je maakt, bezorg in je buurt, promoot het platform of werk mee. Bekijk wat bij jou past:',
    socialCaption:
      'Verdien met HomeCheff 🌿 Verkoop, bezorg, promoot of bouw mee. Link in tekst — bekijk wat bij jou past.',
    hashtags: ['HomeCheff', 'Ondernemen', 'Lokaal'],
    ogTitle: 'Verdien met HomeCheff',
    ogDescription:
      'Verkoop, bezorg, promoot HomeCheff of ontdek Studio en Growth. Kies wat bij jou past.',
    ogHeadline: 'Verdien met HomeCheff',
    ogSubline: 'Verkoop · Bezorg · Promoot · Bouw mee',
    ecosystem: 'ecosystem',
    imageAlt: 'HomeCheff ecosysteem — Verdien met HomeCheff',
  },
  seller: {
    title: 'Verkopen & aanbieden',
    shortText: 'Bied lokaal aan via HomeCheff.',
    longText:
      'Maak of doe jij iets waar anderen iets aan hebben? Via HomeCheff kun je lokaal jouw producten of diensten aanbieden. Bekijk hoe je kunt beginnen.',
    professionalText:
      'HomeCheff Marketplace helpt makers en aanbieders lokaal te verkopen.\n\nOntdek hoe je jouw producten of diensten kunt aanbieden.',
    communityText:
      'Heb jij iets wat je buurt kan gebruiken? Op HomeCheff kun je lokaal aanbieden — van eten tot diensten.',
    shortPost: 'Lokaal aanbieden via HomeCheff Marketplace — bekijk hoe je start.',
    emailSubject: 'Aanbieden via HomeCheff',
    emailBody:
      'Maak of doe jij iets waar anderen iets aan hebben? Via HomeCheff kun je lokaal jouw producten of diensten aanbieden. Bekijk hoe je kunt beginnen:',
    socialCaption:
      'Lokaal aanbieden via HomeCheff — producten of diensten. Bekijk hoe je start.',
    hashtags: ['HomeCheff', 'Marketplace', 'Lokaal'],
    ogTitle: 'Verkopen & aanbieden via HomeCheff',
    ogDescription:
      'Bied lokaal producten of diensten aan via HomeCheff Marketplace.',
    ogHeadline: 'Verkopen & aanbieden',
    ogSubline: 'Lokaal via HomeCheff Marketplace',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff Marketplace — verkopen en aanbieden',
  },
  delivery_individual: {
    title: 'Bezorgen',
    shortText: 'Flexibel bezorgen in je omgeving via HomeCheff.',
    longText:
      'Wil je flexibel bezorgen in je eigen omgeving? Bekijk hoe je als zelfstandig bezorger kunt meedoen via HomeCheff. Voor bezorgers geldt een leeftijdsgrens van 18+.',
    professionalText:
      'HomeCheff verbindt lokale bezorgers met opdrachten in de buurt.\n\nOntdek hoe je als zelfstandig bezorger (18+) kunt meedoen.',
    communityText:
      'Op zoek naar flexibel bijverdienen met bezorgen in je buurt? HomeCheff zoekt zelfstandige bezorgers (18+).',
    shortPost: 'Flexibel bezorgen in je buurt via HomeCheff (18+).',
    emailSubject: 'Bezorgen via HomeCheff',
    emailBody:
      'Wil je flexibel bezorgen in je eigen omgeving? Bekijk hoe je als zelfstandig bezorger (18+) kunt meedoen via HomeCheff:',
    socialCaption:
      'Flexibel bezorgen in je buurt via HomeCheff (18+). Bekijk hoe je meedoet.',
    hashtags: ['HomeCheff', 'Bezorgen', 'Lokaal'],
    ogTitle: 'Bezorg in je buurt met HomeCheff',
    ogDescription:
      'Ontdek hoe je als zelfstandig bezorger (18+) kunt meedoen via HomeCheff.',
    ogHeadline: 'Bezorg in je buurt',
    ogSubline: 'Ontdek hoe je kunt meedoen · 18+',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff — bezorgen in je buurt',
  },
  delivery_company: {
    title: 'Bezorgbedrijf',
    shortText: 'Ontvang bezorgopdrachten voor je bedrijf via HomeCheff.',
    longText:
      'Heb je een lokaal bezorgbedrijf? Via HomeCheff kun je bezorgopdrachten ontvangen en je eigen chauffeurs inzetten.',
    professionalText:
      'HomeCheff werkt samen met lokale bezorgbedrijven.\n\nOntvang opdrachten en zet je eigen chauffeurs in.',
    communityText:
      'Lokaal bezorgbedrijf? Via HomeCheff ontvang je opdrachten en werk je met je eigen team.',
    shortPost: 'Lokale bezorgbedrijven: ontvang opdrachten via HomeCheff.',
    emailSubject: 'Bezorgbedrijf bij HomeCheff',
    emailBody:
      'Heb je een lokaal bezorgbedrijf? Via HomeCheff kun je bezorgopdrachten ontvangen en je eigen chauffeurs inzetten:',
    socialCaption:
      'Lokaal bezorgbedrijf? Ontvang opdrachten via HomeCheff met je eigen chauffeurs.',
    hashtags: ['HomeCheff', 'Bezorgbedrijf', 'Lokaal'],
    ogTitle: 'Bezorgbedrijf via HomeCheff',
    ogDescription:
      'Ontvang bezorgopdrachten en zet je eigen chauffeurs in via HomeCheff.',
    ogHeadline: 'Bezorgbedrijf',
    ogSubline: 'Opdrachten voor jouw lokale team',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff — bezorgbedrijf',
  },
  affiliate: {
    title: 'Affiliate',
    shortText: 'Deel HomeCheff en verdien mee wanneer jouw netwerk actief wordt.',
    longText:
      'Ken jij mensen die bij HomeCheff passen? Deel HomeCheff en verdien mee wanneer jouw netwerk actief wordt binnen het ecosysteem. Geen gegarandeerd inkomen.',
    professionalText:
      'Word HomeCheff-affiliate: deel kansen in je netwerk en verdien mee aan eligible platformomzet.\n\nGeen gegarandeerd inkomen — verdiensten hangen af van activiteit.',
    communityText:
      'Ken je makers, bezorgers of ondernemers? Deel HomeCheff en verdien mee als zij actief worden — zonder inkomensgarantie.',
    shortPost: 'Deel HomeCheff als affiliate — verdien mee (geen garantie).',
    emailSubject: 'HomeCheff affiliate',
    emailBody:
      'Ken jij mensen die bij HomeCheff passen? Deel HomeCheff en verdien mee wanneer jouw netwerk actief wordt. Geen gegarandeerd inkomen:',
    socialCaption:
      'Deel HomeCheff als affiliate. Verdien mee wanneer je netwerk actief wordt — geen inkomensgarantie.',
    hashtags: ['HomeCheff', 'Affiliate', 'Ondernemen'],
    ogTitle: 'Promoot HomeCheff. Verdien mee.',
    ogDescription:
      'Deel HomeCheff in je netwerk. Geen gegarandeerd inkomen — wel eligible platformomzet.',
    ogHeadline: 'Promoot HomeCheff. Verdien mee.',
    ogSubline: 'Geen gegarandeerd inkomen',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff affiliate',
  },
  affiliate_company: {
    title: 'Marketingpartner',
    shortText: 'Bouw mee als zakelijke marketing- of acquisitiepartner.',
    longText:
      'Werk je in sales, marketing of acquisitie? Ontdek hoe je als zakelijke partner kunt meebouwen aan de groei van HomeCheff.',
    professionalText:
      'HomeCheff zoekt marketing- en acquisitiepartners.\n\nOntdek hoe jouw bedrijf kan meebouwen aan de groei van het ecosysteem.',
    communityText:
      'Sales- of marketingbureau? Word marketingpartner van HomeCheff en bouw mee aan lokale groei.',
    shortPost: 'Marketingpartner van HomeCheff — acquisitie & groei.',
    emailSubject: 'HomeCheff marketingpartner',
    emailBody:
      'Werk je in sales, marketing of acquisitie? Ontdek hoe je als zakelijke partner kunt meebouwen aan de groei van HomeCheff:',
    socialCaption:
      'Sales of marketing? Word HomeCheff-marketingpartner en bouw mee aan groei.',
    hashtags: ['HomeCheff', 'Marketing', 'Partnership'],
    ogTitle: 'Marketingpartner van HomeCheff',
    ogDescription:
      'Ontdek hoe je als zakelijke partner meebouwt aan de groei van HomeCheff.',
    ogHeadline: 'Marketingpartner',
    ogSubline: 'Sales · Marketing · Acquisitie',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff marketingpartner',
  },
  studio: {
    title: 'HomeCheff Studio',
    shortText: 'Maak content met HomeCheff Studio.',
    longText:
      'Maak content voor je product, bedrijf of idee met HomeCheff Studio. Ontdek de creatieve mogelijkheden van het HomeCheff-ecosysteem.',
    professionalText:
      'HomeCheff Studio helpt je content te maken voor product, bedrijf of idee.\n\nOntdek de creatieve tools in het HomeCheff-ecosysteem.',
    communityText:
      'Creators opgelet: maak content met HomeCheff Studio — onderdeel van het HomeCheff-ecosysteem.',
    shortPost: 'Maak. Creëer. Deel. — HomeCheff Studio.',
    emailSubject: 'HomeCheff Studio',
    emailBody:
      'Maak content voor je product, bedrijf of idee met HomeCheff Studio. Ontdek de creatieve mogelijkheden:',
    socialCaption:
      'Maak. Creëer. Deel. — HomeCheff Studio voor content in het ecosysteem.',
    hashtags: ['HomeCheff', 'Studio', 'Creators'],
    ogTitle: 'HomeCheff Studio — Maak. Creëer. Deel.',
    ogDescription:
      'Maak content voor je product, bedrijf of idee met HomeCheff Studio.',
    ogHeadline: 'HomeCheff Studio',
    ogSubline: 'Maak. Creëer. Deel.',
    ecosystem: 'studio',
    imageAlt: 'HomeCheff Studio',
  },
  growth: {
    title: 'HomeCheff Growth',
    shortText: 'Vind zakelijke leads met HomeCheff Growth.',
    longText:
      'Op zoek naar zakelijke kansen? HomeCheff Growth helpt professionals en bedrijven met leadgeneratie — een eigen product naast de Marketplace.',
    professionalText:
      'HomeCheff Growth is het leadgeneratie-product van het HomeCheff-ecosysteem.\n\nOntdek hoe Growth zakelijke kansen ontsluit (niet de Marketplace).',
    communityText:
      'Zakelijke leads nodig? Ontdek HomeCheff Growth — leadgeneratie binnen het ecosysteem.',
    shortPost: 'HomeCheff Growth — zakelijke leadgeneratie.',
    emailSubject: 'HomeCheff Growth',
    emailBody:
      'Ontdek HomeCheff Growth voor zakelijke leadgeneratie — een eigen product in het HomeCheff-ecosysteem:',
    socialCaption:
      'HomeCheff Growth: zakelijke leadgeneratie in het ecosysteem (niet Marketplace).',
    hashtags: ['HomeCheff', 'Growth', 'Leads'],
    ogTitle: 'HomeCheff Growth — zakelijke leads',
    ogDescription:
      'Leadgeneratie voor professionals en bedrijven. HomeCheff Growth — niet de Marketplace.',
    ogHeadline: 'HomeCheff Growth',
    ogSubline: 'Zakelijke leadgeneratie',
    ecosystem: 'growth',
    imageAlt: 'HomeCheff Growth',
  },
  jobs: {
    title: 'Werken bij HomeCheff',
    shortText: 'Echte vacatures om mee te bouwen aan HomeCheff.',
    longText:
      'Wil je niet alleen HomeCheff gebruiken, maar eraan meebouwen? Bekijk de mogelijkheden om met HomeCheff samen te werken.',
    professionalText:
      'HomeCheff zoekt mensen die het ecosysteem willen meebouwen.\n\nBekijk echte interne vacatures en stages — geen nepvacatures.',
    communityText:
      'Wil je meebouwen aan HomeCheff zelf? Bekijk echte vacatures — niet te verwarren met verkoper, bezorger of affiliate.',
    shortPost: 'Echte vacatures bij HomeCheff — bouw mee aan het ecosysteem.',
    emailSubject: 'Vacatures bij HomeCheff',
    emailBody:
      'Wil je niet alleen HomeCheff gebruiken, maar eraan meebouwen? Bekijk de mogelijkheden:',
    socialCaption:
      'Bouw mee aan HomeCheff — bekijk echte vacatures en stages.',
    hashtags: ['HomeCheff', 'Vacatures', 'Werken'],
    ogTitle: 'Werken bij HomeCheff',
    ogDescription:
      'Echte interne vacatures en stages bij HomeCheff — bouw mee aan het ecosysteem.',
    ogHeadline: 'Werken bij HomeCheff',
    ogSubline: 'Echte vacatures · bouw mee',
    ecosystem: 'ecosystem',
    imageAlt: 'HomeCheff vacatures',
  },
};

const EN: Record<OpportunityId, OpportunityShareCopy> = {
  hub: {
    title: 'Earn with HomeCheff',
    shortText: 'There are several ways to take part and earn with HomeCheff.',
    longText:
      'There are several ways to take part and earn with HomeCheff. Sell what you make, deliver nearby, promote the platform, or help build HomeCheff. See what fits you.',
    professionalText:
      'HomeCheff is building a local ecosystem where people can sell, deliver, promote, and build.\n\nSee which opportunity fits you.',
    communityText:
      'Know someone who wants to sell, deliver, or build? Share HomeCheff — there is something for everyone in the ecosystem.',
    shortPost: 'Earn with HomeCheff — sell, deliver, promote, or build.',
    emailSubject: 'Earn with HomeCheff',
    emailBody:
      'There are several ways to take part and earn with HomeCheff. Sell, deliver, promote, or join. See what fits you:',
    socialCaption:
      'Earn with HomeCheff — sell, deliver, promote, or build. Link in text.',
    hashtags: ['HomeCheff', 'LocalBusiness', 'Earn'],
    ogTitle: 'Earn with HomeCheff',
    ogDescription:
      'Sell, deliver, promote HomeCheff, or explore Studio and Growth.',
    ogHeadline: 'Earn with HomeCheff',
    ogSubline: 'Sell · Deliver · Promote · Build',
    ecosystem: 'ecosystem',
    imageAlt: 'HomeCheff ecosystem — Earn with HomeCheff',
  },
  seller: {
    title: 'Sell & offer',
    shortText: 'Offer locally via HomeCheff.',
    longText:
      'Do you make or do something others value? Offer your products or services locally via HomeCheff. See how to start.',
    professionalText:
      'HomeCheff Marketplace helps makers offer locally.\n\nDiscover how to list your products or services.',
    communityText:
      'Have something your neighbourhood needs? Offer it locally on HomeCheff.',
    shortPost: 'Offer locally on HomeCheff Marketplace — see how to start.',
    emailSubject: 'Offer via HomeCheff',
    emailBody:
      'Do you make or do something others value? Offer locally via HomeCheff:',
    socialCaption: 'Offer locally via HomeCheff Marketplace. See how to start.',
    hashtags: ['HomeCheff', 'Marketplace', 'Local'],
    ogTitle: 'Sell & offer on HomeCheff',
    ogDescription: 'Offer products or services locally via HomeCheff Marketplace.',
    ogHeadline: 'Sell & offer',
    ogSubline: 'Local via HomeCheff Marketplace',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff Marketplace — sell and offer',
  },
  delivery_individual: {
    title: 'Deliver',
    shortText: 'Flexible local deliveries via HomeCheff.',
    longText:
      'Want flexible deliveries in your area? See how to join as an independent courier via HomeCheff. Couriers must be 18+.',
    professionalText:
      'HomeCheff connects local couriers with nearby jobs.\n\nSee how to join as an independent courier (18+).',
    communityText:
      'Looking for flexible delivery work nearby? HomeCheff needs independent couriers (18+).',
    shortPost: 'Flexible local deliveries via HomeCheff (18+).',
    emailSubject: 'Deliver with HomeCheff',
    emailBody:
      'Want flexible deliveries nearby? See how to join as an independent courier (18+) via HomeCheff:',
    socialCaption: 'Flexible local deliveries via HomeCheff (18+).',
    hashtags: ['HomeCheff', 'Delivery', 'Local'],
    ogTitle: 'Deliver nearby with HomeCheff',
    ogDescription: 'Join as an independent courier (18+) via HomeCheff.',
    ogHeadline: 'Deliver nearby',
    ogSubline: 'See how to join · 18+',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff — local delivery',
  },
  delivery_company: {
    title: 'Delivery company',
    shortText: 'Receive delivery jobs for your company via HomeCheff.',
    longText:
      'Run a local delivery company? Receive jobs via HomeCheff and use your own drivers.',
    professionalText:
      'HomeCheff partners with local delivery companies.\n\nReceive jobs and deploy your own drivers.',
    communityText:
      'Local delivery company? Get jobs via HomeCheff with your own team.',
    shortPost: 'Local delivery companies: receive jobs via HomeCheff.',
    emailSubject: 'Delivery company on HomeCheff',
    emailBody:
      'Run a local delivery company? Receive jobs via HomeCheff and use your own drivers:',
    socialCaption:
      'Local delivery company? Receive jobs via HomeCheff with your own drivers.',
    hashtags: ['HomeCheff', 'Delivery', 'Business'],
    ogTitle: 'Delivery company via HomeCheff',
    ogDescription: 'Receive delivery jobs and use your own drivers via HomeCheff.',
    ogHeadline: 'Delivery company',
    ogSubline: 'Jobs for your local team',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff — delivery company',
  },
  affiliate: {
    title: 'Affiliate',
    shortText: 'Share HomeCheff and earn when your network becomes active.',
    longText:
      'Know people who fit HomeCheff? Share HomeCheff and earn when your network becomes active in the ecosystem. No guaranteed income.',
    professionalText:
      'Become a HomeCheff affiliate: share opportunities and earn from eligible platform revenue.\n\nNo guaranteed income — earnings depend on activity.',
    communityText:
      'Know makers, couriers, or founders? Share HomeCheff and earn when they become active — no income guarantee.',
    shortPost: 'Share HomeCheff as an affiliate — earn when they activate (no guarantee).',
    emailSubject: 'HomeCheff affiliate',
    emailBody:
      'Know people who fit HomeCheff? Share and earn when your network becomes active. No guaranteed income:',
    socialCaption:
      'Share HomeCheff as an affiliate. Earn when your network activates — no income guarantee.',
    hashtags: ['HomeCheff', 'Affiliate', 'Earn'],
    ogTitle: 'Promote HomeCheff. Earn with it.',
    ogDescription:
      'Share HomeCheff in your network. No guaranteed income — eligible platform revenue only.',
    ogHeadline: 'Promote HomeCheff. Earn with it.',
    ogSubline: 'No guaranteed income',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff affiliate',
  },
  affiliate_company: {
    title: 'Marketing partner',
    shortText: 'Grow with HomeCheff as a business marketing partner.',
    longText:
      'Work in sales, marketing, or acquisition? Discover how to grow HomeCheff as a business partner.',
    professionalText:
      'HomeCheff seeks marketing and acquisition partners.\n\nSee how your company can help grow the ecosystem.',
    communityText:
      'Sales or marketing agency? Become a HomeCheff marketing partner.',
    shortPost: 'HomeCheff marketing partner — acquisition & growth.',
    emailSubject: 'HomeCheff marketing partner',
    emailBody:
      'Work in sales, marketing, or acquisition? Discover how to partner with HomeCheff:',
    socialCaption:
      'Sales or marketing? Become a HomeCheff marketing partner.',
    hashtags: ['HomeCheff', 'Marketing', 'Partnership'],
    ogTitle: 'HomeCheff marketing partner',
    ogDescription: 'Grow HomeCheff as a business sales and marketing partner.',
    ogHeadline: 'Marketing partner',
    ogSubline: 'Sales · Marketing · Acquisition',
    ecosystem: 'marketplace',
    imageAlt: 'HomeCheff marketing partner',
  },
  studio: {
    title: 'HomeCheff Studio',
    shortText: 'Create content with HomeCheff Studio.',
    longText:
      'Create content for your product, business, or idea with HomeCheff Studio. Explore creative tools in the HomeCheff ecosystem.',
    professionalText:
      'HomeCheff Studio helps you create content for products, businesses, and ideas.\n\nExplore creative tools in the ecosystem.',
    communityText:
      'Creators: make content with HomeCheff Studio — part of the HomeCheff ecosystem.',
    shortPost: 'Make. Create. Share. — HomeCheff Studio.',
    emailSubject: 'HomeCheff Studio',
    emailBody:
      'Create content for your product, business, or idea with HomeCheff Studio:',
    socialCaption: 'Make. Create. Share. — HomeCheff Studio.',
    hashtags: ['HomeCheff', 'Studio', 'Creators'],
    ogTitle: 'HomeCheff Studio — Make. Create. Share.',
    ogDescription: 'Create content with HomeCheff Studio in the ecosystem.',
    ogHeadline: 'HomeCheff Studio',
    ogSubline: 'Make. Create. Share.',
    ecosystem: 'studio',
    imageAlt: 'HomeCheff Studio',
  },
  growth: {
    title: 'HomeCheff Growth',
    shortText: 'Find business leads with HomeCheff Growth.',
    longText:
      'Looking for business opportunities? HomeCheff Growth helps professionals and companies with lead generation — a distinct product alongside Marketplace.',
    professionalText:
      'HomeCheff Growth is the lead-generation product in the HomeCheff ecosystem.\n\nDiscover how Growth unlocks business opportunities (not Marketplace).',
    communityText:
      'Need business leads? Explore HomeCheff Growth — lead generation in the ecosystem.',
    shortPost: 'HomeCheff Growth — business lead generation.',
    emailSubject: 'HomeCheff Growth',
    emailBody:
      'Explore HomeCheff Growth for business lead generation — a distinct product in the ecosystem:',
    socialCaption:
      'HomeCheff Growth: business lead generation (not Marketplace).',
    hashtags: ['HomeCheff', 'Growth', 'Leads'],
    ogTitle: 'HomeCheff Growth — business leads',
    ogDescription:
      'Lead generation for professionals and companies. HomeCheff Growth — not Marketplace.',
    ogHeadline: 'HomeCheff Growth',
    ogSubline: 'Business lead generation',
    ecosystem: 'growth',
    imageAlt: 'HomeCheff Growth',
  },
  jobs: {
    title: 'Work at HomeCheff',
    shortText: 'Real jobs to help build HomeCheff.',
    longText:
      'Want to help build HomeCheff, not only use it? See how you can work with HomeCheff.',
    professionalText:
      'HomeCheff is hiring people to help build the ecosystem.\n\nSee real internal roles and internships — no fake listings.',
    communityText:
      'Want to build HomeCheff itself? See real vacancies — not seller, courier, or affiliate roles.',
    shortPost: 'Real HomeCheff jobs — help build the ecosystem.',
    emailSubject: 'HomeCheff careers',
    emailBody:
      'Want to help build HomeCheff, not only use it? See open roles:',
    socialCaption: 'Help build HomeCheff — see real jobs and internships.',
    hashtags: ['HomeCheff', 'Jobs', 'Careers'],
    ogTitle: 'Work at HomeCheff',
    ogDescription:
      'Real internal roles and internships at HomeCheff — help build the ecosystem.',
    ogHeadline: 'Work at HomeCheff',
    ogSubline: 'Real jobs · help build',
    ecosystem: 'ecosystem',
    imageAlt: 'HomeCheff careers',
  },
};

export function getOpportunityShareCopy(
  id: OpportunityId,
  lang: ShareLang = 'nl',
): OpportunityShareCopy {
  return (lang === 'en' ? EN : NL)[id];
}

export function formatHashtagLine(tags: string[]): string {
  return tags
    .slice(0, 3)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ');
}
