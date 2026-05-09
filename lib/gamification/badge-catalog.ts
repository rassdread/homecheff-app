/**
 * Static catalog for “locked” badges on /mijn-hcp (no DB rows required).
 * Earned rows still come from `UserBadge` + `Badge` via `/api/gamification/me`.
 */
export type BadgeCatalogEntry = {
  slug: string;
  name: string;
  description: string;
  iconKey: string;
};

export const HCP_BADGE_CATALOG: BadgeCatalogEntry[] = [
  {
    slug: 'fotokoning',
    name: 'Fotokoning',
    description: 'Voeg rijke foto’s en video toe aan je posts en producten.',
    iconKey: 'photo',
  },
  {
    slug: 'actief',
    name: 'Actief',
    description: 'Blijf actief met login-streaks en community-momenten.',
    iconKey: 'active',
  },
  {
    slug: 'inspiratie-maker',
    name: 'Inspiratie Maker',
    description: 'Deel inspiratie en ideeën met de community.',
    iconKey: 'inspiration',
  },
  {
    slug: 'verkoper',
    name: 'Verkoper',
    description: 'Bouw je dorpsplein-aanbod op en maak verkopen.',
    iconKey: 'seller',
  },
  {
    slug: 'community',
    name: 'Community',
    description: 'Props, berichten en uitnodigingen helpen HomeCheff groeien.',
    iconKey: 'community',
  },
  {
    slug: 'reviews',
    name: 'Gewaardeerd',
    description: 'Verzamel reviews en waardering van kopers.',
    iconKey: 'review',
  },
];
