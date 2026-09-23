'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

/** Four existing flows. Visible on the live orientation strip and the legacy hero. */
export default function HomeIntentNav() {
  const { tOr } = useTranslation();
  return (
    <nav
      aria-label={tOr('homePhase1.intentNavLabel', 'What do you want to do?', 'Wat wil je doen?')}
      className="mt-2 flex flex-wrap gap-1.5"
      data-testid="home-intent-nav"
    >
      <Link
        href="/#homecheff-feed"
        data-testid="home-intent-discover"
        className="inline-flex min-h-[36px] items-center rounded-full border border-white/50 bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25"
      >
        {tOr('homePhase1.intentDiscover', 'Discover', 'Ontdekken')}
      </Link>
      <Link
        href="/onboarding/seller"
        data-testid="home-intent-offer"
        className="inline-flex min-h-[36px] items-center rounded-full border border-white/50 bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25"
      >
        {tOr('homePhase1.intentOffer', 'Offer', 'Aanbieden')}
      </Link>
      <Link
        href="/growth"
        data-testid="home-intent-growth"
        className="inline-flex min-h-[36px] items-center rounded-full border border-white/50 bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25"
      >
        {tOr('homePhase1.intentGrowth', 'Find customers', 'Klanten vinden')}
      </Link>
      <Link
        href="/affiliate"
        data-testid="home-intent-earn"
        className="inline-flex min-h-[36px] items-center rounded-full border border-white/50 bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25"
      >
        {tOr('homePhase1.intentEarn', 'Earn', 'Verdienen')}
      </Link>
    </nav>
  );
}
