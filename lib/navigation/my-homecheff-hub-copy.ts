/**
 * Hardcoded Dashboard hub copy — never blank if i18n cache is stale/empty.
 * Keys match `myHomeCheffHub.*` in public/i18n/{nl,en}.json.
 */
export type HubLang = 'nl' | 'en';

const NL = {
  eyebrow: 'Werk & activiteit',
  title: 'Dashboard',
  greeting: 'Welkom, {{name}}',
  activityTitle: 'Jouw werk',
  modulesTitle: 'Meer van HomeCheff',
  modulesSupport: 'Andere HomeCheff-producten — kies waar je naartoe wilt.',
  cards: {
    orders: {
      title: 'Mijn bestellingen',
      description: 'Actieve aankopen, status en bestelgeschiedenis.',
      empty: 'Je hebt nog geen bestellingen.',
      primary: 'Bekijk bestellingen',
    },
    hc: {
      title: 'HC-saldo',
      description: 'Je HomeCheff Credits — saldo, geschiedenis en waar je HC kunt gebruiken.',
      empty: 'Nog geen HC-activiteit.',
      primary: 'Bekijk HC-saldo',
    },
    seller: {
      title: 'Verkopen',
      description: 'Je aanbod, verkopersbestellingen en verkopersgereedschap.',
      onboardingDescription: 'Je verkoopt nog niets op HomeCheff.',
      empty: 'Je hebt nog geen verkopersactiviteit.',
      primary: 'Bekijk bestellingen',
      secondary: 'Nieuw aanbod plaatsen',
      onboardingPrimary: 'Plaats je eerste aanbod',
    },
    affiliate: {
      title: 'Affiliate & netwerk',
      description:
        'Je code, netwerk en commissies — één introductie voor heel HomeCheff.',
      onboardingDescription:
        'Nodig iemand uit. Als diegene later ergens in HomeCheff eligible platformomzet maakt, kan jouw netwerk meedelen (geen garantie).',
      empty: 'Nog geen netwerkactiviteit. Deel je code om te starten.',
      primary: 'Open Affiliate & netwerk',
      secondary: 'Promocodes',
      onboardingPrimary: 'Word affiliate',
      shareLink: 'Deel mijn link',
    },
    delivery: {
      title: 'Bezorging',
      description: 'Beschikbare opdrachten en je bezorgactiviteit.',
      empty: 'Je hebt nog geen bezorgopdrachten.',
      primary: 'Bekijk bezorgdashboard',
    },
    earnings: {
      title: 'Verdiensten',
      description: 'Overzicht van je HomeCheff-inkomsten.',
      primary: 'Bekijk verdiensten',
      secondary: 'Uitbetaling aanvragen',
    },
    account: {
      title: 'Account & instellingen',
      description: 'Profiel, betalingen, privacy en voorkeuren.',
      primary: 'Instellingen',
      secondary: 'Mijn profiel',
    },
  },
  modules: {
    marketplace: {
      title: 'Marketplace',
      body: 'Kopen, verkopen en delen in je buurt.',
      cta: 'Open Marketplace',
    },
    growth: {
      title: 'Growth',
      body: 'Vind en werk met zakelijke leads.',
      cta: 'Open Growth',
    },
    studio: {
      title: 'Studio',
      body: 'Maak content en media.',
      cta: 'Open Studio',
    },
  },
} as const;

const EN = {
  eyebrow: 'Work & activity',
  title: 'Dashboard',
  greeting: 'Welcome, {{name}}',
  activityTitle: 'Your work',
  modulesTitle: 'More from HomeCheff',
  modulesSupport: 'Other HomeCheff products — choose where to go.',
  cards: {
    orders: {
      title: 'My orders',
      description: 'Active purchases, status and order history.',
      empty: 'You have no orders yet.',
      primary: 'View orders',
    },
    hc: {
      title: 'HC balance',
      description: 'Your HomeCheff Credits — balance, history and where you can use HC.',
      empty: 'No HC activity yet.',
      primary: 'View HC balance',
    },
    seller: {
      title: 'Selling',
      description: 'Your listings, seller orders and seller tools.',
      onboardingDescription: 'You are not selling on HomeCheff yet.',
      empty: 'No seller activity yet.',
      primary: 'View orders',
      secondary: 'Create new listing',
      onboardingPrimary: 'Place your first listing',
    },
    affiliate: {
      title: 'Affiliate & network',
      description: 'Your code, network and commissions — one intro across HomeCheff.',
      onboardingDescription:
        'Invite someone. If they later generate eligible HomeCheff platform revenue, your network may share in it (no guarantee).',
      empty: 'No network activity yet. Share your code to start.',
      primary: 'Open Affiliate & network',
      secondary: 'Promo codes',
      onboardingPrimary: 'Become an affiliate',
      shareLink: 'Share my link',
    },
    delivery: {
      title: 'Delivery',
      description: 'Available jobs and your delivery activity.',
      empty: 'No delivery jobs yet.',
      primary: 'View delivery dashboard',
    },
    earnings: {
      title: 'Earnings',
      description: 'Overview of your HomeCheff earnings.',
      primary: 'View earnings',
      secondary: 'Request payout',
    },
    account: {
      title: 'Account & settings',
      description: 'Profile, payments, privacy and preferences.',
      primary: 'Settings',
      secondary: 'My profile',
    },
  },
  modules: {
    marketplace: {
      title: 'Marketplace',
      body: 'Buy, sell and share locally.',
      cta: 'Open Marketplace',
    },
    growth: {
      title: 'Growth',
      body: 'Find and work business leads.',
      cta: 'Open Growth',
    },
    studio: {
      title: 'Studio',
      body: 'Create content and media.',
      cta: 'Open Studio',
    },
  },
} as const;

export function hubCopy(lang: HubLang) {
  return lang === 'en' ? EN : NL;
}

/** Prefer i18n string; never return blank for dashboard labels. */
export function hubLabel(
  translated: string | null | undefined,
  fallback: string,
): string {
  const t = (translated ?? '').trim();
  return t.length > 0 ? t : fallback;
}
