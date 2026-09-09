import type { Metadata } from 'next';
import { getCurrentLanguage, getCurrentDomain, seoHreflangLanguagesOnEu } from '@/lib/seo/metadata';
import { opportunityOgImageUrl } from '@/lib/share/homecheff-share-payload';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/share/og-opportunity';
import { getOpportunityShareCopy } from '@/lib/share/opportunity-share-copy';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const domain = await getCurrentDomain();
  const copy = getOpportunityShareCopy('affiliate_company', lang);
  const path = '/affiliate/company';
  const image = opportunityOgImageUrl('affiliate_company', domain);

  return {
    title: copy.ogTitle,
    description: copy.ogDescription,
    openGraph: {
      title: copy.ogTitle,
      description: copy.ogDescription,
      type: 'website',
      url: `${domain}${path}`,
      siteName: 'HomeCheff',
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: copy.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.ogTitle,
      description: copy.ogDescription,
      images: [image],
    },
    alternates: {
      canonical: `${domain}${path}`,
      languages: seoHreflangLanguagesOnEu(path),
    },
    robots: { index: true, follow: true },
  };
}

export default function AffiliateCompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
