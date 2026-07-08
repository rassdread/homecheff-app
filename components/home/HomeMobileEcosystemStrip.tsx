'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Compact mobile-only discovery strip (Phase 5C).
 * Communicates the HomeCheff pillars (Eten · Tuin · Creaties · Gezocht · Diensten)
 * and, for logged-in users, surfaces Mijn Afspraken. Deep-links reuse the existing
 * homepage query params (?vertical / ?chip) — no new fetch path, no GeoFeed remount.
 */

type EcosystemPill = {
  key: string;
  labelKey: string;
  href: string;
  emoji: string;
};

const PILLS: EcosystemPill[] = [
  { key: 'food', labelKey: 'home.ecosystem.food', href: '/?vertical=cheff#homecheff-feed', emoji: '🍲' },
  { key: 'garden', labelKey: 'home.ecosystem.garden', href: '/?vertical=garden#homecheff-feed', emoji: '🌱' },
  { key: 'creations', labelKey: 'home.ecosystem.creations', href: '/?vertical=designer#homecheff-feed', emoji: '🎨' },
  { key: 'gezocht', labelKey: 'home.ecosystem.gezocht', href: '/?chip=gezocht#homecheff-feed', emoji: '🙋' },
  { key: 'services', labelKey: 'home.ecosystem.services', href: '/?chip=services#homecheff-feed', emoji: '🛠️' },
];

export default function HomeMobileEcosystemStrip({
  isLoggedIn = false,
  className = '',
}: {
  isLoggedIn?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('home.ecosystem.ariaLabel')}
      className={`md:hidden ${className}`}
    >
      <p className="mb-1 px-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {t('home.ecosystem.title')}
      </p>
      {!isLoggedIn ? (
        <p className="mb-2 px-0.5 text-xs leading-snug text-gray-600">
          {t('homePhase1.heroDefinition')}
        </p>
      ) : null}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PILLS.map((pill) => (
          <Link
            key={pill.key}
            href={pill.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-primary-brand/40 hover:text-primary-brand"
          >
            <span aria-hidden>{pill.emoji}</span>
            {t(pill.labelKey)}
          </Link>
        ))}
        {isLoggedIn ? (
          <Link
            href="/profile/deals"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm transition-colors hover:border-emerald-300"
          >
            <span aria-hidden>🤝</span>
            {t('agreements.myAgreements')}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
