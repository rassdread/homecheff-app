import { getPlatformDefinition, type PlatformLang } from './platform-definition';
import {
  HOMECHEFF_BRAND_NAME,
  LEGAL_OPERATOR,
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_KNOWS_ABOUT,
  SUPPORT_EMAIL,
  VERIFIED_FOUNDER,
  VERIFIED_SAME_AS,
  WEBSITE_SEARCH_ACTION_TEMPLATE,
  legalOperatorEntityId,
  organizationEntityId,
  websiteEntityId,
} from './organization-identity';

const SERVICE_MARKETPLACE_CATEGORIES = new Set([
  'PRACTICAL_SERVICE',
  'KNOWLEDGE',
]);

export function isServiceMarketplaceCategory(
  category: string | null | undefined,
): boolean {
  if (!category) return false;
  return SERVICE_MARKETPLACE_CATEGORIES.has(String(category).trim().toUpperCase());
}

function organizationPublisherRef(domain: string): Record<string, string> {
  return { '@id': organizationEntityId(domain) };
}

function websitePartOfRef(domain: string): Record<string, string> {
  return { '@id': websiteEntityId(domain) };
}

/** Phase 13S — canonical Organization entity for the HomeCheff platform brand. */
export function buildOrganizationJsonLd(
  domain: string,
  lang: PlatformLang,
): Record<string, unknown> {
  const def = getPlatformDefinition(lang);
  const contactType = lang === 'en' ? 'Customer service' : 'Klantenservice';
  const lang1 = lang === 'en' ? 'English' : 'Nederlands';
  const lang2 = lang === 'en' ? 'Dutch' : 'Engels';
  const countryName = lang === 'en' ? 'Netherlands' : 'Nederland';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationEntityId(domain),
    name: HOMECHEFF_BRAND_NAME,
    alternateName: [...ORGANIZATION_ALTERNATE_NAMES],
    url: domain,
    logo: { '@type': 'ImageObject', url: `${domain}/logo.png` },
    description: def.organizationDescription,
    sameAs: [...VERIFIED_SAME_AS],
    foundingLocation: {
      '@type': 'Place',
      name: LEGAL_OPERATOR.locality,
      address: {
        '@type': 'PostalAddress',
        addressLocality: LEGAL_OPERATOR.locality,
        addressCountry: LEGAL_OPERATOR.addressCountry,
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: LEGAL_OPERATOR.locality,
      addressCountry: LEGAL_OPERATOR.addressCountry,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType,
      email: SUPPORT_EMAIL,
      availableLanguage: [lang1, lang2],
    },
    parentOrganization: {
      '@type': 'Organization',
      '@id': legalOperatorEntityId(domain),
      name: LEGAL_OPERATOR.name,
      legalName: LEGAL_OPERATOR.legalName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: LEGAL_OPERATOR.locality,
        addressCountry: LEGAL_OPERATOR.addressCountry,
      },
    },
    founder: {
      '@type': 'Person',
      name: VERIFIED_FOUNDER.name,
      jobTitle: VERIFIED_FOUNDER.jobTitle,
    },
    knowsAbout: ORGANIZATION_KNOWS_ABOUT[lang],
    areaServed: { '@type': 'Country', name: countryName },
    copyrightHolder: { '@id': organizationEntityId(domain) },
  };
}

/** Legal operator node — referenced by platform Organization.parentOrganization. */
export function buildLegalOperatorJsonLd(domain: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': legalOperatorEntityId(domain),
    name: LEGAL_OPERATOR.name,
    legalName: LEGAL_OPERATOR.legalName,
    address: {
      '@type': 'PostalAddress',
      addressLocality: LEGAL_OPERATOR.locality,
      addressCountry: LEGAL_OPERATOR.addressCountry,
    },
    identifier: [
      {
        '@type': 'PropertyValue',
        name: 'KvK',
        value: LEGAL_OPERATOR.kvk,
      },
    ],
  };
}

