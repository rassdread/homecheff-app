'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AffiliatePartnerMeta = {
  isSubAffiliate: boolean;
  referralLink: string | null;
  availableCents: number;
};

/**
 * Lightweight affiliate dashboard peek for quick links & sidepanel gating.
 * Reuses existing GET /api/affiliate/dashboard — cached per session mount.
 */
export function useAffiliatePartnerMeta(enabled: boolean) {
  const [meta, setMeta] = useState<AffiliatePartnerMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const load = useCallback(async () => {
    if (fetchedRef.current) return;
    setLoading(true);
    try {
      const res = await fetch('/api/affiliate/dashboard');
      if (!res.ok) return;
      const json = await res.json();
      fetchedRef.current = true;
      setMeta({
        isSubAffiliate: Boolean(json.affiliate?.isSubAffiliate),
        referralLink: json.referralLink ?? null,
        availableCents: json.earnings?.availableCents ?? 0,
      });
    } catch {
      /* silent — invite link stays hidden */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return { meta, loading };
}
