import { redirect } from 'next/navigation';
import { AffiliateDashboardScreen } from '../../screen';
import { affiliatePlaceHref, type AffiliatePlace } from '@/lib/affiliate/affiliate-sections';

export const dynamic = 'force-dynamic';

const PROMOTE: Record<string, AffiliatePlace> = {
  marketplace: 'marketplace',
  growth: 'growth',
  studio: 'studio',
  bezorging: 'bezorging',
};

export default async function AffiliateDashboardNestedPage({
  params,
}: {
  params: { section: string; area: string };
}) {
  const section = (params.section || '').trim().toLowerCase();
  const area = (params.area || '').trim().toLowerCase();
  if (section === 'promoten' && PROMOTE[area]) {
    return <AffiliateDashboardScreen place={PROMOTE[area]} />;
  }
  if (section === 'netwerk' && area === 'aanmeldingen') {
    return <AffiliateDashboardScreen place="aanmeldingen" />;
  }
  if (section === 'promoten') redirect(affiliatePlaceHref('promoten'));
  if (section === 'netwerk') redirect(affiliatePlaceHref('netwerk'));
  redirect('/affiliate/dashboard');
}
