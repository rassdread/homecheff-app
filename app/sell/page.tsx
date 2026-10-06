import type { Metadata } from 'next';
import SellPageClient from '@/components/sell/SellPageClient';
import BusinessPlanPublicFacts from '@/components/business/BusinessPlanPublicFacts';
import {
  getCurrentDomain,
  getCurrentLanguage,
  seoHreflangLanguagesOnEu,
} from '@/lib/seo/metadata';
import { publicPlanFacts } from '@/lib/business/plan-presentation';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  const domain = await getCurrentDomain();
  const path = '/sell';
  const facts = publicPlanFacts(lang === 'en' ? 'en' : 'nl');
  const line = facts.map((fact) => `${fact.name} ${fact.priceLabel}, ${fact.commissionPercent}%`).join('. ');
  const title =
    lang === 'en'
      ? 'HomeCheff for business | plans, fees and visibility'
      : 'HomeCheff zakelijk | abonnementen, kosten en zichtbaarheid';
  const description =
    lang === 'en'
      ? `${line}. Sponsored visibility only when the offer is relevant. No paid place in ordinary results and no guaranteed views.`
      : `${line}. Gesponsorde zichtbaarheid alleen als het aanbod relevant is. Geen betaalde plek in de gewone resultaten en geen gegarandeerde vertoningen.`;
  return {
    title,
    description,
    alternates: {
      canonical: `${domain}${path}`,
      languages: seoHreflangLanguagesOnEu(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `${domain}${path}`,
      siteName: 'HomeCheff',
      locale: lang === 'en' ? 'en_US' : 'nl_NL',
      type: 'website',
    },
  };
}

export default async function SellPage() {
  const lang = await getCurrentLanguage();
  return (
    <>
      <BusinessPlanPublicFacts lang={lang === 'en' ? 'en' : 'nl'} />
      <SellPageClient />
    </>
  );
}
