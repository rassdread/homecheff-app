import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

// Get base URL from environment or default
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://homecheff.nl';
};

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Generate URLs for both languages
  const nlBaseUrl = 'https://homecheff.nl';
  const enBaseUrl = 'https://homecheff.eu';
  
  const baseUrls = [
    // Dutch URLs
    {
      url: nlBaseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${nlBaseUrl}/dorpsplein`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${nlBaseUrl}/inspiratie`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${nlBaseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${nlBaseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${nlBaseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${nlBaseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${nlBaseUrl}/werken-bij`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // English URLs
    {
      url: enBaseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${enBaseUrl}/dorpsplein`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${enBaseUrl}/inspiratie`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${enBaseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${enBaseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${enBaseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${enBaseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${enBaseUrl}/werken-bij`,
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

    const dishUrls = dishes.flatMap((dish) => {
      let path = '';
      if (dish.category === 'CHEFF') {
        path = '/recipe';
      } else if (dish.category === 'GROWN') {
        path = '/garden';
      } else if (dish.category === 'DESIGNER') {
        path = '/design';
      }

      // Return URLs for both languages
      return [
        {
          url: `${nlBaseUrl}${path}/${dish.id}`,
          lastModified: dish.updatedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
        {
          url: `${enBaseUrl}${path}/${dish.id}`,
          lastModified: dish.updatedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
      ];
    });

    // Get all public products
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        createdAt: true,
      },
      take: 1000,
    });

    const productUrls = products.flatMap((product) => [
      {
        url: `${nlBaseUrl}/product/${product.id}`,
        lastModified: product.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${enBaseUrl}/product/${product.id}`,
        lastModified: product.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ]);

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

    const sellerUrls = sellers.flatMap((seller) => [
      {
        url: `${nlBaseUrl}/seller/${seller.id}`,
        lastModified: seller.User?.createdAt || seller.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${enBaseUrl}/seller/${seller.id}`,
        lastModified: seller.User?.createdAt || seller.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ]);

    return [...baseUrls, ...dishUrls, ...productUrls, ...sellerUrls];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return base URLs even if database query fails
    return baseUrls;
  }
}

