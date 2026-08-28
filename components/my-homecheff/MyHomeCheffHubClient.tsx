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
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('myHomeCheffHub.title')}
        </h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          {t('myHomeCheffHub.greeting', { name: displayName })}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
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
