import Link from 'next/link';
import { ECOSYSTEM_LOOP, ECOSYSTEM_PUBLIC_URLS } from '@/lib/seo/ecosystem-participation';

/**
 * SEO 1 — crawlable, compact homepage signal.
 * Marketplace feed remains primary; this explains the wider ecosystem without a manifesto.
 */
export default function HomepageEcosystemSignal({
  lang = 'nl',
}: {
  lang?: 'nl' | 'en';
}) {
  const isEn = lang === 'en';
  const title = isEn
    ? 'Everyone gets a seat at the table.'
    : 'Iedereen eet mee.';
  const body = isEn
    ? 'HomeCheff is the marketplace — and part of a wider ecosystem to create, sell, promote and grow.'
    : 'HomeCheff is de marktplaats — en onderdeel van een breder ecosysteem om te maken, verkopen, promoten en groeien.';
  const more = isEn ? 'How the ecosystem works' : 'Hoe het ecosysteem werkt';

  const links = [
    { href: '/', label: isEn ? 'Marketplace' : 'Marketplace' },
    { href: ECOSYSTEM_PUBLIC_URLS.studioLanding, label: 'Studio' },
    { href: ECOSYSTEM_PUBLIC_URLS.growthLanding, label: 'Growth' },
    { href: ECOSYSTEM_PUBLIC_URLS.affiliate, label: isEn ? 'Affiliate' : 'Affiliate' },
  ] as const;

  return (
    <aside
      className="border-b border-emerald-100/90 bg-gradient-to-r from-emerald-50/95 via-white to-slate-50/90"
      aria-labelledby="homepage-ecosystem-signal-title"
      data-hc-ecosystem-participation-signal="1"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="min-w-0">
          <p
            id="homepage-ecosystem-signal-title"
            className="text-sm font-semibold tracking-tight text-emerald-950"
          >
            HomeCheff — {title}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-slate-600 sm:text-[13px]">
            {body}{' '}
            <span className="font-medium text-slate-700">{ECOSYSTEM_LOOP}</span>
          </p>
        </div>
        <nav
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-emerald-900"
          aria-label={isEn ? 'HomeCheff ecosystem' : 'HomeCheff-ecosysteem'}
        >
          {links.map((link) =>
            link.href.startsWith('http') ? (
              <a
                key={link.href}
                href={link.href}
                className="underline-offset-2 hover:underline"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="underline-offset-2 hover:underline"
              >
                {link.label}
              </Link>
            ),
          )}
          <Link
            href={ECOSYSTEM_PUBLIC_URLS.ecosystem}
            className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-emerald-950 hover:bg-emerald-50"
          >
            {more}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
