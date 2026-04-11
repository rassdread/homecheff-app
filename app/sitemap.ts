import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { buildProductSlugPath } from '@/lib/seo/productSlug'
import { LOCAL_SEO_CITIES } from '@/lib/seo/localCities'
import {
  HOMECHEFF_SEO_PAGE_DEFS,
  getSeoPagePath,
} from '@/lib/seo/homecheffSeoPages'
import { MAIN_DOMAIN } from '@/lib/seo/metadata'

function staticHomecheffSeoSitemapEntries(
  baseUrl: string
): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const pages = HOMECHEFF_SEO_PAGE_DEFS.flatMap((p) => [
    {
      url: `${baseUrl}${getSeoPagePath(p, 'nl')}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}${getSeoPagePath(p, 'en')}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ])

  return [
    ...pages,
    {
      url: `${baseUrl}/seo-hub`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.82,
    },
    {
      url: `${baseUrl}/en/seo-hub`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.82,
    },
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = MAIN_DOMAIN
  const now = new Date()

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/seo-hub`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/growth`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/affiliate`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  try {
    const dishes = await prisma.dish.findMany({
      select: { id: true, category: true, updatedAt: true },
      take: 1000,
    })

    const dishUrls = dishes.map((dish) => {
      let path = ''
      if (dish.category === 'CHEFF') path = '/recipe'
      if (dish.category === 'GROWN') path = '/garden'
      if (dish.category === 'DESIGNER') path = '/design'

      return {
        url: `${baseUrl}${path}/${dish.id}`,
        lastModified: dish.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      }
    })

    const products = await prisma.product.findMany({
      where: { isActive: true },
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
    })

    const productUrls = products.map((product) => {
      const slug = buildProductSlugPath(
        product.title,
        product.seller?.User?.place,
        product.id
      )

      return {
        url: `${baseUrl}/product/${slug}`,
        lastModified: product.createdAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      }
    })

    const sellers = await prisma.sellerProfile.findMany({
      select: {
        id: true,
        createdAt: true,
        User: { select: { createdAt: true } },
      },
      take: 500,
    })

    const sellerUrls = sellers.map((s) => ({
      url: `${baseUrl}/seller/${s.id}`,
      lastModified: s.User?.createdAt || s.createdAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const users = await prisma.user.findMany({
      where: {
        showProfileToEveryone: true,
        username: { not: null },
      },
      select: { username: true, updatedAt: true },
      take: 800,
    })

    const userUrls = users.flatMap((u) =>
      u.username
        ? [
            {
              url: `${baseUrl}/user/${u.username}`,
              lastModified: u.updatedAt ?? new Date(),
              changeFrequency: 'weekly',
              priority: 0.65,
            },
          ]
        : []
    )

    const cityUrls = LOCAL_SEO_CITIES.map(({ slug }) => ({
      url: `${baseUrl}/maaltijden/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    }))

    return [
      ...staticUrls,
      ...staticHomecheffSeoSitemapEntries(baseUrl),
      ...dishUrls,
      ...productUrls,
      ...sellerUrls,
      ...userUrls,
      ...cityUrls,
    ]
  } catch (err) {
    console.error('Sitemap error:', err)
    return [
      ...staticUrls,
      ...staticHomecheffSeoSitemapEntries(baseUrl),
    ]
  }
}
