'use client';

import Link from 'next/link';
import { ECOSYSTEM_PUBLIC_URLS } from '@/lib/seo/ecosystem-participation';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  linkClassName?: string;
  moreClassName?: string;
  /** Light text on green hero vs dark on pale band */
  tone?: 'onHero' | 'onBand';
};

/**
 * Crawlable ecosystem switcher — compact inline nav for merged marketplace header.
 */
export default function HomepageEcosystemNavLinks({
  className = '',
  linkClassName = '',
  moreClassName = '',
  tone = 'onBand',
}: Props) {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const more = isEn ? 'How the ecosystem works' : 'Hoe het ecosysteem werkt';
  const links = [
    { href: '/', label: isEn ? 'Marketplace' : 'Marketplace' },
    { href: ECOSYSTEM_PUBLIC_URLS.studioLanding, label: 'Studio' },
    { href: ECOSYSTEM_PUBLIC_URLS.growthLanding, label: 'Growth' },
    { href: ECOSYSTEM_PUBLIC_URLS.affiliate, label: isEn ? 'Affiliate' : 'Affiliate' },
  ] as const;

  const defaultLink =
    tone === 'onHero'
      ? 'text-white/90 underline-offset-2 hover:text-white hover:underline'
      : 'text-emerald-900 underline-offset-2 hover:underline';
  const defaultMore =
    tone === 'onHero'
      ? 'rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-white hover:bg-white/25'
      : 'rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-emerald-950 hover:bg-emerald-50';

  return (
    <nav
      className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold sm:text-xs', className)}
      aria-label={isEn ? 'HomeCheff ecosystem' : 'HomeCheff-ecosysteem'}
    >
      {links.map((link) =>
        link.href.startsWith('http') ? (
          <a
            key={link.href}
            href={link.href}
            className={cn(defaultLink, linkClassName)}
          >
            {link.label}
          </a>
        ) : (
          <Link
            key={link.href}
            href={link.href}
            className={cn(defaultLink, linkClassName)}
          >
            {link.label}
          </Link>
        ),
      )}
      <Link
        href={ECOSYSTEM_PUBLIC_URLS.ecosystem}
        className={cn(defaultMore, moreClassName)}
      >
        {more}
      </Link>
    </nav>
  );
}
