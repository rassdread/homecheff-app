/**
 * Static catalog for “locked” badges on /mijn-hcp (no DB rows required).
 * Earned rows still come from `UserBadge` + `Badge` via `/api/gamification/me`.
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
    slug: 'fotokoning',
    name: 'Fotokoning',
    description: 'Voeg rijke foto’s en video toe aan je posts en producten.',
    iconKey: 'photo',
    unlockHint: 'Voeg 5 foto’s toe aan één product of inspiratiepost.',
  },
  {
    slug: 'actief',
    name: 'Actief',
    description: 'Blijf actief met login-streaks en community-momenten.',
    iconKey: 'active',
    unlockHint: 'Log 7 dagen achter elkaar in.',
  },
  {
    slug: 'inspiratie-maker',
    name: 'Inspiratie Maker',
    description: 'Deel inspiratie en ideeën met de community.',
    iconKey: 'inspiration',
    unlockHint: 'Plaats 5 inspiratie-items.',
  },
  {
    slug: 'verkoper',
    name: 'Verkoper',
    description: 'Bouw je dorpsplein-aanbod op en maak verkopen.',
    iconKey: 'seller',
    unlockHint: 'Behaal je eerste verkoop.',
  },
  {
    slug: 'community',
    name: 'Community',
    description: 'Props, berichten en uitnodigingen helpen HomeCheff groeien.',
    iconKey: 'community',
    unlockHint: 'Geef likes, reacties of volg andere makers.',
  },
  {
    slug: 'reviews',
    name: 'Gewaardeerd',
    description: 'Verzamel reviews en waardering van kopers.',
    iconKey: 'review',
    unlockHint: 'Ontvang je eerste review.',
  },
  {
    slug: 'eerste-product',
    name: 'Eerste product',
    description: 'Je eerste product op het dorpsplein.',
    iconKey: 'medal',
    unlockHint: 'Publiceer je eerste betaalde product op het dorpsplein.',
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
    description: 'Favorieten op je content.',
    iconKey: 'heart',
    unlockHint: 'Zorg dat anderen je content minstens vijf keer als favoriet opslaan.',
  },
  {
    slug: 'early-homecheff',
    name: 'Early HomeCheff Creator',
    description: 'Level 4+ — je bouwt mee.',
    iconKey: 'rocket',
    unlockHint: 'Bereik level 4 of hoger door HCP te verdienen (o.a. posts, streak en reviews).',
  },
];

export function badgeCatalogEntryBySlug(slug: string): BadgeCatalogEntry | undefined {
  return HCP_BADGE_CATALOG.find((b) => b.slug === slug);
}
