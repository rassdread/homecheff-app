'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import SponsoredRecommendationCard, {
  type SponsoredCardModel,
} from '@/components/home/SponsoredRecommendationCard';
import {
  ANALYTICS_CONSENT_KEY,
  analyticsConsentGranted,
} from '@/lib/meta/commerce';
import {
  shouldRevealSponsoredCard,
  shouldStoreSponsoredImpression,
  sponsoredClickBlocksNavigation,
  sponsoredImpressionStorageKey,
  SPONSORED_IMPRESSION_MIN_MS,
  SPONSORED_IMPRESSION_MIN_RATIO,
} from '@/lib/sponsored/recommendation';

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

const responseCache = new Map<string, SponsoredItem | null>();

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
  const cardRef = useRef<HTMLDivElement | null>(null);
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
    const cacheKey = params.toString();
    if (responseCache.has(cacheKey)) {
      setItem(responseCache.get(cacheKey) ?? null);
      setReady(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/home/sponsored-recommendation?${cacheKey}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((body: { item?: SponsoredItem | null }) => {
        const next = body.item ?? null;
        const scrollY = window.scrollY;
        const reveal = shouldRevealSponsoredCard({
          hasItem: Boolean(next),
          scrollY,
          anchorTop: scrollY > 8 ? 0 : window.innerHeight + 1,
          viewportHeight: window.innerHeight,
        });
        const shown = reveal ? next : null;
        responseCache.set(cacheKey, shown);
        if (!cancelled) setItem(shown);
      })
      .catch(() => {
        responseCache.set(cacheKey, null);
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
    let visibleSince = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= SPONSORED_IMPRESSION_MIN_RATIO,
        );
        if (!visible) {
          visibleSince = 0;
          window.clearTimeout(timer);
          return;
        }
        if (!visibleSince) visibleSince = Date.now();
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          const decision = shouldStoreSponsoredImpression({
            ratio: SPONSORED_IMPRESSION_MIN_RATIO,
            visibleMs: Math.max(SPONSORED_IMPRESSION_MIN_MS, Date.now() - visibleSince),
            alreadyStored: impressed.current || Boolean(sessionStorage.getItem(
              sponsoredImpressionStorageKey(item.listingId, new Date().toISOString().slice(0, 10)),
            )),
            analyticsConsent: analyticsConsentGranted(localStorage.getItem(ANALYTICS_CONSENT_KEY)),
          });
          if (!decision.count) return;
          const day = new Date().toISOString().slice(0, 10);
          sessionStorage.setItem(sponsoredImpressionStorageKey(item.listingId, day), '1');
          impressed.current = true;
          if (!decision.store) return;
          void fetch('/api/home/sponsored-recommendation/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind: 'sponsored_impression',
              listingId: item.listingId,
              analyticsConsent: true,
            }),
          }).catch(() => undefined);
        }, SPONSORED_IMPRESSION_MIN_MS);
      },
      { threshold: [SPONSORED_IMPRESSION_MIN_RATIO] },
    );
    observer.observe(node);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [item]);

  if (!ready || !item) return null;

  const priceLabel =
    item.priceCents != null
      ? new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
          style: 'currency',
          currency: 'EUR',
        }).format(item.priceCents / 100)
      : null;

  const model: SponsoredCardModel = {
    listingId: item.listingId,
    href: item.href,
    title: item.title,
    businessName: item.businessName,
    place: item.place,
    distanceLabel: item.distanceLabel,
    priceLabel,
    imageUrl: item.imageUrl,
    disclosure: t('sponsoredRecommendation.label'),
    whyLabel: t('sponsoredRecommendation.why'),
    whyText: t(`sponsoredRecommendation.why.${item.why}`),
    cta: t('sponsoredRecommendation.viewOffer'),
  };

  return (
    <div ref={cardRef} className="contents">
      <SponsoredRecommendationCard
        item={model}
        onCtaClick={() => {
          if (sponsoredClickBlocksNavigation()) return;
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
        }}
      />
    </div>
  );
}
