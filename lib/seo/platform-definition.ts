/**
 * Phase 13Q — Canonical platform identity (SSOT).
 * All public surfaces should align with these definitions.
 */

export type PlatformLang = 'nl' | 'en';

export type PlatformDefinitionBlock = {
  /** One-sentence entity definition for AI + schema */
  entityDefinition: string;
  /** Root layout / OG default title */
  defaultTitle: string;
  /** Root layout / OG default description */
  defaultDescription: string;
  /** Organization schema description */
  organizationDescription: string;
  /** WebSite schema description */
  websiteDescription: string;
  /** FAQ JSON-LD first answer anchor */
  faqWhatIsHomeCheff: string;
  /** SEO hub intro line */
  seoHubIntro: string;
  /** Footer tagline (optional) */
  footerTagline: string;
};

export const PLATFORM_DEFINITION: Record<PlatformLang, PlatformDefinitionBlock> = {
  nl: {
    entityDefinition:
      'HomeCheff is het digitale thuis van persoonlijk vakmanschap en lokale kansen — waar echte mensen eten, oogst, creaties, diensten en hulp aanbieden in hun buurt.',
    defaultTitle: 'HomeCheff — Persoonlijk vakmanschap en lokale kansen',
    defaultDescription:
      'HomeCheff is het digitale thuis van persoonlijk vakmanschap. Ontdek makers, buren en vakmensen bij jou in de buurt — eten is één categorie naast tuin, creaties, diensten en hulp.',
    organizationDescription:
      'HomeCheff is het digitale thuis van persoonlijk vakmanschap en lokale kansen. Buurtgenoten bieden en ontdekken wat echte mensen maken, koken, kweken, ontwerpen en aanbieden — met veilig afrekenen, direct contact, ruil of voorstellen.',
    websiteDescription:
      'HomeCheff — het digitale dorpsplein waar je lokale makers, vakmensen en buren ontdekt. Eten, tuin, creaties, diensten, hulp en inspiratie — altijd met de persoon achter het aanbod centraal.',
    faqWhatIsHomeCheff:
      'HomeCheff is het digitale thuis van persoonlijk vakmanschap en lokale kansen. Buurtgenoten bieden en ontdekken eten, tuinoogst, creaties, diensten en hulp — met veilig afrekenen, direct contact, ruil of voorstellen. Eten is één categorie, geen heel platform.',
    seoHubIntro:
      'HomeCheff is het digitale thuis van persoonlijk vakmanschap. Kies een onderwerp — eten is één categorie naast tuin, creaties, diensten en buurthulp.',
    footerTagline: 'Het digitale thuis van persoonlijk vakmanschap in jouw buurt.',
  },
  en: {
    entityDefinition:
      'HomeCheff is the digital home of personal craftsmanship and local opportunity — where real people offer food, harvest, creations, services and help in their neighbourhood.',
    defaultTitle: 'HomeCheff — Personal craftsmanship and local opportunity',
    defaultDescription:
      'HomeCheff is the digital home of personal craftsmanship. Discover makers, neighbours and skilled locals near you — food is one category alongside garden, creations, services and help.',
    organizationDescription:
      'HomeCheff is the digital home of personal craftsmanship and local opportunity. Neighbours offer and discover what real people make, cook, grow, design and provide — with secure checkout, direct contact, barter or proposals.',
    websiteDescription:
      'HomeCheff — the digital village square to discover local makers, craftspeople and neighbours. Food, garden, creations, services, help and inspiration — always with the person behind the offer at the centre.',
    faqWhatIsHomeCheff:
      'HomeCheff is the digital home of personal craftsmanship and local opportunity. Neighbours offer and discover food, garden harvest, creations, services and help — with secure checkout, direct contact, barter or proposals. Food is one category, not the whole platform.',
    seoHubIntro:
      'HomeCheff is the digital home of personal craftsmanship. Pick a topic — food is one category alongside garden, creations, services and neighbour help.',
    footerTagline: 'The digital home of personal craftsmanship in your neighbourhood.',
  },
};

export function getPlatformDefinition(lang: string): PlatformDefinitionBlock {
  return lang === 'en' ? PLATFORM_DEFINITION.en : PLATFORM_DEFINITION.nl;
}

/** Shared root keywords — craft-first, not food-only */
export const PLATFORM_KEYWORDS: Record<PlatformLang, string[]> = {
  nl: [
    'HomeCheff',
    'persoonlijk vakmanschap',
    'lokaal vakmanschap',
    'buurtplatform',
    'lokale makers',
    'bijverdienen vanuit huis',
    'handgemaakt',
    'thuisgemaakt',
    'buurthulp',
    'buurt economie',
    'lokale kansen',
    'dorpsplein',
    'eten',
    'tuin',
    'creaties',
    'diensten',
  ],
  en: [
    'HomeCheff',
    'personal craftsmanship',
    'local craft',
    'neighbourhood platform',
    'local makers',
    'earn from home',
    'handmade',
    'homemade',
    'neighbour help',
    'community economy',
    'local opportunity',
    'village square',
    'food',
    'garden',
    'creations',
    'services',
  ],
};
