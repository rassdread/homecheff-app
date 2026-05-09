/**
 * Catalogus voor UI + `/api/gamification/me` — automatisch gekoppeld aan `UserHcpReward.slug`.
 * Geen uitbetaling / geen Stripe.
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
    description:
      'Je profiel kan tijdelijk extra aandacht krijgen binnen HomeCheff — denk aan je profiel en plekken waar makers zichtbaar zijn.',
    requirement: '⭐ Vanaf 500 HCP',
    kind: 'boost',
  },
  {
    id: 'featured-1000',
    title: 'Featured creator',
    description:
      'Je kunt uitgelicht worden op de homepage of in HCP-schermen wanneer er ruimte is — nooit vast gepland, wel een echte kans op extra zicht.',
    requirement: '⭐ Vanaf 1000 HCP',
    kind: 'spotlight',
  },
  {
    id: 'weekly-top3',
    title: 'Creator van de week',
    description:
      'Sta je in de top 3 van deze week? Dan kun je extra zichtbaarheid krijgen tot het weekoverzicht vernieuwt.',
    requirement: '🏆 Top 3 van deze week',
    kind: 'spotlight',
  },
  {
    id: 'streak-30',
    title: 'Speciale profiel-glow',
    description:
      'Je profiel kan een zachte, unieke uitstraling krijgen — zichtbaar op je profiel en op Mijn HCP.',
    requirement: '🔥 30 dagen actief (login-streak)',
    kind: 'badge',
  },
];
