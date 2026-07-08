'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Lightbulb, Store } from 'lucide-react';
import InspiratieContent from '@/components/inspiratie/InspiratieContent';
import { DorpspleinPageContent } from '@/components/dorpsplein/DorpspleinPageContent';
import NotificationProvider from '@/components/notifications/NotificationProvider';
import ClientOnly from '@/components/util/ClientOnly';
import TourTrigger from '@/components/onboarding/TourTrigger';
import { useTranslation } from '@/hooks/useTranslation';
import EcosystemDiscoverStrip from '@/components/community/EcosystemDiscoverStrip';
import {
  loadFeedSurfaceState,
  saveFeedSurfaceState,
} from '@/lib/feed/feedSurfaceState';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

export type DiscoverListing = 'inspiratie' | 'dorpsplein';

function listingFromSearchParams(sp: URLSearchParams | null): DiscoverListing {
  if (!sp) return 'inspiratie';
  return sp.get('bron') === 'dorpsplein' ? 'dorpsplein' : 'inspiratie';
}

export default function DiscoverHubClient() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || '/inspiratie';

  const [listing, setListingState] = useState<DiscoverListing>(() =>
    listingFromSearchParams(searchParams)
  );
  const discoverPersistAppliedRef = useRef(false);

  useEffect(() => {
    setListingState(listingFromSearchParams(searchParams));
  }, [searchParams]);

  const setListing = useCallback(
    (next: DiscoverListing) => {
      setListingState(next);
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (next === 'dorpsplein') {
        params.set('bron', 'dorpsplein');
      } else {
        params.delete('bron');
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, searchParams, pathname]
  );

  useEffect(() => {
    if (discoverPersistAppliedRef.current) return;
    const bron = searchParams?.get('bron');
    if (bron === 'dorpsplein') {
      discoverPersistAppliedRef.current = true;
      return;
    }
    const p = loadFeedSurfaceState<{ listing?: DiscoverListing }>('discover_hub');
    if (p?.listing === 'dorpsplein' || p?.listing === 'inspiratie') {
      discoverPersistAppliedRef.current = true;
      setListing(p.listing);
      trackOnboardingEvent('FEED_STATE_RESTORED', { surface: 'discover_hub' });
    } else {
      discoverPersistAppliedRef.current = true;
    }
  }, [searchParams, setListing]);

  useEffect(() => {
    saveFeedSurfaceState('discover_hub', { listing });
  }, [listing]);

  const hubTitle =
    t('discover.hubTitle') ||
    (language === 'en' ? 'Discover' : 'Ontdekken');
  const hubSubtitle =
    t('discover.hubSubtitle') ||
    (language === 'en'
      ? 'Inspiration from the community and local offers on the village square — switch with the tabs below.'
      : 'Inspiratie uit de community en lokaal aanbod op het dorpsplein — wissel met de tabs hieronder.');

  const tabInspiratie = t('bottomNav.inspiratie') || 'Inspiratie';
  const tabDorpsplein = t('bottomNav.dorpsplein') || 'Dorpsplein';

  return (
    <main
      className="min-h-[100dvh] bg-gradient-to-br from-amber-50 via-neutral-50 to-blue-50"
      data-discover-hub
    >
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3 flex-wrap">
            <Lightbulb className="w-10 h-10 md:w-12 md:h-12 shrink-0" aria-hidden />
            <span>{hubTitle}</span>
            <Store className="w-10 h-10 md:w-12 md:h-12 shrink-0" aria-hidden />
          </h1>
          <p className="text-base md:text-xl text-emerald-100/95 max-w-3xl mx-auto">
            {hubSubtitle}
          </p>
          <div className="mx-auto mt-6 max-w-3xl px-2">
            <EcosystemDiscoverStrip variant="discover" />
          </div>
          <div className="mt-6 flex justify-center">
            <ClientOnly>
              <TourTrigger pageId="inspiratie" variant="button" />
            </ClientOnly>
          </div>
        </div>
      </div>

      {/* Listing-type tabs: onderdeel van filterzone (sticky) */}
      <div className="sticky top-0 z-[45] border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-white/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t('discover.listingTypeLabel') || (language === 'en' ? 'Show' : 'Toon')}
          </p>
          <div
            className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1 sm:inline-flex sm:w-auto w-full"
            role="tablist"
            aria-label={t('discover.listingTabsAria') || 'Kies inspiratie of dorpsplein'}
          >
            <button
              type="button"
              role="tab"
              aria-selected={listing === 'inspiratie'}
              onClick={() => setListing('inspiratie')}
              className={`flex-1 sm:flex-none rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                listing === 'inspiratie'
                  ? 'bg-white text-emerald-800 shadow border border-emerald-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tabInspiratie}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listing === 'dorpsplein'}
              onClick={() => setListing('dorpsplein')}
              className={`flex-1 sm:flex-none rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                listing === 'dorpsplein'
                  ? 'bg-white text-primary-800 shadow border border-primary-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tabDorpsplein}
            </button>
          </div>
        </div>
      </div>

      <NotificationProvider>
        {listing === 'inspiratie' ? (
          <InspiratieContent layout="hub" />
        ) : (
          <DorpspleinPageContent layout="hub" />
        )}
      </NotificationProvider>
    </main>
  );
}
