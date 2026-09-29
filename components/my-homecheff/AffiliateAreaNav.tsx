'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
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

const linkClass = (active: boolean) =>
  cn(
    'inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800',
    active ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-950 hover:bg-emerald-100',
  );

export default function AffiliateAreaNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const { tOr } = useTranslation();
  const onAffiliateRoute = pathname.startsWith('/affiliate') || pathname.startsWith('/aviliate');
  const section = resolveAffiliateSection(searchParams?.get('section') ?? searchParams?.get('tab'));
  const onDashboard = pathname.startsWith('/affiliate/dashboard');
  const secondaryActive =
    pathname.startsWith('/affiliate/partners') ||
    pathname.startsWith('/affiliate/promotiemateriaal') ||
    (onDashboard && !['overzicht', 'verdienen', 'verdiensten'].includes(section));
  const [moreOpen, setMoreOpen] = useState(secondaryActive);

  if (!onAffiliateRoute) return null;

  const primary: Item[] = [
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
  ];

  const groups: { id: string; labelEn: string; labelNl: string; items: Item[] }[] = [
    {
      id: 'promoten',
      labelEn: 'Promote',
      labelNl: 'Promoten',
      items: [
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
      ],
    },
    {
      id: 'netwerk',
      labelEn: 'Network',
      labelNl: 'Netwerk',
      items: [
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
      ],
    },
    {
      id: 'tools',
      labelEn: 'Tools',
      labelNl: 'Tools',
      items: [
        {
          id: 'promotiemateriaal',
          href: '/affiliate/promotiemateriaal',
          labelEn: 'Promotional material',
          labelNl: 'Promotiemateriaal',
          active: pathname.startsWith('/affiliate/promotiemateriaal'),
        },
      ],
    },
  ];

  return (
    <nav
      className={cn('border-b border-emerald-100/80 bg-emerald-50/40 px-4 py-3 sm:px-6 lg:px-8', className)}
      aria-label={tOr('affiliate.nav.label', 'Affiliate', 'Affiliate')}
      data-affiliate-ecosystem-nav
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {primary.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            data-affiliate-nav={item.id}
            aria-current={item.active ? 'page' : undefined}
            className={linkClass(item.active)}
          >
            {tOr(`affiliate.nav.${item.id}`, item.labelEn, item.labelNl)}
          </Link>
        ))}
        <button
          type="button"
          className={cn(linkClass(secondaryActive), 'lg:hidden')}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          {tOr('affiliate.nav.more', 'More', 'Meer')}
        </button>
      </div>
      <div className={cn('mt-3 grid gap-4 sm:grid-cols-3', moreOpen ? 'grid' : 'hidden lg:grid')}>
        {groups.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-900">
              {tOr(`affiliate.nav.group.${group.id}`, group.labelEn, group.labelNl)}
            </p>
            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={false}
                  data-affiliate-nav={item.id}
                  aria-current={item.active ? 'page' : undefined}
                  className={linkClass(item.active)}
                >
                  {tOr(`affiliate.nav.${item.id}`, item.labelEn, item.labelNl)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
