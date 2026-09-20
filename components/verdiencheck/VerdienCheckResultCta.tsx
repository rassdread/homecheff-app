'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import {
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
  type VerdienCheckEntryPoint,
} from '@/lib/analytics/verdiencheck-funnel';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

const SELL_HREF = '/sell/new';

export default function VerdienCheckResultCta(props: {
  copy: VerdienCheckCopy;
  entryPoint: VerdienCheckEntryPoint;
  /** Primary sell CTA only when the user can begin. Never encodes legal/benefit route. */
  primaryStartSelling: boolean;
  /** Secondary sell CTA below required checks — not above NOW cards. */
  secondaryStartSelling: boolean;
  onRestart: () => void;
  /** sell = listing CTA only; nav = leave/restart; all = both (fallback). */
  variant?: 'sell' | 'nav' | 'all';
}) {
  const { requireAuthAction, guestAuthPanel, isGuest } = useGuestAuthGate();
  const variant = props.variant ?? 'all';
  const showSellBlock = variant === 'sell' || variant === 'all';
  const showNav = variant === 'nav' || variant === 'all';

  function onStartSelling(e: MouseEvent) {
    if (isGuest) {
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.signupClicked, {
        entry_point: props.entryPoint,
        action: 'SIGN_UP',
      });
    } else {
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.startSellingClicked, {
        entry_point: props.entryPoint,
        action: 'START_SELLING',
      });
    }
    requireAuthAction('create', SELL_HREF, e);
  }

  const sellClassPrimary =
    'relative z-[80] inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-lg font-semibold text-white pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';
  const sellClassSecondary =
    'relative z-[80] inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-700 bg-white px-4 py-3 text-lg font-medium text-emerald-900 pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';

  const showSell =
    showSellBlock &&
    (props.primaryStartSelling || (props.secondaryStartSelling && !props.primaryStartSelling));

  return (
    <div className="space-y-3" data-verdiencheck-result-cta="">
      {showSellBlock && props.primaryStartSelling ? (
        <button
          type="button"
          className={sellClassPrimary}
          data-verdiencheck-primary-cta="sell"
          onClick={onStartSelling}
        >
          {props.copy.startSelling}
        </button>
      ) : null}
      {showSellBlock && props.secondaryStartSelling && !props.primaryStartSelling ? (
        <button
          type="button"
          className={sellClassSecondary}
          data-verdiencheck-primary-cta="sell-secondary"
          onClick={onStartSelling}
        >
          {props.copy.startSelling}
        </button>
      ) : null}
      {showSell && isGuest ? (
        <p className="text-base leading-relaxed text-gray-600">{props.copy.startSellingNeedsAccount}</p>
      ) : null}
      {showNav ? (
        <>
          <Link
            href="/"
            className="relative z-[80] inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg text-gray-800 pointer-events-auto"
            onClick={() =>
              trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.exitToHomecheff, {
                entry_point: props.entryPoint,
                action: 'RETURN_TO_HOMECHEFF',
              })
            }
          >
            {props.copy.leaveProduct}
          </Link>
          <button
            type="button"
            className="relative z-[80] inline-flex min-h-12 w-full items-center justify-center text-base text-gray-600 underline pointer-events-auto"
            onClick={props.onRestart}
          >
            {props.copy.restartCheck}
          </button>
        </>
      ) : null}
      {showSell ? guestAuthPanel : null}
    </div>
  );
}
