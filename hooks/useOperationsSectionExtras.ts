'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import type { OperationsSidepanelSection } from '@/lib/operations/operations-sidepanel-section';

export type DeliverySectionExtras = {
  isOnline: boolean;
  availableOrders: number;
  hasActiveDelivery: boolean;
};

export type PartnerSectionExtras = {
  referralLink: string | null;
  availableCents: number;
  isSubAffiliate: boolean;
  /** Attributions — sign-ups via link (not network partners) */
  signupsViaLink: number;
  directPartnersCount: number;
  activeDirectPartners: number;
  /** Paid override commissions from direct partners' activity */
  networkEarningsCents: number;
};

type SectionExtras = {
  delivery: DeliverySectionExtras | null;
  partner: PartnerSectionExtras | null;
};

function hasDelivery(ctx: SettingsHubContext | null): boolean {
  if (!ctx) return false;
  const role = (ctx.role || '').toUpperCase();
  return Boolean(ctx.hasDeliveryProfile) || role === 'DELIVERY';
}

function hasAffiliate(ctx: SettingsHubContext | null): boolean {
  return Boolean(ctx?.hasAffiliate);
}

/**
 * Lazy, section-scoped extras — avoids duplicate fetches unless section needs them.
 */
export function useOperationsSectionExtras(
  activeSection: OperationsSidepanelSection,
  ctx: SettingsHubContext | null,
  enabled = true,
) {
  const [extras, setExtras] = useState<SectionExtras>({
    delivery: null,
    partner: null,
  });
  const [loadingSection, setLoadingSection] = useState(false);
  const fetchedRef = useRef<{ delivery: boolean; partner: boolean }>({
    delivery: false,
    partner: false,
  });

  const loadDelivery = useCallback(async () => {
    if (fetchedRef.current.delivery) return;
    try {
      const res = await fetch('/api/delivery/dashboard');
      if (!res.ok) return;
      const json = await res.json();
      fetchedRef.current.delivery = true;
      setExtras((prev) => ({
        ...prev,
        delivery: {
          isOnline: Boolean(json.isOnline),
          availableOrders: json.stats?.availableOrders ?? 0,
          hasActiveDelivery: Boolean(json.currentOrder),
        },
      }));
    } catch {
      /* silent — context falls back to CTAs */
    }
  }, []);

  const loadPartner = useCallback(async () => {
    if (fetchedRef.current.partner) return;
    try {
      const res = await fetch('/api/affiliate/dashboard');
      if (!res.ok) return;
      const json = await res.json();
      fetchedRef.current.partner = true;
      const subAffiliates = Array.isArray(json.subAffiliates)
        ? (json.subAffiliates as Array<{ status?: string }>)
        : [];
      setExtras((prev) => ({
        ...prev,
        partner: {
          referralLink: json.referralLink ?? null,
          availableCents: json.earnings?.availableCents ?? 0,
          isSubAffiliate: Boolean(json.affiliate?.isSubAffiliate),
          signupsViaLink: json.stats?.totalReferrals ?? 0,
          directPartnersCount: json.stats?.downlineCount ?? 0,
          activeDirectPartners: subAffiliates.filter(
            (s) => s.status === 'ACTIVE',
          ).length,
          networkEarningsCents: json.earnings?.parentCommissionsCents ?? 0,
        },
      }));
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!enabled || !ctx) return;

    const needsDelivery =
      activeSection === 'delivery' && hasDelivery(ctx) && !fetchedRef.current.delivery;
    const needsPartner =
      activeSection === 'partners' && hasAffiliate(ctx) && !fetchedRef.current.partner;

    if (!needsDelivery && !needsPartner) return;

    setLoadingSection(true);
    void Promise.all([
      needsDelivery ? loadDelivery() : Promise.resolve(),
      needsPartner ? loadPartner() : Promise.resolve(),
    ]).finally(() => setLoadingSection(false));
  }, [activeSection, ctx, enabled, loadDelivery, loadPartner]);

  return { ...extras, loadingSection };
}
