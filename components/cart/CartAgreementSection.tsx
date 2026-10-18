'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  agreementCurrencyAllowsEurStripe,
  buyerAgreementCards,
} from '@/lib/checkout/fulfillment-phase1';
import { DEALS_PROFILE_PATH } from '@/lib/profile/deals-navigation';
import type { ProfileDealDTO } from '@/lib/proposals/profile-deal-types';
import { useTranslation } from '@/hooks/useTranslation';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function formatAgreedAmount(cents: number | null, currency: string | null | undefined): string | null {
  if (typeof cents !== 'number' || cents <= 0) return null;
  const code = (currency || 'EUR').trim().toUpperCase() || 'EUR';
  return `${code} ${(cents / 100).toFixed(2)}`;
}

export default function CartAgreementSection({ active }: { active: boolean }) {
  const { t } = useTranslation();
  const { status } = useSession();
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [deals, setDeals] = useState<ProfileDealDTO[]>([]);

  const load = useCallback(async () => {
    if (status !== 'authenticated') {
      setDeals([]);
      setLoadState('idle');
      return;
    }
    setLoadState('loading');
    try {
      const response = await fetch('/api/profile/deals?status=OPEN', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        setLoadState('error');
        return;
      }
      const rows = Array.isArray(data.deals) ? (data.deals as ProfileDealDTO[]) : [];
      setDeals(buyerAgreementCards(rows));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [status]);

  useEffect(() => {
    if (!active) return;
    void load();
  }, [active, load]);

  if (status !== 'authenticated') return null;

  return (
    <section className="border-t border-neutral-200 px-6 py-5" aria-labelledby="cart-agreements-heading">
      <h3 id="cart-agreements-heading" className="text-base font-bold text-neutral-900">
        {t('cart.agreementsHeading')}
      </h3>
      <p className="mt-1 text-xs text-neutral-600">{t('cart.agreementsHint')}</p>

      {loadState === 'loading' || loadState === 'idle' ? (
        <p className="mt-3 text-sm text-neutral-600">{t('cart.agreementsLoading')}</p>
      ) : null}

      {loadState === 'error' ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {t('cart.agreementsError')}
        </p>
      ) : null}

      {loadState === 'ready' && deals.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600">{t('cart.agreementsEmpty')}</p>
      ) : null}

      {loadState === 'ready' ? (
        <ul className="mt-3 space-y-3">
          {deals.map((deal) => {
            const currency = deal.proposal?.currency || 'EUR';
            const amount = formatAgreedAmount(deal.amountCents, currency);
            const values = deal.requestedValueTaxonomyIds ?? [];
            const fulfillment =
              deal.proposal?.fulfillmentType || deal.fulfillmentMode || null;
            const payHref = deal.dealUx?.primaryCta?.href;
            const currencyBlocksPay =
              deal.dealUx?.primaryCta?.kind === 'PAY_CHECKOUT' &&
              !agreementCurrencyAllowsEurStripe(currency);
            const actionLabel = deal.dealUx?.primaryCta?.labelKey
              ? t(deal.dealUx.primaryCta.labelKey)
              : t('cart.viewAgreement');

            return (
              <li
                key={deal.id}
                className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3"
                data-cart-agreement-id={deal.id}
              >
                <p className="text-sm font-semibold text-emerald-950">
                  {deal.proposalTitle || deal.proposal?.title}
                </p>
                {deal.counterpartName ? (
                  <p className="text-xs text-emerald-900">{deal.counterpartName}</p>
                ) : null}
                {amount ? <p className="mt-1 text-sm font-medium text-emerald-950">{amount}</p> : null}
                {values.length > 0 ? (
                  <p className="mt-1 text-xs text-emerald-900">{values.join(', ')}</p>
                ) : null}
                {fulfillment ? (
                  <p className="mt-1 text-xs text-emerald-800">{fulfillment}</p>
                ) : null}
                {deal.dealUx ? (
                  <>
                    <p className="mt-2 text-xs font-medium text-emerald-900">
                      {t(deal.dealUx.statusLabelKey)}
                    </p>
                    <p className="text-xs text-emerald-800">{t(deal.dealUx.nextStepHintKey)}</p>
                  </>
                ) : null}
                <div className="mt-2 flex flex-col gap-1">
                  {currencyBlocksPay ? (
                    <p className="text-xs text-amber-900">{t('communityOrder.checkoutCurrencyUnsupported')}</p>
                  ) : payHref ? (
                    <Link href={payHref} className="text-sm font-semibold text-emerald-950 underline">
                      {actionLabel}
                    </Link>
                  ) : (
                    <p className="text-xs font-medium text-emerald-900">{actionLabel}</p>
                  )}
                  <Link href={DEALS_PROFILE_PATH} className="text-xs font-semibold text-emerald-900 underline">
                    {t('cart.viewAgreement')}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
