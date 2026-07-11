import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';
import { getFaqPageJsonLd } from '@/lib/seo/faqStructuredData';
import { getPlatformDefinition } from '@/lib/seo/platform-definition';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const platform = getPlatformDefinition(lang);

  const keywords =
    lang === 'en'
      ? [
          'HomeCheff FAQ',
          'personal craftsmanship',
          'local makers',
          'earn locally',
          'neighbour help',
          'village square',
          'HCP',
          'Stripe payouts',
        ]
      : [
          'HomeCheff FAQ',
          'persoonlijk vakmanschap',
          'lokale makers',
          'lokaal verdienen',
          'buurthulp',
          'dorpsplein',
          'HCP',
          'uitbetaling Stripe',
        ];

  const description =
    lang === 'en'
      ? `Answers about HomeCheff: ${platform.entityDefinition} Fees, payouts, barter, neighbour help and trust.`
      : `Antwoorden over HomeCheff: ${platform.entityDefinition} Fees, uitbetalingen, ruil, buurthulp en vertrouwen.`;

  if (lang === 'en') {
    return {
      title: 'Frequently Asked Questions (FAQ) - HomeCheff',
      description,
      keywords,
      openGraph: {
        title: 'Frequently Asked Questions (FAQ) - HomeCheff',
        description,
        type: 'website',
        url: `${currentDomain}/faq`,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'HomeCheff FAQ',
        description: 'Local makers, village feed, inspiration, HCP, and payments — quick answers.',
      },
      alternates: {
        canonical: `${currentDomain}/faq`,
        languages: seoHreflangLanguagesOnEu('/faq'),
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    title: 'Veelgestelde Vragen (FAQ) - HomeCheff',
    description,
    keywords,
    openGraph: {
      title: 'Veelgestelde Vragen (FAQ) - HomeCheff',
      description,
      type: 'website',
      url: `${currentDomain}/faq`,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'HomeCheff FAQ',
      description: 'Lokale makers, Dorpsplein, inspiratie, HCP en betalingen — korte antwoorden.',
    },
    alternates: {
      canonical: `${currentDomain}/faq`,
      languages: seoHreflangLanguagesOnEu('/faq'),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function FAQLayout({ children }: { children: ReactNode }) {
  const lang = await getCurrentLanguage();
  const faqStructuredData = getFaqPageJsonLd(lang);

  return (
    <>
      <Script
        id="faq-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {children}
    </>
  );
}
