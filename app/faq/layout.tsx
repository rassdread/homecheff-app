import type { Metadata } from 'next';
import Script from 'next/script';
import { getCurrentDomain, getCurrentLanguage } from '@/lib/seo/metadata';

// Helper to get FAQ data for structured data
// Note: We'll generate basic structured data without importing JSON files
// to avoid build-time issues. The FAQ page itself will have the full content.
async function getFAQStructuredData(lang: 'nl' | 'en') {
  // Return empty array - structured data will be added client-side if needed
  // This avoids build-time JSON import issues
  return [];
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  const alternateDomain = currentDomain === 'https://homecheff.eu' ? 'https://homecheff.nl' : 'https://homecheff.eu';
  
  // Extract keywords from FAQ questions
  const keywords = lang === 'en' ? [
    'HomeCheff FAQ', 'homecheff questions', 'homecheff answers',
    'homemade products FAQ', 'local marketplace questions',
    'selling on HomeCheff', 'buying on HomeCheff', 'HomeCheff payments',
    'HomeCheff delivery', 'HomeCheff taxes', 'HomeCheff safety',
    'thuisgemaakte producten vragen', 'lokaal verkopen vragen',
  ] : [
    'HomeCheff FAQ', 'homecheff vragen', 'homecheff antwoorden',
    'thuisgemaakte producten FAQ', 'lokaal marktplaats vragen',
    'verkopen op HomeCheff', 'kopen op HomeCheff', 'HomeCheff betalingen',
    'HomeCheff bezorging', 'HomeCheff belastingen', 'HomeCheff veiligheid',
    'thuisgemaakte producten vragen', 'lokaal verkopen vragen',
  ];
  
  if (lang === 'en') {
    return {
      title: 'Frequently Asked Questions (FAQ) - HomeCheff',
      description: 'Find answers to frequently asked questions about HomeCheff. Everything you want to know about homemade products, orders, payments and more.',
      keywords,
      openGraph: {
        title: 'Frequently Asked Questions (FAQ) - HomeCheff',
        description: 'Find answers to frequently asked questions about HomeCheff. Everything about homemade products, local marketplace, selling and buying.',
        type: 'website',
        url: `${currentDomain}/faq`,
      },
      alternates: {
        canonical: `${currentDomain}/faq`,
        languages: {
          'nl-NL': `${alternateDomain}/faq`,
          'en-US': `${currentDomain}/faq`,
        },
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  
  return {
    title: 'Veelgestelde Vragen (FAQ) - HomeCheff',
    description: 'Vind antwoorden op veelgestelde vragen over HomeCheff. Alles wat je wilt weten over thuisgemaakte producten, bestellingen, betalingen en meer.',
    keywords,
    openGraph: {
      title: 'Veelgestelde Vragen (FAQ) - HomeCheff',
      description: 'Vind antwoorden op veelgestelde vragen over HomeCheff. Alles over thuisgemaakte producten, lokale marktplaats, verkopen en kopen.',
      type: 'website',
      url: `${currentDomain}/faq`,
    },
    alternates: {
      canonical: `${currentDomain}/faq`,
      languages: {
        'nl-NL': `${currentDomain}/faq`,
        'en-US': `${alternateDomain}/faq`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getCurrentLanguage();
  const currentDomain = await getCurrentDomain();
  
  // Generate FAQ structured data
  let mainEntity: any[] = [];
  try {
    mainEntity = await getFAQStructuredData(lang);
  } catch (error) {
    console.error('Error generating FAQ structured data:', error);
  }
  
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: mainEntity.slice(0, 50), // Limit to 50 for performance
  };
  
  return (
    <>
      {mainEntity.length > 0 && (
        <Script
          id="faq-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      )}
      {children}
    </>
  );
}

