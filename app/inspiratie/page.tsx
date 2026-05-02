import { redirect } from 'next/navigation';

type InspiratieSearchParams = {
  bron?: string | string[];
  tour?: string | string[];
};

function firstString(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Eén Discover-ervaring staat op `/`. Oude hub-URL `/inspiratie` blijft bruikbaar
 * via redirect (o.a. `?bron=dorpsplein` → `/?chip=sale`, `?tour=chain` behouden).
 */
export default function InspiratieDiscoverRedirectPage({
  searchParams,
}: {
  searchParams: InspiratieSearchParams;
}) {
  const bron = firstString(searchParams?.bron);
  const tour = firstString(searchParams?.tour);

  const params = new URLSearchParams();
  if (bron === 'dorpsplein') params.set('chip', 'sale');
  if (tour) params.set('tour', tour);

  const qs = params.toString();
  redirect(qs ? `/?${qs}` : '/');
}
