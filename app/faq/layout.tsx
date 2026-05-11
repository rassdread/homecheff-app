import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';
import { getFaqPageJsonLd } from '@/lib/seo/faqStructuredData';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();

  const keywords =
    lang === 'en'
      ? [
          'HomeCheff FAQ',
          'homecheff questions',
          'homemade marketplace',
          'local makers',
          'side income from home',
          'HCP leaderboards',
          'village square',
          'inspiration feed',
          'Dorpsplein',
          'Stripe payouts',
        ]
      : [
          'HomeCheff FAQ',
          'homecheff vragen',
          'lokale makers',
          'zelfgemaakt eten',
          'thuis verdienen',
          'HCP ranglijsten',
          'dorpsplein',
          'inspiratie',
          'lokale community marketplace',
          'uitbetaling Stripe',
        ];

  if (lang === 'en') {
    return {
      title: 'Frequently Asked Questions (FAQ) - HomeCheff',
      description:
        'Answers about HomeCheff: local homemade food, the village feed, inspiration, HCP points, selling from home, payments, delivery, and community trust.',
      keywords,
      openGraph: {
        title: 'Frequently Asked Questions (FAQ) - HomeCheff',
        description:
          'Homemade marketplace, local creators, inspiration, HCP, and safe buying — clear answers in one place.',
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
    description:
      'Antwoorden over HomeCheff: lokaal zelfgemaakt eten, Dorpsplein, inspiratie, HCP-punten, verkopen vanuit huis, betalingen, levering en vertrouwen in de community.',
    keywords,
    openGraph: {
      title: 'Veelgestelde Vragen (FAQ) - HomeCheff',
      description:
        'Lokale makers, dorpsplein, inspiratie, HCP en veilig kopen — heldere antwoorden op één plek.',
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
