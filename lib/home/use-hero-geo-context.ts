'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadLocationPreference } from '@/lib/geo/location-preference';
import { useUserBootstrap } from '@/components/user/UserBootstrapProvider';
import {
  resolveHeroGeoContext,
  type HeroGeoContext,
  type HeroGeoSaved,
} from '@/lib/home/hero-geo-context';

const EMPTY: HeroGeoContext = {
  city: null,
  source: 'generic',
  showOriginNote: false,
};

/**
 * SSR and the first client render use only the explicit URL place.
 * Saved, account and country context apply after mount so cached HTML
 * stays generic and does not hydrate a different city.
 */
export function useHeroGeoContext(): HeroGeoContext {
  const params = useSearchParams();
  const explicitPlace = params?.get('place') ?? null;
  const { profile } = useUserBootstrap();
  const [saved, setSaved] = useState<HeroGeoSaved | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const readSaved = () => {
      const pref = loadLocationPreference();
      setSaved(
        pref
          ? { source: pref.source, place: pref.place, label: pref.label }
          : null,
      );
    };
    readSaved();
    setMounted(true);
    window.addEventListener('hc-location-pref-changed', readSaved);
    let cancelled = false;
    fetch('/api/geo/approx', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const code = typeof data.countryCode === 'string' ? data.countryCode : null;
        setCountryCode(code);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      window.removeEventListener('hc-location-pref-changed', readSaved);
    };
  }, []);

  return resolveHeroGeoContext({
    explicitPlace,
    saved: mounted ? saved : null,
    accountPlace: mounted ? profile?.place : null,
    countryCode: mounted ? countryCode : null,
  });
}

export { EMPTY as EMPTY_HERO_GEO };
