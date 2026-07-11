import { getPlatformDefinition, type PlatformLang } from './platform-definition';

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

export function buildOrganizationJsonLd(
  domain: string,
  lang: PlatformLang,
): Record<string, unknown> {
  const def = getPlatformDefinition(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HomeCheff',
    url: domain,
    logo: { '@type': 'ImageObject', url: `${domain}/logo.png` },
    description: def.organizationDescription,
    areaServed: { '@type': 'Country', name: lang === 'en' ? 'Netherlands' : 'Nederland' },
  };
}

export function buildWebsiteJsonLd(
  domain: string,
  lang: PlatformLang,
): Record<string, unknown> {
  const def = getPlatformDefinition(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HomeCheff',
    url: domain,
    description: def.websiteDescription,
    publisher: { '@type': 'Organization', name: 'HomeCheff' },
    inLanguage: lang === 'en' ? 'en-US' : 'nl-NL',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${domain}/?place={search_term_string}#homecheff-feed`,
      },
      'query-input': 'required name=search_term_string',
    },
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
    isPartOf: { '@type': 'WebSite', name: 'HomeCheff', url: input.domain },
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
