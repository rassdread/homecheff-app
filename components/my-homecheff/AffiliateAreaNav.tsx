'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import { MY_HOMECHEFF_HUB_PATH } from '@/lib/navigation/my-homecheff-hub';
import MyHomeCheffBackLink from '@/components/my-homecheff/MyHomeCheffBackLink';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Tab = {
  id: string;
  href: string;
  labelKey: string;
  match: (path: string) => boolean;
};

const AFFILIATE_TABS: Tab[] = [
  {
    id: 'dashboard',
    href: OPERATIONS_ROUTES.affiliate.home,
    labelKey: 'myHomeCheffHub.affiliateNav.dashboard',
    match: (path) => path.startsWith('/affiliate/dashboard'),
  },
  {
    id: 'promo',
    href: OPERATIONS_ROUTES.affiliate.promoCodes,
    labelKey: 'myHomeCheffHub.affiliateNav.promoCodes',
    match: (path) => path.startsWith('/affiliate/promo-codes'),
  },
  {
    id: 'earnings',
    href: OPERATIONS_ROUTES.finance.home,
    labelKey: 'myHomeCheffHub.affiliateNav.earnings',
    match: (path) => path.startsWith('/verdiensten'),
  },
];

export default function AffiliateAreaNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? '';
  const { t } = useTranslation();

  const onAffiliateRoute =
    pathname.startsWith('/affiliate') || pathname.startsWith('/aviliate');

  if (!onAffiliateRoute) {
    return null;
  }

  return (
    <nav
      className={cn(
        'flex flex-col gap-2 border-b border-emerald-100/80 bg-emerald-50/40 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8',
        className,
      )}
      aria-label={t('myHomeCheffHub.affiliateNav.label')}
    >
      <MyHomeCheffBackLink compact />
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {AFFILIATE_TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch={false}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                active
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-900 hover:bg-white/80',
              )}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
        <Link
          href={MY_HOMECHEFF_HUB_PATH}
          prefetch={false}
          className="shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white/80 sm:hidden"
        >
          {t('myHomeCheffHub.nav.hub')}
        </Link>
      </div>
    </nav>
  );
}
