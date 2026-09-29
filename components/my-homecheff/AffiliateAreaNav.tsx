'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  affiliatePlaceFromPathname,
  affiliatePlaceHref,
  isNetworkPlace,
  isPromotePlace,
  type AffiliatePlace,
} from '@/lib/affiliate/affiliate-sections';
import { cn } from '@/lib/utils';

const primaryClass = (active: boolean) =>
  cn(
    'inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800',
    active ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-950 hover:bg-emerald-100',
  );

const childClass = (active: boolean) =>
  cn(
    'inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold',
    active ? 'bg-emerald-800 text-white' : 'text-emerald-950 hover:bg-emerald-100',
  );

export default function AffiliateAreaNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const { tOr } = useTranslation();
  const onAffiliateRoute = pathname.startsWith('/affiliate') || pathname.startsWith('/aviliate');
  const place = affiliatePlaceFromPathname(pathname);
  const promoProduct = pathname.startsWith('/affiliate/promo-codes') ? searchParams?.get('product') : null;
  const promoPlace: AffiliatePlace | null =
    promoProduct === 'GROWTH' ? 'growth' : promoProduct === 'HOMECHEFF' ? 'marketplace' : null;
  const current = place ?? promoPlace;
  const showPromote = isPromotePlace(current) || promoPlace != null;
  const showNetwork =
    isNetworkPlace(current) ||
    pathname.startsWith('/affiliate/partners') ||
    pathname.startsWith('/aviliate/partners');

  if (!onAffiliateRoute) return null;

  const primary: { id: AffiliatePlace; en: string; nl: string; active: boolean }[] = [
    { id: 'overzicht', en: 'Overview', nl: 'Overzicht', active: current === 'overzicht' },
    { id: 'promoten', en: 'Promote', nl: 'Promoten', active: showPromote },
    { id: 'verdiensten', en: 'Earnings', nl: 'Verdiensten', active: current === 'verdiensten' },
    {
      id: 'netwerk',
      en: 'Network',
      nl: 'Netwerk',
      active: showNetwork,
    },
  ];

  const promoteChildren: { id: AffiliatePlace; en: string; nl: string }[] = [
    { id: 'marketplace', en: 'Marketplace', nl: 'Marketplace' },
    { id: 'growth', en: 'Growth', nl: 'Growth' },
    { id: 'studio', en: 'Studio', nl: 'Studio' },
    { id: 'bezorging', en: 'Delivery', nl: 'Bezorging' },
  ];

  return (
    <nav
      className={cn('border-b border-emerald-100/80 bg-emerald-50/50 px-4 py-3 sm:px-6 lg:px-8', className)}
      aria-label={tOr('affiliate.nav.label', 'Affiliate', 'Affiliate')}
      data-affiliate-ecosystem-nav
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1.5">
        {primary.map((item) => (
          <Link
            key={item.id}
            href={affiliatePlaceHref(item.id)}
            prefetch={false}
            data-affiliate-nav={item.id}
            aria-current={item.active ? 'page' : undefined}
            className={primaryClass(item.active)}
          >
            {tOr(`affiliate.nav.${item.id}`, item.en, item.nl)}
          </Link>
        ))}
        <Link
          href="/affiliate/promotiemateriaal"
          prefetch={false}
          data-affiliate-nav="promotiemateriaal"
          aria-current={pathname.startsWith('/affiliate/promotiemateriaal') ? 'page' : undefined}
          className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-emerald-900 underline-offset-2 hover:underline"
        >
          {tOr('affiliate.nav.promotiemateriaal', 'Promotional material', 'Promotiemateriaal')}
        </Link>
      </div>
      {showPromote ? (
        <div className="mx-auto mt-2 flex max-w-5xl flex-wrap gap-1">
          {promoteChildren.map((item) => (
            <Link
              key={item.id}
              href={affiliatePlaceHref(item.id)}
              prefetch={false}
              data-affiliate-nav={item.id}
              aria-current={current === item.id ? 'page' : undefined}
              className={childClass(current === item.id)}
            >
              {tOr(`affiliate.nav.${item.id}`, item.en, item.nl)}
            </Link>
          ))}
        </div>
      ) : null}
      {showNetwork ? (
        <div className="mx-auto mt-2 flex max-w-5xl flex-wrap gap-1">
          <Link
            href={affiliatePlaceHref('aanmeldingen')}
            prefetch={false}
            data-affiliate-nav="aanmeldingen"
            aria-current={current === 'aanmeldingen' ? 'page' : undefined}
            className={childClass(current === 'aanmeldingen')}
          >
            {tOr('affiliate.nav.aanmeldingen', 'Sign-ups', 'Aanmeldingen')}
          </Link>
          <Link
            href="/affiliate/partners"
            prefetch={false}
            data-affiliate-nav="partners"
            aria-current={pathname.startsWith('/affiliate/partners') ? 'page' : undefined}
            className={childClass(pathname.startsWith('/affiliate/partners'))}
          >
            {tOr('affiliate.nav.partners', 'Partners', 'Partners')}
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
