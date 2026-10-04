'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import MyHomeCheffHubCard from '@/components/my-homecheff/MyHomeCheffHubCard';
import { useUserBootstrap } from '@/components/user/UserBootstrapProvider';
import { useMyHomeCheffHubData } from '@/hooks/useMyHomeCheffHubData';
import {
  listMyHomeCheffCards,
  listMyHomeCheffOpportunities,
  settingsHubContextFromSessionUser,
} from '@/lib/navigation/my-homecheff-hub';
import { useTranslation } from '@/hooks/useTranslation';
import { hubCopy, type HubLang } from '@/lib/navigation/my-homecheff-hub-copy';
import { getDisplayName } from '@/lib/displayName';

export default function MyHomeCheffHubClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, tOr, language } = useTranslation();
  const hubLang: HubLang = language === 'en' ? 'en' : 'nl';
  const copy = hubCopy(hubLang);
  const copyEn = hubCopy('en');
  const { profile, ensureProfile } = useUserBootstrap();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=%2Fmijn-homecheff');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') void ensureProfile();
  }, [status, ensureProfile]);

  const navUser = useMemo(() => {
    const user = session?.user as Record<string, unknown> | undefined;
    if (!user) return null;
    return { ...user, ...(profile ?? {}) };
  }, [session?.user, profile]);

  const ctx = useMemo(() => settingsHubContextFromSessionUser(navUser), [navUser]);
  const cards = useMemo(() => (ctx ? listMyHomeCheffCards(ctx) : []), [ctx]);
  const opportunities = useMemo(
    () => (ctx ? listMyHomeCheffOpportunities(ctx) : []),
    [ctx],
  );
  const firstListing = opportunities.find((item) => item.id === 'seller');
  const otherOpportunities = opportunities.filter((item) => item.id !== 'seller');
  const { metrics, loading, referralLink } = useMyHomeCheffHubData(ctx, status === 'authenticated');
  const activityCards = cards.filter((card) => {
    if (card.id !== 'earnings') return true;
    if (loading) return false;
    const earned = metrics.totalEarningsCents ?? 0;
    const seller = metrics.sellerRevenue7d ?? 0;
    const affiliate = metrics.affiliateEarnedCents ?? 0;
    return earned > 0 || seller > 0 || affiliate > 0;
  });

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const displayName = profile
    ? getDisplayName(profile)
    : getDisplayName(session?.user as { name?: string; username?: string });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-8 lg:max-w-4xl lg:pb-8">
      <header className="mb-6 sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {tOr('myHomeCheffHub.eyebrow', copyEn.eyebrow, copy.eyebrow)}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          {tOr('myHomeCheffHub.title', copyEn.title, copy.title)}
        </h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          {(() => {
            const g = t('myHomeCheffHub.greeting', { name: displayName });
            if (g.trim()) return g;
            return (hubLang === 'en' ? copyEn.greeting : copy.greeting).replace(
              '{{name}}',
              displayName,
            );
          })()}
        </p>
      </header>

      {firstListing ? (
        <Link
          href={firstListing.href}
          className="mb-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-base font-semibold text-white hover:bg-emerald-800 sm:w-auto"
        >
          {tOr(
            firstListing.labelKey,
            copyEn.cards.seller.onboardingPrimary,
            copy.cards.seller.onboardingPrimary,
          )}
        </Link>
      ) : null}

      <Link
        href="/messages"
        prefetch={false}
        className="mb-6 inline-flex min-h-[44px] items-center text-sm font-medium text-gray-700 hover:text-emerald-800"
      >
        {tOr('navbar.messages', 'Messages', 'Berichten')}
      </Link>

      <h2 className="mb-3 text-sm font-semibold text-slate-800">
        {tOr('myHomeCheffHub.activityTitle', copyEn.activityTitle, copy.activityTitle)}
      </h2>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {activityCards.map((card) => (
          <MyHomeCheffHubCard
            key={card.id}
            card={card}
            metrics={metrics}
            loading={loading}
            referralLink={referralLink}
          />
        ))}
      </div>

      {otherOpportunities.length > 0 || firstListing ? (
        <details className="mb-8 rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
            {tOr(
              'myHomeCheffHub.discoverTitle',
              copyEn.discoverTitle,
              copy.discoverTitle,
            )}
          </summary>
          <p className="mt-2 text-xs text-slate-600">
            {tOr(
              'myHomeCheffHub.discoverSupport',
              copyEn.discoverSupport,
              copy.discoverSupport,
            )}
          </p>
          <ul className="mt-3 grid gap-2">
            {otherOpportunities.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-800 hover:text-emerald-950"
                >
                  {tOr(
                    item.labelKey,
                    item.id === 'seller'
                      ? copyEn.cards.seller.onboardingPrimary
                      : item.id === 'affiliate'
                        ? copyEn.cards.affiliate.onboardingPrimary
                        : copyEn.cards.delivery.onboardingPrimary,
                    item.id === 'seller'
                      ? copy.cards.seller.onboardingPrimary
                      : item.id === 'affiliate'
                        ? copy.cards.affiliate.onboardingPrimary
                        : copy.cards.delivery.onboardingPrimary,
                  )}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/ecosystem"
                className="inline-flex min-h-[44px] items-center text-sm font-medium text-slate-600 hover:text-emerald-800"
              >
                {tOr(
                  'myHomeCheffHub.discoverEcosystem',
                  copyEn.discoverEcosystem,
                  copy.discoverEcosystem,
                )}
              </Link>
            </li>
          </ul>
        </details>
      ) : (
        <p className="mb-8">
          <Link
            href="/ecosystem"
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-slate-600 hover:text-emerald-800"
          >
            {tOr(
              'myHomeCheffHub.discoverEcosystem',
              copyEn.discoverEcosystem,
              copy.discoverEcosystem,
            )}
          </Link>
        </p>
      )}

      <footer className="mt-8 flex flex-wrap gap-4 border-t border-gray-200/80 pt-6 text-sm">
        <Link
          href="/messages"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-gray-600 hover:text-emerald-700"
        >
          {tOr('navbar.messages', 'Messages', 'Berichten')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/favorites"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-gray-600 hover:text-emerald-700"
        >
          {tOr('navbar.favorites', 'Favorites', 'Favorieten')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/profile/deals"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-gray-600 hover:text-emerald-700"
        >
          {tOr('navbar.agreements', 'Agreements', 'Afspraken')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/mijn-hcp"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-gray-600 hover:text-emerald-700"
        >
          {tOr('bottomNav.reputationTab', 'Reputation', 'Reputatie')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </footer>
    </div>
  );
}
