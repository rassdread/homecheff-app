/**
 * Phase 3.2 — HomeCheff privacy philosophy (community before data).
 *
 * Communication SSOT only. Does not rewrite legal /privacy wording, cookies,
 * consent, auth, security, Workspace, architecture, DB, routing or business logic.
 * Does not invent legal guarantees.
 */

export type PrivacyLang = 'nl' | 'en';

/** Core mission line. */
export const PRIVACY_MISSION: Record<PrivacyLang, string> = {
  en: 'People are the community. People are not the product. HomeCheff exists to connect neighbours, not to monetise behavioural profiles.',
  nl: 'Mensen zijn de community. Mensen zijn niet het product. HomeCheff bestaat om buren te verbinden, niet om gedragsprofielen te gelde te maken.',
};

/** Permanent principles — philosophy, not legal promises. */
export const PRIVACY_PRINCIPLES: Record<PrivacyLang, string[]> = {
  en: [
    'Community before advertising',
    'People before profiling',
    'Privacy before tracking',
    'Trust before optimisation',
    'Craftsmanship before consumption',
    'Local connection before algorithmic addiction',
  ],
  nl: [
    'Community vóór advertising',
    'Mensen vóór profiling',
    'Privacy vóór tracking',
    'Trust vóór optimalisatie',
    'Vakmanschap vóór consumptie',
    'Lokale verbinding vóór algoritmische verslaving',
  ],
};

/** What data is for — improve HomeCheff itself. */
export const DATA_PURPOSE: Record<PrivacyLang, string> = {
  en:
    'Your data exists to make HomeCheff work: nearby results, chats, orders, reviews, trust, notifications and recommendations inside HomeCheff — not to create advertising profiles across the internet.',
  nl:
    'Jouw data bestaat om HomeCheff te laten werken: resultaten dichtbij, chats, bestellingen, reviews, trust, notificaties en aanbevelingen binnen HomeCheff — niet om advertentieprofielen over het internet te bouwen.',
};

/** Honest framing for security / analytics / improvement tracking. */
export const HONEST_PLATFORM_MEASUREMENT: Record<PrivacyLang, string> = {
  en:
    'Where HomeCheff uses security, analytics or platform-improvement measurement, that is to run and improve the neighbourhood marketplace itself — not to sell behavioural advertising profiles. Legal details remain in /privacy; this text is philosophy, not a legal guarantee.',
  nl:
    'Waar HomeCheff security, analytics of platformverbetering meet, is dat om de buurtmarkt zelf te laten draaien en te verbeteren — niet om gedragsadvertentieprofielen te verkopen. Juridische details blijven op /privacy; deze tekst is filosofie, geen juridische garantie.',
};

/** Explicit is-not — anti-profiling communication. */
export const PRIVACY_IS_NOT: Record<PrivacyLang, string[]> = {
  en: [
    'not built around behavioural advertising',
    'not built to sell user data for advertising',
    'not a cross-site tracking product',
    'not an attention-economy engagement machine',
    'not surveillance marketing',
  ],
  nl: [
    'niet gebouwd rond behavioural advertising',
    'niet gebouwd om gebruikersdata voor advertising te verkopen',
    'geen cross-site tracking-product',
    'geen aandachts-economie / engagement-machine',
    'geen surveillance-marketing',
  ],
};

/** Short FAQ / AI answer — no legal overclaim. */
export const PRIVACY_FAQ_ANSWER: Record<PrivacyLang, string> = {
  en:
    'HomeCheff is designed as a community platform. User data is intended to improve the HomeCheff experience itself (nearby discovery, chats, orders, reviews, trust, notifications, in-platform recommendations). HomeCheff is not built around selling behavioural advertising profiles. For legal rights and processing details, see /privacy.',
  nl:
    'HomeCheff is ontworpen als communityplatform. Gebruikersdata is bedoeld om de HomeCheff-ervaring zelf te verbeteren (ontdekking dichtbij, chats, bestellingen, reviews, trust, notificaties, aanbevelingen in het platform). HomeCheff is niet gebouwd om gedragsadvertentieprofielen te verkopen. Voor juridische rechten en verwerkingsdetails zie /privacy.',
};

/** Manifest / trust one-liner. */
export const PRIVACY_MANIFEST_LINE: Record<PrivacyLang, string> = {
  en: 'Community before data: people are neighbours to connect — not profiles to monetise.',
  nl: 'Community vóór data: mensen zijn buren om te verbinden — geen profielen om te gelde te maken.',
};

export function privacyPhilosophyBrief(): string {
  return [
    `mission: ${PRIVACY_MISSION.en}`,
    `principles: ${PRIVACY_PRINCIPLES.en.join(' · ')}`,
    `data_purpose: ${DATA_PURPOSE.en}`,
    `is_not: ${PRIVACY_IS_NOT.en.join('; ')}`,
    `honest_measurement: ${HONEST_PLATFORM_MEASUREMENT.en}`,
    'rule: philosophy communication only — legal policy remains /privacy; no invented guarantees',
  ].join('\n');
}
