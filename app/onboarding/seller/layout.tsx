import type { Metadata } from 'next';
import { getCurrentLanguage } from '@/lib/seo/metadata';
import { MAIN_DOMAIN } from '@/lib/seo/constants';
import { buildOpportunityOpenGraphMetadata } from '@/lib/share/og-opportunity';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getCurrentLanguage();
  return buildOpportunityOpenGraphMetadata('seller', lang, MAIN_DOMAIN);
}

export default function SellerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
