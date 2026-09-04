'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import { useOperationsTodayRoleData } from '@/hooks/useOperationsTodayRoleData';

export type MyHomeCheffHubMetrics = {
  buyerOrderCount: number | null;
  sellerNewOrders: number | null;
  sellerRevenue7d: number | null;
  affiliateEarnedCents: number | null;
  affiliateConversions: number | null;
  affiliateReferrals: number | null;
  deliveryActiveJobs: number | null;
  deliveryEarningsToday: number | null;
  totalEarningsCents: number | null;
  /** Available HC from central wallet (authoritative). */
  hcAvailable: number | null;
  hcMarketplaceEligible: number | null;
};

const EMPTY_METRICS: MyHomeCheffHubMetrics = {
  buyerOrderCount: null,
  sellerNewOrders: null,
  sellerRevenue7d: null,
  affiliateEarnedCents: null,
  affiliateConversions: null,
  affiliateReferrals: null,
  deliveryActiveJobs: null,
  deliveryEarningsToday: null,
  totalEarningsCents: null,
  hcAvailable: null,
  hcMarketplaceEligible: null,
};

const FOCUS_REFETCH_MS = 30_000;

export function useMyHomeCheffHubData(
  ctx: SettingsHubContext | null,
  enabled = true,
) {
  const roleData = useOperationsTodayRoleData(ctx, enabled);
  const [metrics, setMetrics] = useState<MyHomeCheffHubMetrics>(EMPTY_METRICS);
  const [loadingExtra, setLoadingExtra] = useState(enabled);
  const lastFetchRef = useRef(0);

  const loadExtra = useCallback(async () => {
    if (!enabled || !ctx) {
      setLoadingExtra(false);
      return;
    }

    try {
      const requests: Promise<void>[] = [];
      const next: MyHomeCheffHubMetrics = { ...EMPTY_METRICS };

      requests.push(
        fetch('/api/profile/orders?perPage=1')
          .then(async (res) => {
            if (!res.ok) return;
            const json = await res.json();
            next.buyerOrderCount =
              typeof json.meta?.total === 'number' ? json.meta.total : null;
          })
          .catch(() => undefined),
      );

      requests.push(
        fetch('/api/me/hc-wallet')
          .then(async (res) => {
            if (!res.ok) return;
            const json = await res.json();
            if (typeof json.availableHc === 'number') {
              next.hcAvailable = json.availableHc;
            }
            if (typeof json.marketplaceEligibleHc === 'number') {
              next.hcMarketplaceEligible = json.marketplaceEligibleHc;
            } else if (typeof json.sellerPrincipalEligibleHc === 'number') {
              next.hcMarketplaceEligible = json.sellerPrincipalEligibleHc;
            }
          })
          .catch(() => undefined),
      );

      const role = (ctx.role || '').toUpperCase();
      const hasEarning =
        (ctx.sellerRoles?.length ?? 0) > 0 ||
        role === 'SELLER' ||
        Boolean(ctx.hasDeliveryProfile) ||
        role === 'DELIVERY' ||
        Boolean(ctx.hasAffiliate);

      if (hasEarning) {
        requests.push(
          fetch('/api/earnings/combined')
            .then(async (res) => {
              if (!res.ok) return;
              const json = await res.json();
              const totals = json.totals;
              // /api/earnings/combined totals are integer minor units (cents).
              if (totals && typeof totals.totalEarnings === 'number') {
                next.totalEarningsCents = Math.round(totals.totalEarnings);
              }
            })
            .catch(() => undefined),
        );
      }

      await Promise.all(requests);
      setMetrics(next);
    } finally {
      setLoadingExtra(false);
      lastFetchRef.current = Date.now();
    }
  }, [ctx, enabled]);

  const loadIfStale = useCallback(() => {
    if (!enabled) return;
    if (Date.now() - lastFetchRef.current < FOCUS_REFETCH_MS) return;
    void loadExtra();
    void roleData.refetch();
  }, [enabled, loadExtra, roleData]);

  useEffect(() => {
    setLoadingExtra(enabled);
    void loadExtra();
  }, [loadExtra, enabled]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('focus', loadIfStale);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadIfStale();
    });
    return () => window.removeEventListener('focus', loadIfStale);
  }, [enabled, loadIfStale]);

  const sellerOrders7d = roleData.seller?.orders7d ?? null;

  return {
    loading: roleData.loading || loadingExtra,
    metrics: {
      ...metrics,
      // Honest 7d commercial order count from /api/seller/dashboard/stats (not "new" pending).
      sellerNewOrders: sellerOrders7d != null && sellerOrders7d > 0 ? sellerOrders7d : null,
      // Cents (minor units) from seller dashboard stats totalRevenue.
      sellerRevenue7d: roleData.seller?.revenue7d ?? metrics.sellerRevenue7d,
      affiliateEarnedCents: roleData.partner?.availableCents ?? metrics.affiliateEarnedCents,
      affiliateReferrals: roleData.partner?.totalReferrals ?? metrics.affiliateReferrals,
      deliveryActiveJobs:
        (roleData.delivery?.stats?.availableOrders ?? 0) +
        (roleData.delivery?.stats?.pendingDeliveries ?? 0),
      // EUR major units from delivery dashboard (already /100 at API).
      deliveryEarningsToday: roleData.delivery?.stats?.todayEarnings ?? metrics.deliveryEarningsToday,
      affiliateConversions: roleData.partner?.totalReferrals ?? metrics.affiliateConversions,
    },
    referralLink: roleData.partner?.referralLink ?? null,
    refetch: () => {
      void loadExtra();
      void roleData.refetch();
    },
  };
}
