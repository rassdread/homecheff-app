import { redirect } from 'next/navigation';
import { AffiliateDashboardScreen } from '../screen';
import {
  affiliatePlaceHref,
  legacyAffiliateSegmentRedirect,
  type AffiliatePlace,
} from '@/lib/affiliate/affiliate-sections';

export const dynamic = 'force-dynamic';

function one(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const DIRECT: Record<string, AffiliatePlace> = {
  promoten: 'promoten',
  verdiensten: 'verdiensten',
  netwerk: 'netwerk',
};

export default async function AffiliateDashboardSectionPage({
  params,
  searchParams,
}: {
  params: { section: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const value = (params.section || '').trim().toLowerCase();
  if (value === 'marketplace' && one(searchParams?.focus) === 'bezorging') {
    redirect(affiliatePlaceHref('bezorging'));
  }
  const legacy = legacyAffiliateSegmentRedirect(value);
  if (legacy && legacy !== `/affiliate/dashboard/${value}`) {
    redirect(legacy);
  }
  const place = DIRECT[value];
  if (!place) redirect('/affiliate/dashboard');
  return <AffiliateDashboardScreen place={place} />;
}
