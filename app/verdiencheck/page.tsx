import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import VerdienCheckWizard from '@/components/verdiencheck/VerdienCheckWizard';
import { isVerdienCheckPublicRouteVisible } from '@/lib/verdiencheck/flags';
import { verdiencheckPageMetadata } from '@/lib/verdiencheck/public-seo';
import { getVerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import { getCurrentLanguage } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return verdiencheckPageMetadata();
}

export default async function VerdienCheckPage() {
  if (!isVerdienCheckPublicRouteVisible()) {
    notFound();
  }
  const language = await getCurrentLanguage();
  return (
    <VerdienCheckWizard
      copy={getVerdienCheckCopy(language)}
      language={language}
    />
  );
}
