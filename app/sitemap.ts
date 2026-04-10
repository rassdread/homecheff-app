import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { buildProductSlugPath } from '@/lib/seo/productSlug';
import { LOCAL_SEO_CITIES } from '@/lib/seo/localCities';
import {
  HOMECHEFF_SEO_PAGE_DEFS,
  getSeoPagePath,
} from '@/lib/seo/homecheffSeoPages';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';

/** SEO-landings + hubs: alleen homecheff.eu (canoniek); .nl redirect, geen dubbele SEO-URL’s. */
function staticHomecheffSeoSitemapEntries(
  euBaseUrl: string
): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pageEntries = HOMECHEFF_SEO_PAGE_DEFS.flatMap((p) => [
    {
      url: `${euBaseUrl}${getSeoPagePath(p, 'nl')}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${euBaseUrl}${getSeoPagePath(p, 'en')}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
  ]);
  const hubEntries: MetadataRoute.Sitemap = [
    {
      url: `${euBaseUrl}/seo-hub`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.82,
    },
    {
      url: `${euBaseUrl}/en/seo-hub`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.82,
    },
  ];
  return [...pageEntries, ...hubEntries];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /** Canoniek domein voor sitemap (geen homecheff.nl-dubbels). */
  const siteBaseUrl = MAIN_DOMAIN;

  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: siteBaseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${siteBaseUrl}/dorpsplein`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${siteBaseUrl}/inspiratie`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${siteBaseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${siteBaseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${siteBaseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${siteBaseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${siteBaseUrl}/werken-bij`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${siteBaseUrl}/over-ons`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // Get all public dishes (recipes, garden projects, designs)
  try {
    const dishes = await prisma.dish.findMany({
      select: {
        id: true,
        category: true,
        updatedAt: true,
      },
      take: 1000, // Limit to prevent too large sitemap
    });

    const dishUrls = dishes.map((dish) => {
      let path = '';
      if (dish.category === 'CHEFF') {
        path = '/recipe';
      } else if (dish.category === 'GROWN') {
        path = '/garden';
      } else if (dish.category === 'DESIGNER') {
        path = '/design';
      }

      return {
        url: `${siteBaseUrl}${path}/${dish.id}`,
        lastModified: dish.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });

    // Get all public products
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        seller: {
          select: {
            User: { select: { place: true } },
          },
        },
      },
      take: 1000,
    });

    const productUrls = products.map((product) => {
      const slug = buildProductSlugPath(
        product.title,
        product.seller?.User?.place,
        product.id
      );
      return {
        url: `${siteBaseUrl}/product/${slug}`,
        lastModified: product.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });

    // Get all public sellers (use SellerProfile.id, not User.id)
    const sellers = await prisma.sellerProfile.findMany({
      select: {
        id: true,
        createdAt: true,
        User: {
          select: {
            createdAt: true,
          }
        }
      },
      take: 500,
    });

    const sellerUrls = sellers.map((seller) => ({
      url: `${siteBaseUrl}/seller/${seller.id}`,
      lastModified: seller.User?.createdAt || seller.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const publicUsers = await prisma.user.findMany({
      where: {
        showProfileToEveryone: true,
        username: { not: null },
      },
      select: {
        username: true,
        updatedAt: true,
      },
      take: 800,
    });

    const userProfileUrls = publicUsers.flatMap((u) => {
      if (!u.username) return [];
      const lm = u.updatedAt ?? new Date();
      return [
        {
          url: `${siteBaseUrl}/user/${u.username}`,
          lastModified: lm,
          changeFrequency: 'weekly' as const,
          priority: 0.65,
        },
      ];
    });

    const maaltijdenUrls = LOCAL_SEO_CITIES.map(({ slug }) => ({
      url: `${siteBaseUrl}/maaltijden/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));

    return [
      ...baseUrls,
      ...staticHomecheffSeoSitemapEntries(siteBaseUrl),
      ...dishUrls,
      ...productUrls,
      ...sellerUrls,
      ...userProfileUrls,
      ...maaltijdenUrls,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [
      ...baseUrls,
      ...staticHomecheffSeoSitemapEntries(siteBaseUrl),
    ];
  }
}

