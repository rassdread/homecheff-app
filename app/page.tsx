import { getServerSession } from 'next-auth';
import { cookies, headers } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie-name';
import HomePageClient from '@/components/home/HomePageClient';
import {
  isLegacyServicesViewChip,
  migrateLegacyServicesViewChip,
  normalizeDiscoveryCategorySlug,
} from '@/lib/marketplace/canonical-model';
import type { FeedViewFilterId } from '@/lib/feed/feed-taxonomy';
import type { SsrAuthHint } from '@/lib/feed/anonymous-session-fast-path';
import {
  parseFeedWorkspacePreviewRequested,
  resolveFeedWorkspaceVisibilityMode,
} from '@/lib/adaptive-workspace-react';
import { resolveIpApproxLocationForBrowse } from '@/lib/geo/ip-approx-location';
import { countryOptionLabel } from '@/lib/geo/structured-location';
import type { ServerIpApproxSeed } from '@/lib/geo/seeded-feed-location';

export const revalidate = 60;

function normalizeHomeFeedChip(raw: string | undefined): FeedViewFilterId | undefined {
  if (!raw) return undefined;
  if (isLegacyServicesViewChip(raw)) return undefined;
  const v = raw.toLowerCase().trim();
  if (v === 'sale' || v === 'shop' || v === 'koop' || v === 'dorpsplein' || v === 'offered' || v === 'aanbod' || v === 'aangeboden') {
    return 'sale';
  }
  if (v === 'all' || v === 'mixed' || v === 'everything' || v === 'alles') return 'all';
  if (
    v === 'inspiration' ||
    v === 'inspiratie' ||
    v === 'ideas' ||
    v === 'inspire'
  ) {
    return 'inspiration';
  }
  if (
    v === 'gezocht' ||
    v === 'request' ||
    v === 'requests' ||
    v === 'wanted'
  ) {
    return 'gezocht';
  }
  return undefined;
}

function normalizeHomeFeedVertical(raw: string | undefined): string | undefined {
  const slug = normalizeDiscoveryCategorySlug(raw);
  return slug === 'all' ? undefined : slug;
}

function resolveHomeFeedDeepLink(
  chipRaw: string | undefined,
  verticalRaw: string | undefined,
): { initialFeedChip?: FeedViewFilterId; initialFeedCategory?: string } {
  const legacy = migrateLegacyServicesViewChip(chipRaw, verticalRaw);
  if (legacy) {
    return { initialFeedChip: legacy.chip, initialFeedCategory: legacy.category };
  }
  const initialFeedChip = normalizeHomeFeedChip(chipRaw);
  const initialFeedCategory = normalizeHomeFeedVertical(verticalRaw);
  return { initialFeedChip, initialFeedCategory };
}

/**
 * Server component: optionele feed-chip (/?chip=sale|inspiration|all#homecheff-feed).
 * Inspiratie loads client-side after feed hydration (Phase 3F.6 — no SSR payload on /).
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams?: {
    chip?: string;
    vertical?: string;
    place?: string;
    stickyTest?: string;
    awFeedWorkspace?: string;
  };
}) {
  let ssrAuthHint: SsrAuthHint = 'anonymous';
  try {
    const cookieStore = await cookies();
    const hasSessionCookie =
      cookieStore.has(NEXTAUTH_SESSION_COOKIE_NAME) ||
      cookieStore.has(`__Secure-${NEXTAUTH_SESSION_COOKIE_NAME}`);
    if (hasSessionCookie) {
      const session = await getServerSession(authOptions);
      ssrAuthHint = session?.user ? 'authenticated' : 'anonymous';
    }
  } catch (e) {
    console.error('[HomePage] getServerSession failed:', e);
    ssrAuthHint = undefined;
  }

  const raw = searchParams?.chip;
  const { initialFeedChip, initialFeedCategory } = resolveHomeFeedDeepLink(
    raw,
    searchParams?.vertical,
  );
  const initialFeedPlace = searchParams?.place?.trim().slice(0, 200) || undefined;
  const stickyTestMode = searchParams?.stickyTest != null && searchParams.stickyTest !== '0';
  const { mode: feedWorkspaceVisibilityMode } = resolveFeedWorkspaceVisibilityMode();
  const feedWorkspacePreviewRequested = parseFeedWorkspacePreviewRequested(
    searchParams?.awFeedWorkspace,
  );

  // Header-only IP approx (same as /api/geo/approx) — seeds GeoFeed first paint.
  let initialIpApprox: ServerIpApproxSeed | null = null;
  try {
    const hdrs = await headers();
    const approx = resolveIpApproxLocationForBrowse(hdrs);
    const label =
      approx.city ||
      approx.region ||
      (approx.countryCode
        ? countryOptionLabel(approx.countryCode).replace(/\s*\([A-Z]{2}\)\s*$/, '')
        : null);
    initialIpApprox = {
      lat: approx.lat,
      lng: approx.lng,
      label,
      city: approx.city,
      countryCode: approx.countryCode,
      mode: approx.mode,
      source: approx.source,
    };
  } catch (e) {
    console.error('[HomePage] IP approx seed failed:', e);
  }

  return (
    <HomePageClient
      ssrAuthHint={ssrAuthHint}
      initialFeedChip={initialFeedChip}
      initialFeedCategory={initialFeedCategory}
      initialFeedPlace={initialFeedPlace}
      initialIpApprox={initialIpApprox}
      stickyTestMode={stickyTestMode}
      feedWorkspaceVisibilityMode={feedWorkspaceVisibilityMode}
      feedWorkspacePreviewRequested={feedWorkspacePreviewRequested}
    />
  );
}
