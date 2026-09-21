'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import {
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
  type VerdienCheckEntryPoint,
} from '@/lib/analytics/verdiencheck-funnel';
import { savePendingIntent } from '@/lib/onboarding/pending-intent';
import { markVerdienCheckSellerActivation } from '@/lib/verdiencheck/activation-handoff';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import type { ActivityChoice } from '@/lib/verdiencheck/wizard/schema';
import {
  listingCtaPromptKey,
  type ResultCtaMode,
} from '@/lib/verdiencheck/presentation/earning-context';
import VerdienCheckGrowthPath from '@/components/verdiencheck/VerdienCheckGrowthPath';
import VerdienCheckShareAction from '@/components/verdiencheck/VerdienCheckShareAction';
import { OPPORTUNITY_DESTINATIONS } from '@/lib/share/ecosystem-opportunities';

const SELL_HREF = '/sell/new';
const DISCOVER_HREF = '/wat-is-homecheff';
const AFFILIATE_ACTIVITY_HREF = '/werken-bij';
const AFFILIATE_DISCOVER_HREF = OPPORTUNITY_DESTINATIONS.affiliate.href;

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
  ctaMode?: ResultCtaMode;
  completed?: boolean;
  activity?: ActivityChoice | null;
  moneyCompleted?: boolean;
  includeShare?: boolean;
}) {
  const { requireAuthAction, guestAuthPanel, isGuest } = useGuestAuthGate();
  const variant = props.variant ?? 'all';
  const mode =
    props.ctaMode ??
    (props.primaryStartSelling
      ? 'SELL_PRIMARY'
      : props.secondaryStartSelling
        ? 'SELL_SECONDARY'
        : 'NONE');
  const showSellBlock = variant === 'sell' || variant === 'all';
  const showNav = variant === 'nav' || variant === 'all';
  const showListingSell =
    showSellBlock && (mode === 'SELL_PRIMARY' || mode === 'SELL_SECONDARY');
  const showDiscover = showSellBlock && mode === 'DISCOVER';
  const showAffiliate = showSellBlock && mode === 'AFFILIATE';
  const showShare =
    props.includeShare ??
    (showNav && Boolean(props.completed) && !showListingSell && !showDiscover && !showAffiliate);
  const promptKey = listingCtaPromptKey(props.activity);
  const listingPrompt = props.copy[promptKey] || props.copy.keepOverviewPrompt;
  const sellLabel = isGuest ? props.copy.placeFirstOffer : props.copy.placeNewOffer;

  function trackHomecheffCta(ctaId: 'sell_primary' | 'sell_secondary') {
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.homecheffCtaClicked, {
      entry_point: props.entryPoint,
      action: isGuest ? 'SIGN_UP' : 'START_SELLING',
      authenticated: isGuest ? 'no' : 'yes',
      cta_id: ctaId,
      funnel_stage: 'result',
    });
    if (isGuest) {
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.signupClicked, {
        entry_point: props.entryPoint,
        action: 'SIGN_UP',
        authenticated: 'no',
        cta_id: ctaId,
      });
    } else {
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.startSellingClicked, {
        entry_point: props.entryPoint,
        action: 'START_SELLING',
        authenticated: 'yes',
        cta_id: ctaId,
      });
    }
  }

  function onStartSelling(e: MouseEvent) {
    markVerdienCheckSellerActivation();
    savePendingIntent({
      type: 'create_item',
      mode: 'dorpsplein',
      returnPath: SELL_HREF,
    });
    trackHomecheffCta(mode === 'SELL_SECONDARY' ? 'sell_secondary' : 'sell_primary');
    requireAuthAction('create', SELL_HREF, e);
  }

  const sellClassPrimary =
    'relative z-[80] inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-lg font-semibold text-white pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';
  const sellClassSecondary =
    'relative z-[80] inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-700 bg-white px-4 py-3 text-lg font-medium text-emerald-900 pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';

  return (
    <div className="space-y-3" data-verdiencheck-result-cta="">
      {showListingSell && props.moneyCompleted ? (
        <VerdienCheckGrowthPath copy={props.copy} />
      ) : null}
      {showListingSell ? (
        <p className="text-base leading-relaxed text-gray-700">{listingPrompt}</p>
      ) : null}
      {showListingSell && mode === 'SELL_PRIMARY' ? (
        <button
          type="button"
          className={sellClassPrimary}
          data-verdiencheck-primary-cta="sell"
          onClick={onStartSelling}
        >
          {sellLabel}
        </button>
      ) : null}
      {showListingSell && mode === 'SELL_SECONDARY' ? (
        <button
          type="button"
          className={sellClassSecondary}
          data-verdiencheck-primary-cta="sell-secondary"
          onClick={onStartSelling}
        >
          {sellLabel}
        </button>
      ) : null}
      {showDiscover ? (
        <>
          <p className="text-base leading-relaxed text-gray-700">{props.copy.discoverHomecheffBody}</p>
          <Link
            href={DISCOVER_HREF}
            className={sellClassSecondary}
            data-verdiencheck-primary-cta="discover"
            onClick={() =>
              trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.exitToHomecheff, {
                entry_point: props.entryPoint,
                action: 'LEARN_MORE',
              })
            }
          >
            {props.copy.discoverHomecheff}
          </Link>
        </>
      ) : null}
      {showAffiliate ? (
        <>
          <p className="text-base leading-relaxed text-gray-700">{props.copy.affiliatePartnerBody}</p>
          <Link
            href={AFFILIATE_ACTIVITY_HREF}
            className={sellClassSecondary}
            data-verdiencheck-primary-cta="affiliate"
            onClick={() =>
              trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.exitToHomecheff, {
                entry_point: props.entryPoint,
                action: 'LEARN_MORE',
                cta_id: 'affiliate',
              })
            }
          >
            {props.copy.affiliatePartnerCta}
          </Link>
        </>
      ) : null}
      {showListingSell && isGuest ? (
        <p className="text-base leading-relaxed text-gray-600">{props.copy.startSellingNeedsAccount}</p>
      ) : null}
      {showShare ? (
        <div className="space-y-2" data-verdiencheck-result-share="">
          <p className="text-base leading-relaxed text-gray-700">{props.copy.shareAfterResult}</p>
          <VerdienCheckShareAction
            copy={props.copy}
            variant="button"
            className="w-full justify-center"
            surface="verdiencheck_result"
            label={props.copy.shareAction}
          />
        </div>
      ) : null}
      {showListingSell ? (
        <p className="text-center text-sm">
          <Link
            href={AFFILIATE_DISCOVER_HREF}
            className="text-gray-600 underline underline-offset-2 hover:text-gray-800"
            data-verdiencheck-tertiary-cta="affiliate"
            onClick={() =>
              trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.exitToHomecheff, {
                entry_point: props.entryPoint,
                action: 'LEARN_MORE',
                cta_id: 'affiliate',
              })
            }
          >
            {props.copy.affiliateDiscoverLink}
          </Link>
        </p>
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
            {props.completed ? props.copy.restartCompleted : props.copy.restartFromStart}
          </button>
        </>
      ) : null}
      {showListingSell ? guestAuthPanel : null}
    </div>
  );
}
