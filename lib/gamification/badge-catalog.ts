/**
 * Static catalog for “locked” badges on /mijn-hcp (sync met `HCP_V2_BADGE_SLUGS` / DB `Badge.slug`).
 * Earned rows komen uit `UserBadge` via `/api/gamification/me`.
 */
export type BadgeCatalogEntry = {
  slug: string;
  name: string;
  description: string;
  iconKey: string;
  /** Korte instructie voor op /mijn-hcp (tooltip + sheet). */
  unlockHint: string;
};

export const HCP_BADGE_CATALOG: BadgeCatalogEntry[] = [
  {
    slug: 'welkom-homecheff',
    name: 'Welkom bij HomeCheff',
    description: 'Je eerste stappen op het platform met HomeCheff Points.',
    iconKey: 'spark',
    unlockHint: 'Maak een account en verdien je eerste HCP (welkombonus).',
  },
  {
    slug: 'eerste-product',
    name: 'Eerste product',
    description: 'Je eerste product op het dorpsplein.',
    iconKey: 'medal',
    unlockHint: 'Publiceer je eerste betaalde product op het dorpsplein.',
  },
  {
    slug: 'fotokoning',
    name: 'Fotokoning',
    description: 'Voeg rijke foto’s en video toe aan je posts en producten.',
    iconKey: 'photo',
    unlockHint:
      'Upload minstens vijf keer media (productfoto’s, inspiratie, werkruimte-foto’s of video’s) verspreid over je aanbod.',
  },
  {
    slug: 'streak-starter',
    name: 'Streak Starter',
    description: '7 dagen op rij ingelogd.',
    iconKey: 'fire',
    unlockHint: 'Log 7 dagen achter elkaar in (dagelijks openen van de app of site).',
  },
  {
    slug: 'eerste-review',
    name: 'Eerste review',
    description: 'Je eerste review op je aanbod.',
    iconKey: 'star',
    unlockHint: 'Laat een koper een review achterlaten op jouw product of inspiratie.',
  },
  {
    slug: 'eerste-verkoop',
    name: 'Eerste verkoop',
    description: 'Je eerste succesvolle verkoop.',
    iconKey: 'cart',
    unlockHint: 'Rond je eerste succesvolle verkoop af via HomeCheff.',
  },
  {
    slug: 'inspiratie-maker',
    name: 'Inspiratie Maker',
    description: 'Deel inspiratie en ideeën met de community.',
    iconKey: 'inspiration',
    unlockHint: 'Plaats 5 openbare inspiratie-items.',
  },
  {
    slug: 'profiel-compleet',
    name: 'Profiel helder',
    description: 'Profiel volledig ingevuld.',
    iconKey: 'user',
    unlockHint: 'Vul je profiel aan (naam, foto, bio en andere verplichte velden voor een compleet profiel).',
  },
  {
    slug: 'hcp-100',
    name: '100 HCP',
    description: '100 HomeCheff Points verzameld.',
    iconKey: 'spark',
    unlockHint: 'Verzamel minstens 100 HomeCheff Points door actief te zijn op het platform.',
  },
  {
    slug: 'community-actief',
    name: 'Community actief',
    description: 'Favorieten op je content (of props van anderen op je werkruimte).',
    iconKey: 'heart',
    unlockHint:
      'Laat anderen je content minstens vijf keer als favoriet opslaan, of ontvang vijf props van anderen op je inspiratie/werkruimte.',
  },
  {
    slug: 'early-homecheff',
    name: 'Early HomeCheff Creator',
    description: 'Level 4+ — je bouwt mee.',
    iconKey: 'rocket',
    unlockHint: 'Bereik level 4 of hoger door HCP te verdienen (o.a. posts, streak en reviews).',
  },
  {
    slug: 'beta-tester',
    name: 'Beta Tester',
    description: 'Je neemt deel aan de Android-beta en helpt HomeCheff verbeteren.',
    iconKey: 'rocket',
    unlockHint: 'Word tester via homecheff.eu/app (Google Play Open Testing) en voltooi de beta-startflow.',
  },
  {
    slug: 'eerste-afspraak',
    name: 'Eerste afspraak',
    description: 'Je eerste afgeronde community-afspraak.',
    iconKey: 'medal',
    unlockHint: 'Rond je eerste afspraak via de chat af.',
  },
  {
    slug: 'betrouwbare-verkoper',
    name: 'Betrouwbare verkoper',
    description: 'Minstens vijf afgeronde afspraken als verkoper.',
    iconKey: 'star',
    unlockHint: 'Rond vijf afspraken af waarbij jij de verkoper bent.',
  },
  {
    slug: 'betrouwbare-bezorger',
    name: 'Betrouwbare bezorger',
    description: 'Minstens drie afgeronde community-bezorgingen.',
    iconKey: 'cart',
    unlockHint: 'Rond drie community-bezorgopdrachten succesvol af.',
  },
  {
    slug: 'vaste-klant',
    name: 'Vaste klant',
    description: 'Meerdere afgeronde afspraken met dezelfde maker of klant.',
    iconKey: 'heart',
    unlockHint: 'Rond minstens twee afspraken af met dezelfde tegenpartij.',
  },
];

export function badgeCatalogEntryBySlug(slug: string): BadgeCatalogEntry | undefined {
  return HCP_BADGE_CATALOG.find((b) => b.slug === slug);
}
