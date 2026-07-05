'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserActionItem } from '@/lib/user/user-action-center';

export type OperationsActionCenterData = {
  items: UserActionItem[];
  totalCount: number;
  healthy: boolean;
  roles?: {
    hasSellerProfile?: boolean;
    hasDeliveryProfile?: boolean;
    hasAffiliate?: boolean;
  };
};

export type OperationsCombinedEarnings = {
  seller?: {
    totalEarnings: number;
    pendingPayout: number;
    availablePayout: number;
    paidPayout: number;
  };
  delivery?: {
    totalEarnings: number;
    paidPayout?: number;
  };
  affiliate?: {
    totalEarnings: number;
    pendingCents: number;
    availableCents: number;
    paidCents: number;
  };
};

export type OperationsEarningsTotals = {
  totalEarnings: number;
  totalAvailable: number;
  totalPaid: number;
};

export type OperationsEarningsRoles = {
  isSeller: boolean;
  isDelivery: boolean;
  isAffiliate: boolean;
};

const FOCUS_REFETCH_MS = 30_000;

export function useOperationsSidepanelData(enabled = true) {
  const [actionCenter, setActionCenter] = useState<OperationsActionCenterData | null>(null);
  const [earnings, setEarnings] = useState<OperationsCombinedEarnings | null>(null);
  const [totals, setTotals] = useState<OperationsEarningsTotals | null>(null);
  const [earningRoles, setEarningRoles] = useState<OperationsEarningsRoles | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const lastFetchRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      const [actionRes, earningsRes] = await Promise.all([
        fetch('/api/user/action-center'),
        fetch('/api/earnings/combined'),
      ]);

      if (!actionRes.ok) {
        setError(true);
        setActionCenter(null);
      } else {
        const actionJson = (await actionRes.json()) as OperationsActionCenterData;
        setActionCenter(actionJson);
      }

      if (earningsRes.ok) {
        const earningsJson = (await earningsRes.json()) as {
          earnings: OperationsCombinedEarnings;
          totals: OperationsEarningsTotals;
          roles: OperationsEarningsRoles;
        };
        setEarnings(earningsJson.earnings);
        setTotals(earningsJson.totals);
        setEarningRoles(earningsJson.roles);
      } else {
        setEarnings(null);
        setTotals(null);
        setEarningRoles(null);
      }

      setError(!actionRes.ok);
    } catch {
      setError(true);
      setActionCenter(null);
    } finally {
      setLoading(false);
      lastFetchRef.current = Date.now();
    }
  }, [enabled]);

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
    window.addEventListener('unreadCountUpdate', onNotificationsUpdated);
    window.addEventListener('messagesRead', onNotificationsUpdated);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadIfStale();
    });
    return () => {
      window.removeEventListener('focus', loadIfStale);
      window.removeEventListener('notificationsUpdated', onNotificationsUpdated);
      window.removeEventListener('unreadCountUpdate', onNotificationsUpdated);
      window.removeEventListener('messagesRead', onNotificationsUpdated);
    };
  }, [enabled, load, loadIfStale]);

  return {
    actionCenter,
    earnings,
    totals,
    earningRoles,
    loading,
    error,
    refetch: load,
  };
}
