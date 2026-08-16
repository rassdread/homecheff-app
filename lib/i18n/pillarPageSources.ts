/**
 * Phase 13Q — Pillar page i18n (merged via translations.ts).
 */

import type { Bi } from '@/lib/i18n/seoLandingSources';
import { CANONICAL_ENTITY_DESCRIPTION } from '@/lib/seo/entity-philosophy';

export const pillarSharedFaq: Record<string, Bi> = {
  faqBlockTitle: { nl: 'Veelgestelde vragen', en: 'Frequently asked questions' },
  faq1Q: {
    nl: 'Is HomeCheff alleen voor eten?',
    en: 'Is HomeCheff only for food?',
  },
  faq1A: {
    nl: 'Nee. Eten is één categorie naast tuin, creaties, diensten, hulp, inspiratie en ruil. HomeCheff is de digitale buurtmarkt voor persoonlijk vakmanschap — niet een bezorgapp, niet alleen een food marketplace.',
    en: 'No. Food is one category alongside garden, creations, services, help, inspiration and barter. HomeCheff is the digital neighbourhood marketplace for personal craftsmanship — not a delivery app, not a food marketplace only.',
  },
  faq2Q: {
    nl: 'Wie staat achter een aanbod?',
    en: 'Who is behind a listing?',
  },
  faq2A: {
    nl: 'Altijd een echt persoon of lokaal bedrijf met een profiel. Je ziet wie kookt, kweekt, ontwerpt of helpt — niet een anonieme catalogus.',
    en: 'Always a real person or local business with a profile. You see who cooks, grows, designs or helps — not an anonymous catalogue.',
  },
  faq3Q: {
    nl: 'Belooft HomeCheff gegarandeerd inkomen?',
    en: 'Does HomeCheff guarantee income?',
  },
  faq3A: {
    nl: 'Nee. Je kunt lokaal verdienen met eerlijke tools en transparante fees, maar resultaat hangt af van je aanbod, regio en inzet. Geen valse beloftes.',
    en: 'No. You can earn locally with honest tools and transparent fees, but results depend on your offer, area and effort. No false promises.',
  },
  linkPlatform: { nl: 'Wat is HomeCheff?', en: 'What is HomeCheff?' },
  linkCraft: { nl: 'Persoonlijk vakmanschap', en: 'Personal craftsmanship' },
  linkMaker: { nl: 'Ontmoet de maker', en: 'Meet the maker' },
  linkEarn: { nl: 'Lokaal verdienen', en: 'Earn locally' },
  linkHelp: { nl: 'Buurthulp', en: 'Neighbour help' },
  linkEconomy: { nl: 'Buurt economie', en: 'Community economy' },
  linkNotMass: { nl: 'Wat we niet zijn', en: 'What we are not' },
  linkEcosystem: { nl: 'Hoe HomeCheff werkt', en: 'How HomeCheff works' },
  linkCompare: { nl: 'Platformvergelijkingen', en: 'Platform comparisons' },
  linkManifest: { nl: 'HomeCheff Manifest', en: 'HomeCheff Manifest' },
  linkAbout: { nl: 'Over ons', en: 'About us' },
  linkFaq: { nl: 'FAQ', en: 'FAQ' },
  linkFounder: { nl: 'Wie is Sergio Arrias?', en: 'Who is Sergio Arrias?' },
  linkOrigin: { nl: 'Oorsprong HomeCheff', en: 'Origin of HomeCheff' },
  linkWhyName: { nl: 'Waarom HomeCheff?', en: 'Why HomeCheff?' },
};

const platformDefinitionPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Wat is HomeCheff? | Digitale buurtmarkt · lokaal vakmanschap',
    en: 'What is HomeCheff? | Digital neighbourhood marketplace',
  },
  metaDescription: {
    nl: CANONICAL_ENTITY_DESCRIPTION.nl,
    en: CANONICAL_ENTITY_DESCRIPTION.en,
  },
  title: {
    nl: 'Wat is HomeCheff?',
    en: 'What is HomeCheff?',
  },
  intro: {
    nl: `${CANONICAL_ENTITY_DESCRIPTION.nl} Afstand bepaalt prioriteit, niet mogelijkheid. Local-first, niet alleen-lokaal. Niet een generieke classifieds-site. Niet een traditionele tweedehands-marktplaats. Niet een bezorgketen. Niet mass retail.`,
    en: `${CANONICAL_ENTITY_DESCRIPTION.en} Distance determines priority, not possibility. Local-first, not local-only. Not a generic classifieds site. Not a traditional second-hand marketplace. Not a delivery chain. Not mass retail.`,
  },
  sectionWhoTitle: { nl: 'Voor wie is HomeCheff?', en: 'Who is HomeCheff for?' },
  sectionWhoBody: {
    nl: 'Voor makers, buren, vakmensen en kleine ondernemers die iets persoonlijks willen delen — en voor mensen die lokaal willen ontdekken, afspreken, ruilen of veilig betalen. Praktisch: begin met één duidelijk aanbod of één Gezocht-oproep in je buurt. Of je nu kookt, kweekt, repareert, lesgeeft of helpt: dichtbij eerst; uniek vakmanschap mag van nature verder reiken.',
    en: 'For makers, neighbours, craftspeople and small entrepreneurs who want to share something personal — and for people who want to discover, arrange, barter or pay safely nearby. Practically: start with one clear offer or one Wanted request in your neighbourhood. Whether you cook, grow, repair, teach or help: nearby first; unique craft may naturally reach further.',
  },
  sectionPersonTitle: { nl: 'De persoon achter het aanbod', en: 'The person behind the offer' },
  sectionPersonBody: {
    nl: 'Op HomeCheff telt wie iets maakt minstens zo zwaar als wat er wordt aangeboden. Profielen, verhalen, reviews en vertrouwen maken zichtbaar dat achter elk item een mens zit — geen anonieme massaproductie of anonieme doorverkoop.',
    en: 'On HomeCheff, who makes something matters at least as much as what is offered. Profiles, stories, reviews and trust show that a human is behind every item — not anonymous mass production or anonymous resale.',
  },
  sectionCategoriesTitle: { nl: 'Mensen creëren waarde', en: 'People create value' },
  sectionCategoriesBody: {
    nl: 'Thuisgekookt, eigen oogst, handwerk, creatief werk, persoonlijke diensten, lokale expertise, reparaties, kennis, buurthulp en ruil horen bij dezelfde digitale buurtmarkt. Eten is één categorie. Mensen creëren waarde — ze verkopen geen anonieme massaproducten door.',
    en: 'Homemade meals, self-grown produce, handmade creations, creative work, personal services, local expertise, repairs, knowledge, neighbourhood help and barter belong on the same digital neighbourhood marketplace. Food is one category. People create value — they do not resell anonymous mass products.',
  },
  sectionNotTitle: { nl: 'Wat HomeCheff niet is', en: 'What HomeCheff is not' },
  sectionNotBody: {
    nl: 'Geen generieke advertentiesite, geen traditionele tweedehands-marktplaats, geen mass retail, geen bezorgplatform, geen anonieme webshop, niet alleen-lokaal, geen “internationale marktplaats”-positionering. Tweedehands hoort alleen bij echte creatieve of ambachtelijke transformatie (upcycling, artistiek herstel, herontwerp). Start lokaal, groei natuurlijk.',
    en: 'Not a generic classifieds website, not a traditional second-hand marketplace, not mass retail, not a delivery platform, not an anonymous ecommerce site, not local-only, not positioned as an “international marketplace”. Second-hand belongs only with true creative or craft transformation (upcycling, artistic restore, redesign). Start locally, grow naturally.',
  },
  ctaPrimary: { nl: 'Ontdek makers in je buurt', en: 'Discover makers nearby' },
  ctaSecondary: { nl: 'Begin met aanbieden', en: 'Start offering' },
  cta: { nl: 'Klaar om HomeCheff te ontdekken?', en: 'Ready to discover HomeCheff?' },
  ctaSub: {
    nl: 'Ontdek wat mensen in jouw buurt maken — of deel wat jij zelf te bieden hebt.',
    en: 'Discover what people make near you — or share what you have to offer.',
  },
};

const earnLocallyPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Lokaal verdienen | Eerlijk bijverdienen vanuit huis | HomeCheff',
    en: 'Earn locally | Honest side income from home | HomeCheff',
  },
  metaDescription: {
    nl: 'Verdien lokaal met wat je zelf maakt, kookt of aanbiedt. Transparante fees, geen valse beloftes. Eten, tuin, creaties of diensten — start klein in je buurt.',
    en: 'Earn locally with what you make, cook or offer yourself. Transparent fees, no false promises. Food, garden, creations or services — start small in your neighbourhood.',
  },
  title: { nl: 'Lokaal verdienen met wat jij kunt', en: 'Earn locally with what you can do' },
  intro: {
    nl: 'Deze gids legt uit hoe je lokaal kunt verdienen met wat je zelf maakt of aanbiedt — zonder dropshipping of valse inkomensbeloftes. Je leest welke paden bestaan, hoe fees werken, en hoe je klein start in je buurt.',
    en: 'This guide explains how to earn locally with what you make or offer yourself — without dropshipping or false income promises. You will learn which paths exist, how fees work, and how to start small in your neighbourhood.',
  },
  sectionHonestTitle: { nl: 'Eerlijk over verwachtingen', en: 'Honest about expectations' },
  sectionHonestBody: {
    nl: 'We beloven geen vast inkomen. Wel: een duidelijke plek om lokaal zichtbaar te zijn, veilig af te rekenen waar je wilt, en fees die je vooraf kunt begrijpen. Particulieren betalen alleen transactiekosten; zakelijke abonnementen verlagen die kosten.',
    en: 'We do not promise fixed income. We do offer: a clear place to be visible locally, secure checkout when you want it, and fees you can understand upfront. Individuals pay transaction costs only; business subscriptions lower those costs.',
  },
  sectionPathsTitle: { nl: 'Wat kun je aanbieden?', en: 'What can you offer?' },
  sectionPathsBody: {
    nl: 'Thuisgemaakte maaltijden, tuinoogst, handwerk, praktische hulp, workshops, bezorgen als koerier — of ruilen en directe afspraken. Kies wat bij jou past; de persoon achter het aanbod blijft centraal.',
    en: 'Home-prepared meals, garden harvest, handmade work, practical help, workshops, delivery as a courier — or barter and direct arrangements. Choose what fits you; the person behind the offer stays central.',
  },
  sectionFeesTitle: { nl: 'Fees en uitbetaling', en: 'Fees and payouts' },
  sectionFeesBody: {
    nl: 'Particulieren: 12% platformfee op betaalde checkout (betaalkosten voor de koper). Zakelijke plannen: 9%, 7% of 5% plus maandabonnement. Uitbetaling via Stripe Connect wanneer je checkout gebruikt. Geen verborgen discovery-beloftes.',
    en: 'Individuals: 12% platform fee on paid checkout (payment/transaction fees for the buyer). Business plans: 9%, 7% or 5% plus monthly subscription. Payouts via Stripe Connect when you use checkout. No hidden discovery promises.',
  },
  sectionStepsTitle: { nl: 'Zo begin je', en: 'How to start' },
  step1: { nl: 'Maak een account en profiel aan.', en: 'Create an account and profile.' },
  step2: { nl: 'Kies je categorie: keuken, tuin, studio of dienst.', en: 'Pick your category: kitchen, garden, studio or service.' },
  step3: { nl: 'Plaats een helder aanbod met eerlijke foto’s.', en: 'Publish a clear listing with honest photos.' },
  step4: { nl: 'Koppel Stripe voor checkout-uitbetalingen.', en: 'Connect Stripe for checkout payouts.' },
  step5: { nl: 'Bouw vertrouwen op met reviews en herhaalde buren.', en: 'Build trust with reviews and repeat neighbours.' },
  ctaSell: { nl: 'Naar aanbieden', en: 'Start offering' },
  linkBijverdienen: { nl: 'Bijverdienen vanuit huis', en: 'Side income from home' },
  linkDelivery: { nl: 'Bezorger worden', en: 'Become a courier' },
  ctaPrimary: { nl: 'Begin met aanbieden', en: 'Start offering' },
  ctaSecondary: { nl: 'Bekijk het dorpsplein', en: 'Browse the village square' },
  cta: { nl: 'Start lokaal — op jouw tempo', en: 'Start locally — at your pace' },
  ctaSub: {
    nl: 'Geen valse beloftes. Wel een buurt die je vakmanschap serieus neemt.',
    en: 'No false promises. A neighbourhood that takes your craft seriously.',
  },
};

const meetTheMakerPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Ontmoet de maker | Het gezicht achter het aanbod | HomeCheff',
    en: 'Meet the maker | The face behind the offer | HomeCheff',
  },
  metaDescription: {
    nl: 'Op HomeCheff zie je wie kookt, kweekt, ontwerpt of helpt. Profielen, verhalen en vertrouwen — de persoon is belangrijker dan het product.',
    en: 'On HomeCheff you see who cooks, grows, designs or helps. Profiles, stories and trust — the person matters more than the product.',
  },
  title: { nl: 'Ontmoet de maker', en: 'Meet the maker' },
  intro: {
    nl: 'Elk aanbod op HomeCheff heeft een gezicht. Je ontdekt niet alleen wat er te koop is, maar wie het maakt — met profiel, locatie, verhaal en reputatie.',
    en: 'Every listing on HomeCheff has a face. You discover not only what is for sale, but who made it — with profile, location, story and reputation.',
  },
  sectionWhyTitle: { nl: 'Waarom de maker centraal staat', en: 'Why the maker is central' },
  sectionWhyBody: {
    nl: 'Lokaal vakmanschap draait om vertrouwen. Je wilt weten wie in de keuken staat, wie in de tuin werkt of wie je kast repareert. HomeCheff is gebouwd rond die menselijke relatie — niet rond anonieme volume.',
    en: 'Local craft is about trust. You want to know who is in the kitchen, who works the garden or who repairs your cupboard. HomeCheff is built around that human relationship — not anonymous volume.',
  },
  sectionProfileTitle: { nl: 'Profielen met context', en: 'Profiles with context' },
  sectionProfileBody: {
    nl: 'Elke maker heeft een publiek profiel met bio, locatie, badges, reviews en aanbod. Zo wordt een profiel het digitale atelier, de keuken of de werkplaats — niet alleen een productlijst.',
    en: 'Each maker has a public profile with bio, location, badges, reviews and listings. A profile becomes the digital studio, kitchen or workshop — not only a product list.',
  },
  sectionTrustTitle: { nl: 'Vertrouwen in de buurt', en: 'Trust nearby' },
  sectionTrustBody: {
    nl: 'Reviews, voltooide deals en HCP-reputatie helpen je kiezen. Geen nep-ratings: alleen echte ervaringen van buren die daadwerkelijk hebben afgesproken of besteld.',
    en: 'Reviews, completed deals and HCP reputation help you choose. No fake ratings: only real experiences from neighbours who actually met or ordered.',
  },
  ctaDiscover: { nl: 'Ontdek makers', en: 'Discover makers' },
  linkKitchen: { nl: 'Keuken-ecosysteem', en: 'Kitchen ecosystem' },
  linkGarden: { nl: 'Tuin-ecosysteem', en: 'Garden ecosystem' },
  linkStudio: { nl: 'Studio-ecosysteem', en: 'Studio ecosystem' },
  ctaPrimary: { nl: 'Naar het dorpsplein', en: 'To the village square' },
  ctaSecondary: { nl: 'Over HomeCheff', en: 'About HomeCheff' },
  cta: { nl: 'Ontmoet makers in je buurt', en: 'Meet makers in your neighbourhood' },
  ctaSub: {
    nl: 'Profielen, verhalen en vertrouwen — de persoon telt.',
    en: 'Profiles, stories and trust — the person matters.',
  },
};

const personalCraftPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Persoonlijk vakmanschap | Lokaal handwerk en menselijk maakwerk | HomeCheff',
    en: 'Personal craftsmanship | Local craft and human-made work | HomeCheff',
  },
  metaDescription: {
    nl: 'Vakmanschap is meer dan kunst: koken, tuinieren, repareren, lesgeven en ontwerpen. HomeCheff verbindt persoonlijk maakwerk met je buurt.',
    en: 'Craft is more than art: cooking, gardening, repairing, teaching and designing. HomeCheff connects personal making with your neighbourhood.',
  },
  title: { nl: 'Persoonlijk vakmanschap', en: 'Personal craftsmanship' },
  intro: {
    nl: 'Vakmanschap is wat mensen met eigen handen, hoofd en hart maken — thuis, in de tuin, in het atelier of op straat. Deze pagina helpt je herkennen wat telt als persoonlijk maakwerk op HomeCheff, welke vormen passen, en waarom herkomst en verhaal ertoe doen.',
    en: 'Craft is what people make with their own hands, mind and heart — at home, in the garden, in the studio or on the street. This page helps you recognise what counts as personal making on HomeCheff, which forms fit, and why origin and story matter.',
  },
  sectionCraftTitle: { nl: 'Wat telt als vakmanschap?', en: 'What counts as craftsmanship?' },
  sectionCraftBody: {
    nl: 'Koken voor buren, oogst delen, meubels maken, sieraden ontwerpen, klusjes doen, workshops geven, coaching — alles wat een echt persoon persoonlijk levert telt mee. Niet: dropshipping, gewone tweedehands-doorverkoop of anonieme fabrieksvoorraad. Upcycling, artistiek herstel en creatief herontwerp horen wel — de waarde zit in eigen werk.',
    en: 'Cooking for neighbours, sharing harvest, making furniture, designing jewellery, chores, workshops, coaching — anything a real person delivers personally counts. Not: dropshipping, ordinary second-hand resale or anonymous factory stock. Upcycling, artistic restoration and creative redesign do belong — value comes from personal work.',
  },
  sectionFormsTitle: { nl: 'Vormen van vakmanschap op HomeCheff', en: 'Forms of craft on HomeCheff' },
  sectionFormsBody: {
    nl: 'Keuken (thuisgemaakt eten), tuin (oogst en planten), studio (creaties), praktische diensten (reparatie, klusjes), kennis (lessen en coaching) en buurthulp via Gezocht.',
    en: 'Kitchen (home-prepared food), garden (harvest and plants), studio (creations), practical services (repair, chores), knowledge (lessons and coaching) and neighbour help via Wanted.',
  },
  sectionStoryTitle: { nl: 'Verhaal en herkomst', en: 'Story and origin' },
  sectionStoryBody: {
    nl: 'Inspiratie, recepten en maker-profielen laten zien hoe iets ontstaat. Zo blijft het persoonlijk — niet een generieke catalogus zonder gezicht.',
    en: 'Inspiration, recipes and maker profiles show how something is made. That keeps it personal — not a generic catalogue without a face.',
  },
  ctaPrimary: { nl: 'Ontdek lokaal vakmanschap', en: 'Discover local craft' },
  ctaSecondary: { nl: 'Wat is HomeCheff?', en: 'What is HomeCheff?' },
  cta: { nl: 'Vakmanschap verdient een gezicht', en: 'Craft deserves a face' },
  ctaSub: {
    nl: 'Ontdek wat mensen persoonlijk maken in jouw regio.',
    en: 'Discover what people personally make in your area.',
  },
};

const neighbourHelpPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Buurthulp en lokale diensten | Vraag en bied hulp in de buurt | HomeCheff',
    en: 'Neighbour help and local services | Ask and offer help nearby | HomeCheff',
  },
  metaDescription: {
    nl: 'Plaats een oproep in Gezocht, vind praktische hulp of bied je vaardigheden aan. Buurthulp zonder anonieme gig-economy.',
    en: 'Post a request in Wanted, find practical help or offer your skills. Neighbour help without an anonymous gig economy.',
  },
  title: { nl: 'Buurthulp en lokale diensten', en: 'Neighbour help and local services' },
  intro: {
    nl: 'Soms heb je hulp nodig — of wil je iemand om de hoek ondersteunen. HomeCheff verbindt buren via Gezocht, diensten en voorstellen, met de persoon altijd zichtbaar.',
    en: 'Sometimes you need help — or want to support someone nearby. HomeCheff connects neighbours through Wanted, services and proposals, with the person always visible.',
  },
  sectionHelpTitle: { nl: 'Hulp zonder schaamte', en: 'Help without shame' },
  sectionHelpBody: {
    nl: 'Een oproep plaatsen hoeft niet “kopen” te voelen. Je vraagt buren om hulp, ruil of een eerlijke prijs — met duidelijke afspraken en een menselijk gezicht.',
    en: 'Posting a request does not have to feel like “buying”. You ask neighbours for help, barter or a fair price — with clear agreements and a human face.',
  },
  sectionRequestTitle: { nl: 'Gezocht — vraag de buurt', en: 'Wanted — ask the neighbourhood' },
  sectionRequestBody: {
    nl: 'Via Gezocht op het dorpsplein plaats je wat je zoekt: een klus, les, oogst of creatie. Anderen reageren met een voorstel — geld, ruil of contact.',
    en: 'Through Wanted on the village square you post what you need: a chore, lesson, harvest or creation. Others respond with a proposal — money, barter or contact.',
  },
  sectionServicesTitle: { nl: 'Diensten van echte mensen', en: 'Services from real people' },
  sectionServicesBody: {
    nl: 'Reparatie, klusjes, computerhulp, oppas, workshops en coaching — aangeboden door mensen in je regio, niet door een anoniem platform zonder gezicht.',
    en: 'Repair, chores, computer help, childcare, workshops and coaching — offered by people in your area, not by an anonymous platform without a face.',
  },
  ctaRequests: { nl: 'Naar Gezocht', en: 'Go to Wanted' },
  ctaPrimary: { nl: 'Plaats een oproep', en: 'Post a request' },
  ctaSecondary: { nl: 'Bekijk diensten', en: 'Browse services' },
  cta: { nl: 'Vraag je buurt — menselijk en lokaal', en: 'Ask your neighbourhood — human and local' },
  ctaSub: {
    nl: 'Gezocht verbindt buren die hulp zoeken met mensen die iets te bieden hebben.',
    en: 'Wanted connects neighbours seeking help with people who have something to offer.',
  },
};

const communityEconomyPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Buurt economie | Ruilen, delen en lokaal waarde creëren | HomeCheff',
    en: 'Community economy | Barter, share and create local value | HomeCheff',
  },
  metaDescription: {
    nl: 'Ruil, deel en ondersteun elkaar lokaal. HomeCheff verbindt buurt economie met echte mensen — zonder valse duurzaamheidsclaims.',
    en: 'Barter, share and support each other locally. HomeCheff connects community economy with real people — without false sustainability claims.',
  },
  title: { nl: 'Buurt economie', en: 'Community economy' },
  intro: {
    nl: 'Een sterke buurt deelt meer dan alleen geld. HomeCheff maakt ruilen, hulp en lokaal ondernemerschap zichtbaar — eerlijk, zonder opgeblazen impact-cijfers.',
    en: 'A strong neighbourhood shares more than money alone. HomeCheff makes barter, help and local entrepreneurship visible — honestly, without inflated impact numbers.',
  },
  sectionEconomyTitle: { nl: 'Lokaal waarde creëren', en: 'Creating local value' },
  sectionEconomyBody: {
    nl: 'Wanneer je bij een maker om de hoek koopt, leent of ruilt, blijft waarde in de buurt. HomeCheff ondersteunt checkout, ruil en directe afspraken — jij kiest wat past.',
    en: 'When you buy, borrow or barter with a maker around the corner, value stays in the neighbourhood. HomeCheff supports checkout, barter and direct arrangements — you choose what fits.',
  },
  sectionBarterTitle: { nl: 'Ruilen en voorstellen', en: 'Barter and proposals' },
  sectionBarterBody: {
    nl: 'Niet alles hoeft met geld. Via voorstellen en ruil ontdek je wat je kunt uitwisselen met wat jij te bieden hebt — persoonlijk en lokaal.',
    en: 'Not everything needs money. Through proposals and barter you discover what you can exchange for what you have to offer — personal and local.',
  },
  sectionHonestTitle: { nl: 'Eerlijk over impact', en: 'Honest about impact' },
  sectionHonestBody: {
    nl: 'We meten nog geen kilo’s voedselverspilling of eenzaamheid. We bouwen wel infrastructuur voor hergebruik, buurthulp en lokaal inkomen — en publiceren alleen cijfers als die echt bestaan.',
    en: 'We do not yet measure kilos of food waste or loneliness. We do build infrastructure for reuse, neighbour help and local income — and only publish numbers when they truly exist.',
  },
  ctaBarter: { nl: 'Bekijk ruil-aanbod', en: 'Browse barter offers' },
  linkCommunity: { nl: 'Community-ecosysteem', en: 'Community ecosystem' },
  ctaPrimary: { nl: 'Naar het dorpsplein', en: 'To the village square' },
  ctaSecondary: { nl: 'Lokaal verdienen', en: 'Earn locally' },
  cta: { nl: 'Sterkere buurten bouw je samen', en: 'Stronger neighbourhoods are built together' },
  ctaSub: {
    nl: 'Ruil, help en ondersteun lokaal — zonder verzonnen impact-cijfers.',
    en: 'Barter, help and support locally — without invented impact numbers.',
  },
};

