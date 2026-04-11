import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/sms/',
          '/social-login-success/',
        ],
      },
    ],
    sitemap: 'https://homecheff.eu/sitemap.xml',
  }
}
