import { redirect } from 'next/navigation';
import { AffiliateDashboardScreen } from './screen';
import { canonicalHrefForLegacyToken } from '@/lib/affiliate/affiliate-sections';

export const dynamic = 'force-dynamic';

function one(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AffiliateDashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const tab = one(searchParams?.tab);
  if ((tab === 'network' || tab === 'sub-affiliates') && one(searchParams?.manage) !== '1') {
    const invite = one(searchParams?.invite) === '1' ? '?invite=1' : '';
    redirect(`/affiliate/partners${invite}`);
  }

  const raw = one(searchParams?.section) ?? tab;
  if (raw) {
    redirect(canonicalHrefForLegacyToken(raw));
  }

  return <AffiliateDashboardScreen place="overzicht" />;
}
