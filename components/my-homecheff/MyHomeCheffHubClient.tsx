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
  settingsHubContextFromSessionUser,
} from '@/lib/navigation/my-homecheff-hub';
import { useTranslation } from '@/hooks/useTranslation';
import { getDisplayName } from '@/lib/displayName';

export default function MyHomeCheffHubClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
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
  const { metrics, loading, referralLink } = useMyHomeCheffHubData(ctx, status === 'authenticated');

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
          {t('myHomeCheffHub.eyebrow')}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('myHomeCheffHub.title')}
        </h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          {t('myHomeCheffHub.greeting', { name: displayName })}
        </p>
      </header>

      <h2 className="mb-3 text-sm font-semibold text-slate-800">
        {t('myHomeCheffHub.activityTitle')}
      </h2>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {cards.map((card) => (
          <MyHomeCheffHubCard
            key={card.id}
            card={card}
            metrics={metrics}
            loading={loading}
            referralLink={referralLink}
          />
        ))}
      </div>

      <section
        className="mb-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50 p-4 sm:p-5"
        aria-labelledby="mijn-hc-modules-heading"
      >
        <h2
          id="mijn-hc-modules-heading"
          className="text-sm font-semibold text-emerald-950"
        >
          {t('myHomeCheffHub.modulesTitle')}
        </h2>
        <p className="mt-1 text-xs text-slate-600">{t('myHomeCheffHub.modulesSupport')}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: 'marketplace',
                href: '/',
                title: t('myHomeCheffHub.modules.marketplace.title'),
                body: t('myHomeCheffHub.modules.marketplace.body'),
                cta: t('myHomeCheffHub.modules.marketplace.cta'),
              },
              {
                id: 'growth',
                href: 'https://growth.homecheff.eu/auth/sso/silent?mode=ecosystem&returnTo=%2F',
                title: t('myHomeCheffHub.modules.growth.title'),
                body: t('myHomeCheffHub.modules.growth.body'),
                cta: t('myHomeCheffHub.modules.growth.cta'),
              },
              {
                id: 'studio',
                href: 'https://studio.homecheff.eu/auth/sso/silent?mode=ecosystem&returnTo=%2F',
                title: t('myHomeCheffHub.modules.studio.title'),
                body: t('myHomeCheffHub.modules.studio.body'),
                cta: t('myHomeCheffHub.modules.studio.cta'),
              },
            ] as const
          ).map((mod) => (
            <li key={mod.id}>
              <a
                href={mod.href}
                className="flex h-full flex-col rounded-xl border border-emerald-100/80 bg-white/90 p-3.5 shadow-sm transition hover:border-emerald-300 hover:shadow"
              >
                <span className="text-sm font-semibold text-slate-900">{mod.title}</span>
                <span className="mt-1 flex-1 text-xs leading-snug text-slate-600">{mod.body}</span>
                <span className="mt-2 text-xs font-semibold text-emerald-800">{mod.cta}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-8 flex flex-wrap gap-4 border-t border-gray-200/80 pt-6 text-sm">
        <Link
          href="/messages"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-gray-600 hover:text-emerald-700"
        >
          {t('navbar.messages')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/favorites"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-gray-600 hover:text-emerald-700"
        >
          {t('navbar.favorites')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/profile/deals"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-gray-600 hover:text-emerald-700"
        >
          {t('navbar.agreements')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/mijn-hcp"
          prefetch={false}
          className="inline-flex min-h-[44px] items-center gap-1 font-medium text-gray-600 hover:text-emerald-700"
        >
          {t('bottomNav.reputationTab')}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </footer>
    </div>
  );
}
