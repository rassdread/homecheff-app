/**
 * Session-scoped affiliate share context + company tracking URL ensure.
 * Memberships fetched once; assets ensured only on Share (with in-memory reuse).
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';
import {
  appendPersonalRef,
  listingPathFromAbsolute,
  resolveShareMode,
  type OrgMembershipSummary,
  type ResolvedShareMode,
} from '@/lib/share/resolve-marketplace-share-url';
import {
  readShareContextPreference,
  writeShareContextPreference,
  type AffiliateShareMode,
} from '@/lib/share/share-context-preference';

/** Cross-origin Studio/Growth personal shares must use centralUserId (not MP REF codes). */
function personalRefTokenForUrl(
  absoluteUrl: string,
  marketplaceReferralCode: string | null | undefined,
  centralUserId: string | null | undefined,
): string | null {
  try {
    const host = new URL(absoluteUrl).hostname.toLowerCase();
    if (
      host === 'studio.homecheff.eu' ||
      host.endsWith('.studio.homecheff.eu') ||
      host === 'growth.homecheff.eu' ||
      host.endsWith('.growth.homecheff.eu')
    ) {
      return (centralUserId || marketplaceReferralCode || '').trim() || null;
    }
  } catch {
    /* relative */
  }
  return (marketplaceReferralCode || '').trim() || null;
}

type MembershipRow = {
  role: string;
  status?: string;
  organization?: {
    id: string;
    companyName?: string;
    displayName?: string | null;
    status?: string;
  };
};

const companyUrlCache = new Map<string, string>();
const companyUrlInflight = new Map<string, Promise<string | null>>();

function cacheKey(orgId: string, path: string) {
  return `${orgId}::${path}`;
}

async function ensureCompanyShareUrl(input: {
  organizationId: string;
  destinationPath: string;
  medium?: string | null;
}): Promise<string | null> {
  const key = cacheKey(input.organizationId, input.destinationPath);
  const hit = companyUrlCache.get(key);
  if (hit) return hit;

  const existing = companyUrlInflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    try {
      const res = await fetch('/api/affiliate/organization', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'ENSURE_LISTING_SHARE_ASSET',
          organizationId: input.organizationId,
          destinationPath: input.destinationPath,
          medium: input.medium ?? null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        trackingUrl?: string;
      };
      if (!json.ok || !json.trackingUrl) return null;
      companyUrlCache.set(key, json.trackingUrl);
      return json.trackingUrl;
    } catch {
      return null;
    } finally {
      companyUrlInflight.delete(key);
    }
  })();

  companyUrlInflight.set(key, p);
  return p;
}

