'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ANALYTICS_CONSENT_KEY,
  analyticsConsentGranted,
} from '@/lib/meta/commerce';

type SponsoredItem = {
  listingId: string;
  sellerUserId: string;
  href: string;
  title: string;
  businessName: string;
  place: string | null;
  distanceLabel: string | null;
  priceCents: number | null;
  imageUrl: string | null;
  why: 'query' | 'category' | 'place' | 'shipping';
};

type Props = {
  query?: string | null;
  category?: string | null;
  radiusKm?: number | null;
  lat?: number | null;
  lng?: number | null;
};

function seenSellers(): string[] {
  try {
    const raw = sessionStorage.getItem('hc-sponsored-sellers');
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function rememberSeller(sellerKey: string) {
  const next = [...new Set([sellerKey, ...seenSellers()])].slice(0, 12);
  sessionStorage.setItem('hc-sponsored-sellers', JSON.stringify(next));
}

export default function SponsoredRecommendationInsert({
  query,
  category,
  radiusKm,
  lat,
  lng,
}: Props) {
  const { t, language } = useTranslation();
  const [item, setItem] = useState<SponsoredItem | null>(null);
  const [ready, setReady] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const impressed = useRef(false);

  useEffect(() => {
    const root = document.querySelector('[data-hc-viewer-place]');
    const qValue = query?.trim() || root?.getAttribute('data-hc-feed-query') || '';
    const categoryValue = category?.trim() || root?.getAttribute('data-hc-feed-category') || '';
    const radiusValue = radiusKm ?? Number(root?.getAttribute('data-hc-feed-radius'));
    const latValue = lat ?? Number(root?.getAttribute('data-hc-feed-lat'));
    const lngValue = lng ?? Number(root?.getAttribute('data-hc-feed-lng'));
    const params = new URLSearchParams();
    if (qValue) params.set('q', qValue);
    if (categoryValue && categoryValue !== 'all') params.set('category', categoryValue);
    if (Number.isFinite(radiusValue)) params.set('radiusKm', String(radiusValue));
    if (Number.isFinite(latValue) && Number.isFinite(lngValue)) {
      params.set('lat', String(latValue));
      params.set('lng', String(lngValue));
    }
    const exclude = [...document.querySelectorAll('[data-listing-id]')]
      .map((node) => node.getAttribute('data-listing-id') || '')
      .filter(Boolean)
      .slice(0, 24);
    if (exclude.length) params.set('exclude', exclude.join(','));
    const seen = seenSellers();
    if (seen.length) params.set('seenSellers', seen.join(','));
    let cancelled = false;
    fetch(`/api/home/sponsored-recommendation?${params.toString()}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((body: { item?: SponsoredItem | null }) => {
        if (!cancelled) setItem(body.item ?? null);
      })
      .catch(() => {
        if (!cancelled) setItem(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [query, category, radiusKm, lat, lng]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || !item || impressed.current) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5);
        if (!visible) {
          window.clearTimeout(timer);
          return;
        }
        timer = window.setTimeout(() => {
          if (impressed.current) return;
          const day = new Date().toISOString().slice(0, 10);
          const key = `hc-sp-imp:${item.listingId}:${day}`;
          if (sessionStorage.getItem(key)) {
            impressed.current = true;
            return;
          }
          sessionStorage.setItem(key, '1');
          impressed.current = true;
          const consent = analyticsConsentGranted(localStorage.getItem(ANALYTICS_CONSENT_KEY));
          void fetch('/api/home/sponsored-recommendation/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind: 'sponsored_impression',
              listingId: item.listingId,
              analyticsConsent: consent,
            }),
          }).catch(() => undefined);
        }, 1000);
      },
      { threshold: [0.5] },
    );
    observer.observe(node);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [item]);

  if (!ready || !item) return null;

  const price =
    item.priceCents != null
      ? new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
          style: 'currency',
          currency: 'EUR',
        }).format(item.priceCents / 100)
      : null;

  const trackClick = () => {
    rememberSeller(item.sellerUserId);
    const consent = analyticsConsentGranted(localStorage.getItem(ANALYTICS_CONSENT_KEY));
    void fetch('/api/home/sponsored-recommendation/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'sponsored_click',
        listingId: item.listingId,
        analyticsConsent: consent,
      }),
    }).catch(() => undefined);
  };

  return (
    <article
      ref={cardRef}
      data-hc-sponsored-recommendation=""
      className="col-span-full mx-auto w-full max-w-xl rounded-2xl border border-stone-200 bg-[#FFFBF5] p-3 text-[var(--hc-deep-blue)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
        {t('sponsoredRecommendation.label')}
      </p>
      <div className="mt-2 flex gap-3">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{item.title}</h3>
          <p className="truncate text-xs text-stone-600">{item.businessName}</p>
          <p className="truncate text-xs text-stone-600">
            {[item.place, item.distanceLabel, price].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      <details className="mt-2 text-xs text-stone-600">
        <summary className="cursor-pointer font-medium">{t('sponsoredRecommendation.why')}</summary>
        <p className="mt-1">{t(`sponsoredRecommendation.why.${item.why}`)}</p>
      </details>
      <Link
        href={item.href}
        onClick={trackClick}
        className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[var(--hc-blue)] px-3 text-sm font-semibold text-white"
      >
        {t('sponsoredRecommendation.viewOffer')}
      </Link>
    </article>
  );
}
