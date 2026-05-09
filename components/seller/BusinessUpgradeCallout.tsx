'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type SellerProfileApi = {
  companyName?: string | null;
  kvk?: string | null;
  subscriptionId?: string | null;
  Subscription?: { isActive?: boolean; name?: string | null } | null;
} | null;

/**
 * Duidelijke CTA voor upgrade naar KVK + bedrijfsabonnement (geen Stripe-/schema-wijzigingen).
 */
export default function BusinessUpgradeCallout() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<SellerProfileApi>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/seller/profile');
        if (!res.ok) {
          if (!cancelled) setProfile(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setProfile(data.profile ?? null);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error || profile === undefined || profile === null) return null;

  const company = (profile.companyName || '').trim();
  const kvk = (profile.kvk || '').trim();
  const hasKvkCompany = company.length > 0 && kvk.length > 0;
  const subActive =
    !!profile.subscriptionId &&
    profile.Subscription?.isActive === true;

  if (subActive) return null;

  const needsCompanyInfo = !hasKvkCompany;

  return (
    <div
      className="mb-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-white p-4 sm:p-5 shadow-sm"
      role="region"
      aria-label={t('seller.businessUpgradeCallout.regionLabel')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <Building2 className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
              {t('seller.businessUpgradeCallout.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-700 leading-relaxed">
              {t('seller.businessUpgradeCallout.body')}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              {t('seller.businessUpgradeCallout.buyersNote')}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-shrink-0 sm:min-w-[200px]">
          {needsCompanyInfo ? (
            <Link
              href="/verkoper/instellingen"
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {t('seller.businessUpgradeCallout.ctaSettings')}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <Link
              href="/sell"
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {t('seller.businessUpgradeCallout.ctaSubscriptions')}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          {!needsCompanyInfo && (
            <Link
              href="/verkoper/instellingen"
              className="text-center text-sm font-medium text-emerald-800 hover:text-emerald-900 underline-offset-2 hover:underline"
            >
              {t('seller.businessUpgradeCallout.editCompanyLink')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