export function useMarketplaceShareContext() {
  const { data: session } = useSession();
  const {
    referralCode,
    loading: personalLoading,
    addAffiliateToUrl,
    isAffiliate,
  } = useAffiliateLink();

  const [memberships, setMemberships] = useState<OrgMembershipSummary[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [preferenceTick, setPreferenceTick] = useState(0);

  useEffect(() => {
    if (!session?.user?.email) {
      setMemberships([]);
      return;
    }
    let cancelled = false;
    setMembershipsLoading(true);
    void fetch('/api/affiliate/organization', { credentials: 'include' })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          memberships?: MembershipRow[];
        };
        if (cancelled || !json.ok || !Array.isArray(json.memberships)) {
          if (!cancelled) setMemberships([]);
          return;
        }
        const rows: OrgMembershipSummary[] = json.memberships
          .filter((m) => m.organization?.id && (m.organization.status || 'ACTIVE') === 'ACTIVE')
          .map((m) => ({
            organizationId: m.organization!.id,
            companyName: m.organization!.companyName || m.organization!.displayName || 'Company',
            displayName: m.organization!.displayName,
            role: m.role,
            status: m.status,
          }));
        setMemberships(rows);
      })
      .catch(() => {
        if (!cancelled) setMemberships([]);
      })
      .finally(() => {
        if (!cancelled) setMembershipsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  const preference = typeof window !== 'undefined' ? readShareContextPreference() : null;
  void preferenceTick;

  const mode: ResolvedShareMode = resolveShareMode({
    memberships,
    preferenceMode: preference?.mode ?? null,
    preferenceOrganizationId: preference?.organizationId ?? null,
    hasPersonalAffiliate: Boolean(referralCode),
  });

  /** Prefetch company tracking URLs for common Verdien destinations so Delen stays one-tap. */
  useEffect(() => {
    if (mode.kind !== 'company') return;
    const orgId = mode.organizationId;
    const paths = [
      '/werken-bij',
      '/delivery/signup',
      '/delivery/company/signup',
      '/affiliate',
      '/affiliate/company',
      '/onboarding/seller',
      '/werken-bij/vacatures',
      '/werken-bij/hoe-werkt-het',
    ];
    for (const destinationPath of paths) {
      void ensureCompanyShareUrl({ organizationId: orgId, destinationPath });
    }
  }, [mode]);

  const setSharePreference = useCallback(
    (next: AffiliateShareMode, organizationId?: string | null) => {
      writeShareContextPreference({
        mode: next,
        organizationId: next === 'company' ? organizationId ?? memberships[0]?.organizationId ?? null : null,
      });
      setPreferenceTick((n) => n + 1);
    },
    [memberships],
  );

  const resolveShareUrl = useCallback(
    async (input: {
      listingAbsoluteUrl: string;
      surface?: string;
      /** Force mode for this action (after explicit UI choice). */
      forceMode?: 'personal' | 'company';
      forceOrganizationId?: string;
    }): Promise<{ url: string; kind: 'plain' | 'personal' | 'company'; fromCache: boolean }> => {
      const listing = input.listingAbsoluteUrl;
      const centralUserId =
        (session?.user as { id?: string } | undefined)?.id?.trim() || null;
      const personalToken = personalRefTokenForUrl(listing, referralCode, centralUserId);
      let effective = mode;

      if (input.forceMode === 'personal') {
        effective = personalToken ? { kind: 'personal' } : { kind: 'plain' };
      } else if (input.forceMode === 'company') {
        const orgId =
          input.forceOrganizationId ||
          (mode.kind === 'company' ? mode.organizationId : memberships[0]?.organizationId);
        if (orgId) effective = { kind: 'company', organizationId: orgId };
      }

      if (effective.kind === 'choose' || effective.kind === 'plain') {
        if (effective.kind === 'plain') {
          return { url: listing, kind: 'plain', fromCache: true };
        }
        // Ambiguous without force — fall back personal if available else plain
        if (personalToken) {
          return {
            url: appendPersonalRef(listing, personalToken),
            kind: 'personal',
            fromCache: true,
          };
        }
        return { url: listing, kind: 'plain', fromCache: true };
      }

      if (effective.kind === 'personal') {
        return {
          url: appendPersonalRef(listing, personalToken),
          kind: personalToken ? 'personal' : 'plain',
          fromCache: true,
        };
      }

      const path = listingPathFromAbsolute(listing);
      if (!path) {
        // Safety: never invent company track for non-listing
        return {
          url: personalToken ? appendPersonalRef(listing, personalToken) : listing,
          kind: personalToken ? 'personal' : 'plain',
          fromCache: true,
        };
      }

      const key = cacheKey(effective.organizationId, path);
      const cached = companyUrlCache.get(key);
      if (cached) {
        return { url: cached, kind: 'company', fromCache: true };
      }

      const trackingUrl = await ensureCompanyShareUrl({
        organizationId: effective.organizationId,
        destinationPath: path,
        medium: input.surface ?? null,
      });

      if (!trackingUrl) {
        // Fail closed to personal/plain — never dual-attribute
        return {
          url: personalToken ? appendPersonalRef(listing, personalToken) : listing,
          kind: personalToken ? 'personal' : 'plain',
          fromCache: false,
        };
      }

      return { url: trackingUrl, kind: 'company', fromCache: false };
    },
    [memberships, mode, referralCode, session?.user],
  );

  const loading =
    Boolean(session?.user?.email) && (personalLoading || membershipsLoading);

  return {
    mode,
    memberships,
    loading,
    isAffiliate,
    referralCode,
    addAffiliateToUrl,
    setSharePreference,
    resolveShareUrl,
    hasCompanyMembership: memberships.length > 0,
    needsContextChoice: mode.kind === 'choose',
  };
}
