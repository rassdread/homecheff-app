'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { affiliateSectionHref, resolveAffiliateSection } from '@/lib/affiliate/affiliate-sections';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  href: string;
  labelEn: string;
  labelNl: string;
  active: boolean;
};

export default function AffiliateAreaNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const { tOr } = useTranslation();
  const onAffiliateRoute = pathname.startsWith('/affiliate') || pathname.startsWith('/aviliate');
  if (!onAffiliateRoute) return null;

  const section = resolveAffiliateSection(searchParams?.get('section') ?? searchParams?.get('tab'));
  const onDashboard = pathname.startsWith('/affiliate/dashboard');

  const items: Item[] = [
    {
      id: 'overzicht',
      href: affiliateSectionHref('overzicht'),
      labelEn: 'Overview',
      labelNl: 'Overzicht',
      active: onDashboard && section === 'overzicht',
    },
    {
      id: 'verdienen',
      href: affiliateSectionHref('verdienen'),
      labelEn: 'Earn',
      labelNl: 'Verdienen',
      active: onDashboard && section === 'verdienen',
    },
    {
      id: 'verdiensten',
      href: affiliateSectionHref('verdiensten'),
      labelEn: 'Earnings',
      labelNl: 'Verdiensten',
      active: onDashboard && section === 'verdiensten',
    },
    {
      id: 'marketplace',
      href: affiliateSectionHref('marketplace'),
      labelEn: 'Marketplace',
      labelNl: 'Marketplace',
      active: onDashboard && section === 'marketplace',
    },
    {
      id: 'growth',
      href: affiliateSectionHref('growth'),
      labelEn: 'Growth',
      labelNl: 'Growth',
      active: onDashboard && section === 'growth',
    },
    {
      id: 'studio',
      href: affiliateSectionHref('studio'),
      labelEn: 'Studio',
      labelNl: 'Studio',
      active: onDashboard && section === 'studio',
    },
    {
      id: 'aanmeldingen',
      href: affiliateSectionHref('aanmeldingen'),
      labelEn: 'Sign-ups',
      labelNl: 'Aanmeldingen',
      active: onDashboard && section === 'aanmeldingen',
    },
    {
      id: 'partners',
      href: '/affiliate/partners',
      labelEn: 'Partners',
      labelNl: 'Partners',
      active: pathname.startsWith('/affiliate/partners'),
    },
    {
      id: 'promotiemateriaal',
      href: '/affiliate/promotiemateriaal',
      labelEn: 'Promotional material',
      labelNl: 'Promotiemateriaal',
      active: pathname.startsWith('/affiliate/promotiemateriaal'),
    },
  ];

  return (
    <nav
      className={cn('border-b border-emerald-100/80 bg-emerald-50/40 px-4 py-3 sm:px-6 lg:px-8', className)}
      aria-label={tOr('affiliate.nav.label', 'Affiliate', 'Affiliate')}
      data-affiliate-ecosystem-nav
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:flex lg:flex-wrap">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            data-affiliate-nav={item.id}
            className={cn(
              'inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-semibold',
              item.active ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-950 hover:bg-emerald-100',
            )}
          >
            {tOr(`affiliate.nav.${item.id}`, item.labelEn, item.labelNl)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
