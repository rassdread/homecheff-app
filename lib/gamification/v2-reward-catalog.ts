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
      'Interne zichtbaarheidsboost (we tonen dit op je profiel/Mijn HCP). Geen harde feed-ranking wijziging in V3.',
    requirement: '500 HCP totaal',
    kind: 'boost',
  },
  {
    id: 'featured-1000',
    title: 'Featured creator',
    description:
      'Geschikt voor latere homepage-spotlights. Nu: eligibility vastgelegd in je account — geen automatische ranking shuffle.',
    requirement: '1000 HCP totaal',
    kind: 'spotlight',
  },
  {
    id: 'weekly-top3',
    title: 'Creator van de week',
    description:
      'Wekelijkse spotlight-status als je in de top 3 staat voor deze week (UTC-week). Verloopt aan het einde van de week.',
    requirement: 'Top 3 deze week',
    kind: 'spotlight',
  },
  {
    id: 'streak-30',
    title: 'Speciale profiel-badge / glow',
    description: 'Interne beloning na 30 dagen login-streak (weergave op Mijn HCP).',
    requirement: '30 dagen login-streak',
    kind: 'badge',
  },
];
