'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

type MeUser = {
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
};

/**
 * Progressive seller activation: nudge address/location when missing, without blocking the whole flow.
 */
export default function SellerActivationGate() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = (await res.json()) as { user?: MeUser };
        if (!cancelled) setUser(data.user ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user, status]);

  useEffect(() => {
    if (dismissed || loading || !user) return;
    const country = (user.country || '').trim();
    const city = (user.city || '').trim();
    const postal = (user.postalCode || '').trim();
    const needsNlPostal = country === 'NL' && !postal;
    const missing = !country || !city || needsNlPostal;
    if (missing && !tracked.current) {
      tracked.current = true;
      trackOnboardingEvent('SELLER_ACTIVATION_STARTED', { surface: 'sell_new' });
    }
  }, [dismissed, loading, user]);

  if (loading || dismissed || !user) return null;
  const country = (user.country || '').trim();
  const city = (user.city || '').trim();
  const postal = (user.postalCode || '').trim();
  const needsNlPostal = country === 'NL' && !postal;
  if (country && city && !needsNlPostal) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
      <p className="font-semibold">{t('sellerActivation.title')}</p>
      <p className="mt-1 text-amber-900/90">{t('sellerActivation.body')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/profile"
          prefetch={false}
          className="inline-flex min-h-[40px] items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          onClick={() =>
            trackOnboardingEvent('SELLER_ACTIVATION_COMPLETED', { step: 'profile_link' })
          }
        >
          {t('sellerActivation.ctaProfile')}
        </Link>
        <button
          type="button"
          className="inline-flex min-h-[40px] items-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
          onClick={() => setDismissed(true)}
        >
          {t('sellerActivation.later')}
        </button>
      </div>
    </div>
  );
}
