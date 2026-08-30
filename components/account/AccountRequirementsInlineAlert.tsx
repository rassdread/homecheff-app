'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { MissingRequirement } from '@/lib/account-requirements';
import {
  userCopyKeysForMissingRequirement,
  userCopyKeysForMissingRequirements,
} from '@/lib/client/map-api-error-for-user';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Inline, actionable account-requirements panel for listing publish errors.
 * Shown above Annuleren / Aanbod plaatsen — never raw API codes.
 */
export default function AccountRequirementsInlineAlert({
  missing,
  showAdjustPayment,
  onAdjustPayment,
}: {
  missing: MissingRequirement[];
  /** When HomeCheff payment is selected and Stripe is the issue (or soft guidance). */
  showAdjustPayment?: boolean;
  onAdjustPayment?: () => void;
}) {
  const { t } = useTranslation();
  const [stripeBusy, setStripeBusy] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const primary = userCopyKeysForMissingRequirements(missing);
  if (!primary || !missing.length) return null;

  const runStripe = async () => {
    setStripeBusy(true);
    setStripeError(null);
    const result = await startStripeConnectOnboarding({
      returnPath:
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/sell/new',
    });
    if (!result.ok) {
      setStripeError(result.error ?? t('marketplace.settlement.connectError'));
    }
    setStripeBusy(false);
  };

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950"
      role="alert"
      data-testid="account-requirements-inline"
    >
      <p className="font-semibold leading-snug">{t(primary.titleKey as never)}</p>
      <p className="mt-1 leading-relaxed text-amber-900/90">
        {t(primary.bodyKey as never)}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {missing.map((item) => {
          const copy = userCopyKeysForMissingRequirement(item.key);
          if (copy.actionKind === 'stripeOnboard') {
            return (
              <button
                key={item.key}
                type="button"
                disabled={stripeBusy}
                onClick={() => void runStripe()}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
              >
                {stripeBusy
                  ? t('accountRequirementsUx.stripeOnboarding.busy')
                  : t(copy.ctaKey as never)}
              </button>
            );
          }
          return (
            <Link
              key={item.key}
              href={copy.actionHref ?? item.actionHref}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 sm:w-auto"
            >
              {t(copy.ctaKey as never)}
            </Link>
          );
        })}
        {showAdjustPayment && onAdjustPayment ? (
          <button
            type="button"
            onClick={onAdjustPayment}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-amber-950 hover:bg-amber-100/60 sm:w-auto"
          >
            {t('accountRequirementsUx.adjustPayment.cta')}
          </button>
        ) : null}
      </div>
      {stripeError ? (
        <p className="mt-2 text-xs text-red-800" role="alert">
          {stripeError}
        </p>
      ) : null}
    </div>
  );
}
