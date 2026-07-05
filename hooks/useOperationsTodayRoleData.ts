'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import type { DeliveryDashboardSnapshot } from '@/lib/operations/operations-today-helpers';

export type SellerTodaySnapshot = {
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    productTitle: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  revenue7d: number;
  orders7d: number;
};

export type PartnerTodaySnapshot = {
  referralLink: string | null;
  availableCents: number;
  totalReferrals: number;
};

type RoleData = {
  delivery: DeliveryDashboardSnapshot | null;
  seller: SellerTodaySnapshot | null;
  partner: PartnerTodaySnapshot | null;
};

function hasSeller(ctx: SettingsHubContext | null): boolean {
  if (!ctx) return false;
  const role = (ctx.role || '').toUpperCase();
  return (ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER';
}

function hasDelivery(ctx: SettingsHubContext | null): boolean {
  if (!ctx) return false;
  const role = (ctx.role || '').toUpperCase();
  return Boolean(ctx.hasDeliveryProfile) || role === 'DELIVERY';
}

function hasAffiliate(ctx: SettingsHubContext | null): boolean {
  return Boolean(ctx?.hasAffiliate);
}

const FOCUS_REFETCH_MS = 30_000;

export function useOperationsTodayRoleData(
  ctx: SettingsHubContext | null,
  enabled = true,
) {
  const [data, setData] = useState<RoleData>({
    delivery: null,
    seller: null,
    partner: null,
  });
  const [loading, setLoading] = useState(enabled);
  const lastFetchRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled || !ctx) {
      setLoading(false);
      return;
    }

    try {
      const requests: Promise<void>[] = [];

      let delivery: DeliveryDashboardSnapshot | null = null;
      let seller: SellerTodaySnapshot | null = null;
      let partner: PartnerTodaySnapshot | null = null;

      if (hasDelivery(ctx)) {
        requests.push(
          fetch('/api/delivery/dashboard')
            .then(async (res) => {
              if (!res.ok) return;
              const json = await res.json();
              delivery = {
                isOnline: Boolean(json.isOnline),
                currentOrder: json.currentOrder ?? null,
                stats: {
                  todayEarnings: json.stats?.todayEarnings ?? 0,
                  availableOrders: json.stats?.availableOrders ?? 0,
                  pendingDeliveries: json.stats?.pendingDeliveries ?? 0,
                },
              };
            })
            .catch(() => undefined),
        );
      }

      if (hasSeller(ctx)) {
        requests.push(
          Promise.all([
            fetch('/api/seller/dashboard/orders?limit=3&period=30d'),
            fetch('/api/seller/dashboard/stats?period=7d'),
          ])
            .then(async ([ordersRes, statsRes]) => {
              const ordersJson = ordersRes.ok
                ? await ordersRes.json()
                : { orders: [] };
              const statsJson = statsRes.ok
                ? await statsRes.json()
                : { totalRevenue: 0, totalOrders: 0 };
              seller = {
                recentOrders: (ordersJson.orders ?? []).slice(0, 3),
                revenue7d: statsJson.totalRevenue ?? 0,
                orders7d: statsJson.totalOrders ?? 0,
              };
            })
            .catch(() => undefined),
        );
      }

      if (hasAffiliate(ctx)) {
        requests.push(
          fetch('/api/affiliate/dashboard')
            .then(async (res) => {
              if (!res.ok) return;
              const json = await res.json();
              partner = {
                referralLink: json.referralLink ?? null,
                availableCents: json.earnings?.availableCents ?? 0,
                totalReferrals: json.stats?.totalReferrals ?? 0,
              };
            })
            .catch(() => undefined),
        );
      }

      await Promise.all(requests);
      setData({ delivery, seller, partner });
    } finally {
      setLoading(false);
      lastFetchRef.current = Date.now();
    }
  }, [ctx, enabled]);

  const loadIfStale = useCallback(() => {
    if (!enabled) return;
    if (Date.now() - lastFetchRef.current < FOCUS_REFETCH_MS) return;
    void load();
  }, [enabled, load]);

  useEffect(() => {
    setLoading(enabled);
    void load();
  }, [load, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onNotificationsUpdated = () => void load();
    window.addEventListener('focus', loadIfStale);
    window.addEventListener('notificationsUpdated', onNotificationsUpdated);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadIfStale();
    });
    return () => {
      window.removeEventListener('focus', loadIfStale);
      window.removeEventListener('notificationsUpdated', onNotificationsUpdated);
    };
  }, [enabled, load, loadIfStale]);

  return { ...data, loading, refetch: load };
}
