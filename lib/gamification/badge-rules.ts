import { badgeCatalogEntryBySlug } from '@/lib/gamification/badge-catalog';

/**
 * Badge rule keys map to `Badge.slug` and UI catalog entries.
 * Evaluated in `unlock-badges.ts` (idempotent UserBadge rows).
 */
export const HCP_V2_BADGE_SLUGS = [
  'welkom-homecheff',
  'eerste-product',
  'fotokoning',
  'streak-starter',
  'eerste-review',
  'eerste-verkoop',
  'inspiratie-maker',
  'profiel-compleet',
  'hcp-100',
  'community-actief',
  'early-homecheff',
  'beta-tester',
] as const;

export type HcpV2BadgeSlug = (typeof HCP_V2_BADGE_SLUGS)[number];

export type BadgeRowMeta = {
  name: string;
  description: string;
  iconKey: string;
  /** Spiegelt `badge-catalog` (unlock-copy voor UI); niet opgeslagen in DB. */
  unlockHint: string;
};

function catalogUnlockHint(slug: HcpV2BadgeSlug): string {
  return badgeCatalogEntryBySlug(slug)?.unlockHint ?? '';
}

export const BADGE_ROW_META: Record<HcpV2BadgeSlug, BadgeRowMeta> = {
  'welkom-homecheff': {
    name: 'Welkom bij HomeCheff',
    description: 'Je bent gestart met HomeCheff Points.',
    iconKey: 'spark',
    unlockHint: catalogUnlockHint('welkom-homecheff'),
  },
  'eerste-product': {
    name: 'Eerste product',
    description: 'Je eerste product op het dorpsplein.',
    iconKey: 'medal',
    unlockHint: catalogUnlockHint('eerste-product'),
  },
  fotokoning: {
    name: 'Fotokoning',
    description: 'Minstens 5 stuks media op producten of inspiratie (foto’s/video/werkruimte).',
    iconKey: 'photo',
    unlockHint: catalogUnlockHint('fotokoning'),
  },
  'streak-starter': {
    name: 'Streak Starter',
    description: '7 dagen op rij ingelogd.',
    iconKey: 'fire',
    unlockHint: catalogUnlockHint('streak-starter'),
  },
  'eerste-review': {
    name: 'Eerste review',
    description: 'Je eerste review op je aanbod.',
    iconKey: 'star',
    unlockHint: catalogUnlockHint('eerste-review'),
  },
  'eerste-verkoop': {
    name: 'Eerste verkoop',
    description: 'Je eerste succesvolle verkoop.',
    iconKey: 'cart',
    unlockHint: catalogUnlockHint('eerste-verkoop'),
  },
  'inspiratie-maker': {
    name: 'Inspiratie Maker',
    description: '5 gepubliceerde inspiratieposts.',
    iconKey: 'inspiration',
    unlockHint: catalogUnlockHint('inspiratie-maker'),
  },
  'profiel-compleet': {
    name: 'Profiel helder',
    description: 'Profiel volledig ingevuld.',
    iconKey: 'user',
    unlockHint: catalogUnlockHint('profiel-compleet'),
  },
  'hcp-100': {
    name: '100 HCP',
    description: '100 HomeCheff Points verzameld.',
    iconKey: 'spark',
    unlockHint: catalogUnlockHint('hcp-100'),
  },
  'community-actief': {
    name: 'Community actief',
    description: 'Minstens 5 keer als favoriet opgeslagen (inspiratie of producten).',
    iconKey: 'heart',
    unlockHint: catalogUnlockHint('community-actief'),
  },
  'early-homecheff': {
    name: 'Early HomeCheff Creator',
    description: 'Level 4 of meer — je bouwt echt mee.',
    iconKey: 'rocket',
    unlockHint: catalogUnlockHint('early-homecheff'),
  },
  'beta-tester': {
    name: 'Beta Tester',
    description: 'Je test mee met de HomeCheff Android-beta en helpt het platform verbeteren.',
    iconKey: 'rocket',
    unlockHint: catalogUnlockHint('beta-tester'),
  },
};