/** Phase 13S — canonical WebSite entity with single SearchAction contract. */
export function buildWebsiteJsonLd(
  domain: string,
  lang: PlatformLang,
): Record<string, unknown> {
  const def = getPlatformDefinition(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteEntityId(domain),
    name: HOMECHEFF_BRAND_NAME,
    alternateName: [...ORGANIZATION_ALTERNATE_NAMES],
    url: domain,
    description: def.websiteDescription,
    publisher: organizationPublisherRef(domain),
    inLanguage: lang === 'en' ? 'en-US' : 'nl-NL',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${domain}${WEBSITE_SEARCH_ACTION_TEMPLATE}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Root entity graph — Organization + legal operator + WebSite. */
export function buildRootEntityGraphJsonLd(
  domain: string,
  lang: PlatformLang,
): Record<string, unknown>[] {
  return [
    buildOrganizationJsonLd(domain, lang),
    buildLegalOperatorJsonLd(domain),
    buildWebsiteJsonLd(domain, lang),
  ];
}

export function buildWebPageJsonLd(input: {
  domain: string;
  lang: PlatformLang;
  path: string;
  name: string;
  description?: string;
  dateModified?: string;
}): Record<string, unknown> {
  const url = input.path.startsWith('http')
    ? input.path
    : `${input.domain}${input.path.startsWith('/') ? input.path : `/${input.path}`}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url,
    inLanguage: input.lang === 'en' ? 'en-US' : 'nl-NL',
    isPartOf: websitePartOfRef(input.domain),
    publisher: organizationPublisherRef(input.domain),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  };
}

export function buildBreadcrumbJsonLd(input: {
  domain: string;
  items: Array<{ name: string; path: string }>;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path.startsWith('http')
        ? item.path
        : `${input.domain}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  };
}

export function buildProfilePageJsonLd(input: {
  domain: string;
  displayName: string;
  profileUrl: string;
  bio?: string | null;
  locality?: string | null;
  imageUrl?: string | null;
}): Record<string, unknown> {
  const person: Record<string, unknown> = {
    '@type': 'Person',
    name: input.displayName,
    url: input.profileUrl,
    ...(input.bio ? { description: input.bio.slice(0, 300) } : {}),
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    ...(input.locality
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: input.locality,
          },
        }
      : {}),
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${input.displayName} | HomeCheff`,
    url: input.profileUrl,
    mainEntity: person,
    isPartOf: websitePartOfRef(input.domain),
    publisher: organizationPublisherRef(input.domain),
  };
}

export function buildSellerHowToJsonLd(
  domain: string,
  lang: PlatformLang,
): Record<string, unknown> {
  const steps =
    lang === 'en'
      ? [
          'Create your HomeCheff account and complete your profile.',
          'Choose what you offer: food, garden, creations or a service.',
          'Add a clear listing with honest photos and pickup or delivery terms.',
          'Connect Stripe when you want to use HomeCheff Checkout for payouts.',
          'Meet neighbours, complete deals and build trust through reviews.',
        ]
      : [
          'Maak je HomeCheff-account aan en vul je profiel aan.',
          'Kies wat je aanbiedt: eten, tuin, creaties of een dienst.',
          'Plaats een duidelijk aanbod met eerlijke foto’s en ophaal- of bezorgafspraken.',
          'Koppel Stripe wanneer je HomeCheff Checkout voor uitbetalingen wilt gebruiken.',
          'Ontmoet buren, rond deals af en bouw vertrouwen op via reviews.',
        ];

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name:
      lang === 'en'
        ? 'How to start offering on HomeCheff'
        : 'Zo begin je met aanbieden op HomeCheff',
    description:
      lang === 'en'
        ? 'A practical path for local makers and neighbours to offer craftsmanship on HomeCheff.'
        : 'Een praktisch pad voor lokale makers en buren om vakmanschap op HomeCheff aan te bieden.',
    step: steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    })),
    url: `${domain}/lokaal-verdienen`,
    publisher: organizationPublisherRef(domain),
  };
}

export type ListingSchemaInput = {
  domain: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  productUrl: string;
  sellerName: string;
  sellerUsername?: string | null;
  city?: string | null;
  marketplaceCategory?: string | null;
  stock?: number | null;
  averageRating?: string | null;
  reviewCount: number;
  reviews?: Array<{
    rating: number;
    comment?: string | null;
    title?: string | null;
    buyerName?: string | null;
  }>;
};

export function buildListingJsonLd(
  input: ListingSchemaInput,
): Record<string, unknown> {
  const isService = isServiceMarketplaceCategory(input.marketplaceCategory);

  const sellerPerson: Record<string, unknown> = {
    '@type': 'Person',
    name: input.sellerName,
    ...(input.sellerUsername
      ? { url: `${input.domain}/user/${input.sellerUsername}` }
      : {}),
    ...(input.city
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: input.city,
          },
        }
      : {}),
  };

  const availability =
    input.stock != null && input.stock > 0
      ? 'https://schema.org/InStock'
      : input.stock === 0
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock';

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    price: input.price,
    priceCurrency: 'EUR',
    availability,
    url: input.productUrl,
    seller: sellerPerson,
  };

  if (isService) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: input.title,
      description: input.description || input.title,
      image: input.imageUrl,
      provider: sellerPerson,
      areaServed: input.city
        ? { '@type': 'Place', name: input.city }
        : undefined,
      offers: offer,
      ...(input.averageRating &&
        input.reviewCount > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.averageRating,
            reviewCount: input.reviewCount,
          },
        }),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.title,
    description: input.description || '',
    image: input.imageUrl,
    brand: { '@type': 'Brand', name: input.sellerName },
    seller: sellerPerson,
    offers: offer,
    ...(input.averageRating &&
      input.reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: input.averageRating,
          reviewCount: input.reviewCount,
        },
        review: (input.reviews ?? []).slice(0, 5).map((review) => ({
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: review.buyerName || 'Anonymous',
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: review.rating,
          },
          reviewBody: review.comment || review.title || '',
        })),
      }),
  };
}
