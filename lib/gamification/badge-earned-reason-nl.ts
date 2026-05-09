/**
 * Korte NL-zinnen “waarom verdiend” voor badge-detail (sheet).
 * Los van server-side toekenningslogica — alleen presentatie, per catalogus-slug.
 * Toekomst: kan naar i18n-keys of DB-veld `earnedReason` verhuizen.
 */

const EARNED_REASON_BY_SLUG: Record<string, string> = {
  'welkom-homecheff':
    'Verdiend omdat je een account aanmaakte en je eerste HomeCheff Points (welkombonus) ontving.',
  'eerste-product':
    'Verdiend omdat je je eerste betaalde product op het dorpsplein publiceerde.',
  fotokoning:
    'Verdiend omdat je minstens vijf keer media toevoegde (productfoto’s, inspiratie, werkruimte of video) verspreid over je aanbod.',
  'streak-starter':
    'Verdiend doordat je 7 dagen achter elkaar actief was (dagelijks ingelogd via de app of site).',
  'eerste-review':
    'Verdiend omdat een koper voor het eerst een review op jouw product of inspiratie achterliet.',
  'eerste-verkoop': 'Verdiend omdat je je eerste succesvolle verkoop via HomeCheff afrondde.',
  'inspiratie-maker': 'Verdiend omdat je 5 openbare inspiratie-items plaatste.',
  'profiel-compleet': 'Verdiend omdat je profiel volledig invulde (naam, foto, bio en overige verplichte velden).',
  'hcp-100': 'Verdiend omdat je minstens 100 HomeCheff Points verzamelde door actief te zijn op het platform.',
  'community-actief':
    'Verdiend omdat anderen je content minstens vijf keer als favoriet zetten, of je vijf props ontving op inspiratie of werkruimte.',
  'early-homecheff': 'Verdiend omdat je level 4 of hoger bereikte door HCP te verdienen.',
  'beta-tester':
    'Verdiend omdat je deelnam aan de Android-beta en de beta-startflow voltooide (of je registreerde via homecheff.eu/app).',
};

/**
 * @param unlockHint — optioneel; gebruikt als fallback wanneer slug onbekend is (bijv. toekomstige badges).
 */
export function earnedReasonNlForSlug(slug: string, unlockHint?: string | null): string {
  const direct = EARNED_REASON_BY_SLUG[slug];
  if (direct) return direct;
  if (unlockHint?.trim()) {
    return `Verdiend doordat je aan deze voorwaarde voldeed: ${unlockHint.trim()}`;
  }
  return 'Je verdiende deze badge op HomeCheff.';
}

/** Eén regel voor sheet: “Behaald op …” (datum + tijd, nl-NL). */
export function formatEarnedAtNl(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
