import type { Metadata } from 'next';
import EarnHowItWorksPage from '@/components/verdien/EarnHowItWorksPage';
import { getEarnHowItWorksCopy } from '@/lib/i18n/earnHowItWorksSources';
import { MAIN_DOMAIN, getCurrentLanguage } from '@/lib/seo/metadata';
import {
  CAREERS_EN_PATHS,
  careersHreflangLanguages,
} from '@/lib/navigation/public-careers-nav';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const copy = getEarnHowItWorksCopy(lang);
  const path = CAREERS_EN_PATHS.howItWorks;
  const url = `${MAIN_DOMAIN}${path}`;

  return {
    title: copy.meta.title,
    description: copy.meta.description,
    alternates: {
      canonical: url,
      languages: careersHreflangLanguages('howItWorks'),
    },
    openGraph: {
      title: copy.meta.title,
      description: copy.meta.description,
      url,
      siteName: 'HomeCheff',
      locale: lang === 'en' ? 'en_GB' : 'nl_NL',
      type: 'website',
      images: [{ url: `${MAIN_DOMAIN}${path}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.meta.title,
      description: copy.meta.description,
      images: [`${MAIN_DOMAIN}${path}/opengraph-image`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CareersHowItWorksPage() {
  const lang = await getCurrentLanguage();
  return (
    <EarnHowItWorksPage copy={getEarnHowItWorksCopy(lang)} initialLang={lang} />
  );
}
