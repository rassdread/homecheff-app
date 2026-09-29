import { redirect } from 'next/navigation';
import { AffiliateDashboardScreen } from '../screen';
import { AFFILIATE_SECTIONS, type AffiliateSection } from '@/lib/affiliate/affiliate-sections';

export const dynamic = 'force-dynamic';

function one(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AffiliateDashboardSectionPage({
  params,
  searchParams,
}: {
  params: { section: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const value = (params.section || '').trim().toLowerCase();
  if (!(AFFILIATE_SECTIONS as readonly string[]).includes(value) || value === 'overzicht') {
    redirect('/affiliate/dashboard');
  }
  return (
    <AffiliateDashboardScreen
      section={value as AffiliateSection}
      marketplaceFocus={value === 'marketplace' ? one(searchParams?.focus) : null}
    />
  );
}
