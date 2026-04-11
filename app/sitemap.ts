import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import {
  HOMECHEFF_SEO_PAGE_DEFS,
  getSeoPagePath,
} from '@/lib/seo/homecheffSeoPages'

const BASE_URL = 'https://homecheff.eu'

function staticSeoEntries(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return HOMECHEFF_SEO_PAGE_DEFS.flatMap((p) => [
    {
      url: `${BASE_URL}${getSeoPagePath(p, 'nl')}`,
      lastModified,
    },
    {
      url: `${BASE_URL}${getSeoPagePath(p, 'en')}`,
      lastModified,
    },
  ])
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrls: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/seo-hub`, lastModified: new Date() },
    { url: `${BASE_URL}/growth`, lastModified: new Date() },
    { url: `${BASE_URL}/affiliate`, lastModified: new Date() },
  ]

  try {
    const dishes = await prisma.dish.findMany({
      select: { id: true, category: true, updatedAt: true },
      take: 100,
    })

    const dishUrls = dishes.map((d) => {
      let path = '/recipe'
      if (d.category === 'GROWN') path = '/garden'
      if (d.category === 'DESIGNER') path = '/design'

      return {
        url: `${BASE_URL}${path}/${d.id}`,
        lastModified: d.updatedAt,
      }
    })

    return [
      ...baseUrls,
      ...staticSeoEntries(),
      ...dishUrls,
    ]
  } catch (e) {
    console.error('Sitemap error:', e)
    return [
      ...baseUrls,
      ...staticSeoEntries(),
    ]
  }
}
