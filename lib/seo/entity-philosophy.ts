/**
 * Phase 2.1 — Permanent HomeCheff entity philosophy (semantic SSOT).
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

/** What HomeCheff is — community / people / craft / creator / neighbourhood first */
export const ENTITY_IS: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff is de digitale buurtmarkt: community-first, people-first, craftsmanship-first, creator-first en neighbourhood-first — waar mensen dichtbij koken, groeien, maken, repareren, ontwerpen, lesgeven, helpen, handelen, dienen en delen.',
  en:
    'HomeCheff is the digital neighbourhood marketplace: community-first, people-first, craftsmanship-first, creator-first and neighbourhood-first — where people nearby cook, grow, make, repair, design, teach, help, trade, serve and share.',
};

/** What HomeCheff is not */
export const ENTITY_IS_NOT: Record<PhilosophyLang, string[]> = {
  nl: [
    'geen generieke advertentiesite',
    'geen tweedehands-marktplaats voor gewone doorverkoop',
    'geen mass retail platform',
    'geen bezorgplatform',
    'geen anonieme webshop',
    'geen “Home Chef” maaltijdbox- of USA-merk (andere spelling, andere filosofie)',
  ],
  en: [
    'not a generic classifieds website',
    'not a second-hand marketplace for ordinary resale',
    'not a mass retail platform',
    'not a delivery platform',
    'not an anonymous ecommerce website',
    'not affiliated with “Home Chef” meal-kit or USA brands (different spelling and purpose)',
  ],
};

/** Local-first without hard limits — scalable discovery */
export const LOCAL_FIRST_SCALE: Record<PhilosophyLang, string> = {
  nl:
    'Resultaten dichtbij verschijnen eerst. Unieke makers en bijzonder vakmanschap kunnen van nature verder reiken — buurt → stad → regio → Nederland → Europa → later international — zonder de local-first filosofie te veranderen. Nooit als “internationale marktplaats”; wel als local-first en natuurlijk schaalbaar.',
  en:
    'Results nearby appear first. Unique creators and distinctive craftsmanship may naturally reach further — neighbourhood → city → region → Netherlands → Europe → later international — without changing the local-first philosophy. Never as an “international marketplace”; always local-first and naturally scalable.',
};

/** Second-hand / transformed work only */
export const SECOND_HAND_PHILOSOPHY: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff is niet bedoeld voor gewone tweedehands-doorverkoop. Tweedehands hoort hier alleen als het is getransformeerd door eigen werk van de maker — artistiek hersteld, upcycled, creatief herontworpen of ambachtelijk gerepareerd. De waarde zit in persoonlijk werk, creativiteit en vakmanschap — niet in eenvoudige doorverkoop.',
  en:
    'HomeCheff is not intended for ordinary second-hand trading. Second-hand belongs only when transformed through the creator’s own work — artistically restored, upcycled, creatively redesigned or repaired with craftsmanship. Value comes from personal work, creativity and craftsmanship — not from simple resale.',
};

/** Category philosophy — people create value */
export const CATEGORY_PHILOSOPHY: Record<PhilosophyLang, string> = {
  nl:
    'Categorieën versterken maken en groeien: thuisgekookt, eigen oogst, handwerk, creatief werk, persoonlijke diensten, lokale expertise, reparaties, kennis, buurthulp en ruil. Mensen creëren waarde — ze verkopen geen anonieme massaproducten door.',
  en:
    'Categories reinforce making and growing: homemade meals, self-grown produce, handmade creations, creative work, personal services, local expertise, repairs, knowledge, neighbourhood help and barter. People create value — they do not resell anonymous mass products.',
};

/** Short meta / OG-friendly description */
export const ENTITY_META_DESCRIPTION: Record<PhilosophyLang, string> = {
  nl:
    'Digitale buurtmarkt: community- en creator-first. Thuisgekookt, oogst, handwerk, reparaties, lessen en buurthulp — dichtbij eerst. Geen anonieme classifieds, geen gewone tweedehands-doorverkoop, geen bezorgketen.',
  en:
    'Digital neighbourhood marketplace: community- and creator-first. Homemade food, harvest, handmade work, repairs, lessons and neighbour help — nearby first. Not anonymous classifieds, not ordinary second-hand resale, not a delivery chain.',
};

/** FAQ-length answer */
export const ENTITY_FAQ_WHAT: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff is de digitale buurtmarkt voor persoonlijk vakmanschap en lokale kansen. Alles begint dichtbij huis: afstand bepaalt prioriteit, niet mogelijkheid. Buurtgenoten koken, groeien, maken, repareren, ontwerpen, lesgeven, helpen, handelen en delen — met de persoon zichtbaar. Eten is één categorie. Geen generieke classifieds, geen gewone tweedehands-doorverkoop, geen bezorgplatform. Tweedehands alleen bij echte creatieve of ambachtelijke transformatie.',
  en:
    'HomeCheff is the digital neighbourhood marketplace for personal craftsmanship and local opportunity. Everything starts close to home: distance determines priority, not possibility. Neighbours cook, grow, make, repair, design, teach, help, trade and share — with the person visible. Food is one category. Not generic classifieds, not ordinary second-hand resale, not a delivery platform. Second-hand only when truly transformed through creative or craft work.',
};

/** Homepage SSR / orientation body */
export const ENTITY_HOMEPAGE_DEFINITION: Record<PhilosophyLang, string> = {
  nl:
    'HomeCheff is de digitale buurtmarkt. Alles begint dichtbij huis. Ontdek makers die koken, groeien, maken, repareren en helpen — creator-first, geen anonieme doorverkoop.',
  en:
    'HomeCheff is the digital neighbourhood marketplace. Everything starts close to home. Discover creators who cook, grow, make, repair and help — creator-first, not anonymous resale.',
};

export function entityNotLine(lang: PhilosophyLang): string {
  return lang === 'en'
    ? `HomeCheff is ${ENTITY_IS_NOT.en.join(', ')}.`
    : `HomeCheff is ${ENTITY_IS_NOT.nl.join(', ')}.`;
}
