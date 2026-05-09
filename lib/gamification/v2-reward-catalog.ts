/**
 * V2 placeholder “beloningen” — geen uitbetaling, geen Stripe.
 * Admin / productie kan later echte workflows koppelen.
 */
export type HcpV2CatalogReward = {
  id: string;
  title: string;
  description: string;
  requirement: string;
  kind: 'visibility' | 'spotlight' | 'badge' | 'boost';
};

export const HCP_V2_REWARD_CATALOG: HcpV2CatalogReward[] = [
  {
    id: 'boost-500',
    title: 'Profielboost',
    description: 'Tijdelijk extra zichtbaarheid in je buurt (placeholder).',
    requirement: '500 HCP totaal',
    kind: 'boost',
  },
  {
    id: 'featured-1000',
    title: 'Featured creator',
    description: 'Kans op uitgelichte plek op de homepage (placeholder).',
    requirement: '1000 HCP totaal',
    kind: 'spotlight',
  },
  {
    id: 'weekly-top3',
    title: 'Creator van de week',
    description: 'Spotlight voor top 3 weekly leaderboard (placeholder).',
    requirement: 'Top 3 deze week',
    kind: 'spotlight',
  },
  {
    id: 'streak-30',
    title: 'Speciale profiel-badge',
    description: 'Unieke glow/badge na 30 dagen streak (placeholder).',
    requirement: '30 dagen login-streak',
    kind: 'badge',
  },
];