const notMassProductionPage: Record<string, Bi> = {
  metaTitle: {
    nl: 'Wat HomeCheff niet is | Mensen boven massaproductie | HomeCheff',
    en: 'What HomeCheff is not | People over mass production | HomeCheff',
  },
  metaDescription: {
    nl: 'HomeCheff staat voor mensen, vakmanschap en buurt — niet voor dropshipping, fabrieken of anonieme massa. Lees wat wel en niet mag op het platform.',
    en: 'HomeCheff stands for people, craft and neighbourhood — not dropshipping, factories or anonymous mass volume. Read what is and is not allowed on the platform.',
  },
  title: { nl: 'Wat HomeCheff niet is', en: 'What HomeCheff is not' },
  intro: {
    nl: 'HomeCheff bestaat voor persoonlijk vakmanschap en lokale mensen — niet voor anonieme massaproductie of aandachts-economie.',
    en: 'HomeCheff exists for personal craftsmanship and local people — not anonymous mass production or attention economics.',
  },
  sectionPeopleTitle: { nl: 'Mensen boven fabrieken', en: 'People over factories' },
  sectionPeopleBody: {
    nl: 'Wij kiezen bewust voor makers met een gezicht, een verhaal en een buurt. Dat is het tegenovergestelde van catalogus-commerce zonder mens.',
    en: 'We deliberately choose makers with a face, a story and a neighbourhood. That is the opposite of catalogue commerce without a human.',
  },
  sectionBlockedTitle: { nl: 'Wat niet past op HomeCheff', en: 'What does not belong on HomeCheff' },
  sectionBlockedBody: {
    nl: 'Dropshipping, gewone tweedehands-doorverkoop, anonieme import en massaproductie zonder persoonlijke maker zijn niet welkom. Getransformeerde items via eigen vakmanschap (upcycle, herstel, herontwerp) wel. In de categorieën en communityrichtlijnen houden we dat vast.',
    en: 'Dropshipping, ordinary second-hand resale, anonymous imports and mass production without a personal maker are not welcome. Items transformed through personal craft (upcycle, restore, redesign) are. Categories and community guidelines enforce this.',
  },
  sectionHonestTitle: { nl: 'Geen valse beloftes', en: 'No false promises' },
  sectionHonestBody: {
    nl: 'We beloven geen ranking-trucs, geen verzonnen impact en geen features die nog niet bestaan. Wat je leest moet kloppen met wat het product doet.',
    en: 'We promise no ranking tricks, no invented impact and no features that do not exist yet. What you read must match what the product does.',
  },
  linkNoDropship: { nl: 'Verdienen zonder dropshipping', en: 'Earn without dropshipping' },
  linkAlternative: { nl: 'Alternatief voor dropshipping', en: 'Alternative to dropshipping' },
  linkGuidelines: { nl: 'Communityrichtlijnen', en: 'Community guidelines' },
  ctaPrimary: { nl: 'Ontdek echte makers', en: 'Discover real makers' },
  ctaSecondary: { nl: 'Wat is HomeCheff?', en: 'What is HomeCheff?' },
  cta: { nl: 'Kies mensen boven massaproductie', en: 'Choose people over mass production' },
  ctaSub: {
    nl: 'HomeCheff is gebouwd voor vakmanschap, buurt en eerlijkheid.',
    en: 'HomeCheff is built for craft, neighbourhood and honesty.',
  },
};

export const PILLAR_PAGE_SOURCES: Record<string, Record<string, Bi>> = {
  pillarSharedFaq,
  platformDefinitionPage,
  earnLocallyPage,
  meetTheMakerPage,
  personalCraftPage,
  neighbourHelpPage,
  communityEconomyPage,
  notMassProductionPage,
};

export const PILLAR_HUB_SECTION = {
  sectionTitle: {
    nl: 'Vakmanschap en buurt — kernonderwerpen',
    en: 'Craft and community — core topics',
  },
  links: [
    { href: '/manifest', label: { nl: 'HomeCheff Manifest', en: 'HomeCheff Manifest' } },
    { href: '/over-ons', label: { nl: 'Over ons', en: 'About us' } },
    { href: '/wat-is-homecheff', label: { nl: 'Wat is HomeCheff?', en: 'What is HomeCheff?' } },
    { href: '/hoe-homecheff-werkt', label: { nl: 'Hoe HomeCheff werkt', en: 'How HomeCheff works' } },
    { href: '/vergelijken', label: { nl: 'Platformvergelijkingen', en: 'Platform comparisons' } },
    { href: '/persoonlijk-vakmanschap', label: { nl: 'Persoonlijk vakmanschap', en: 'Personal craftsmanship' } },
    { href: '/ontmoet-de-maker', label: { nl: 'Ontmoet de maker', en: 'Meet the maker' } },
    { href: '/lokaal-verdienen', label: { nl: 'Lokaal verdienen', en: 'Earn locally' } },
    { href: '/buurthulp', label: { nl: 'Buurthulp', en: 'Neighbour help' } },
    { href: '/buurt-economie', label: { nl: 'Buurt economie', en: 'Community economy' } },
    { href: '/wat-we-niet-zijn', label: { nl: 'Wat we niet zijn', en: 'What we are not' } },
  ],
} as const;
