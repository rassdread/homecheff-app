'use client';

import { useCallback, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Check } from 'lucide-react';
import { useMarketplaceShareContext } from '@/hooks/useMarketplaceShareContext';
import { useTranslation } from '@/hooks/useTranslation';
import { shareListingOrCopy, toAbsolutePublicUrl } from '@/lib/share/listing-share';
import { absoluteOpportunityUrl } from '@/lib/share/ecosystem-opportunities';
import {
  newShareSessionId,
  trackOpportunityClient,
} from '@/lib/analytics/opportunity-analytics-client';
import AffiliatePromoteChooser from '@/components/share/AffiliatePromoteChooser';

type EcosystemShareActionProps = {
  destinationHref: string;
  title: string;
  text?: string;
  surface: string;
  product?: string;
  opportunityId?: string;
  className?: string;
  /** Compact icon button vs text button */
  variant?: 'icon' | 'button' | 'text';
  labelKey?: string;
  /** Prefer over labelKey when server/static copy is available (avoids empty i18n flash). */
  label?: string;
};

/**
 * Opportunity share — USER_INTENT_FIRST.
 * One primary Delen action; auto-resolve personal/company attribution;
 * native share when available. Dual-context chooser only when both apply.
 */
export default function EcosystemShareAction({
  destinationHref,
  title,
  text,
  surface,
  product,
  opportunityId,
  className = '',
  variant = 'button',
  labelKey = 'share.shareItem',
  label,
}: EcosystemShareActionProps) {
  const { t } = useTranslation();
  const resolvedLabel = label || t(labelKey);
  const {
    needsContextChoice,
    memberships,
    setSharePreference,
    resolveShareUrl,
    loading,
  } = useMarketplaceShareContext();

  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);

  const track = useCallback(
    (event: string, extra?: Record<string, unknown>) => {
      trackOpportunityClient(event, {
        surface,
        product,
        opportunityId,
        ...extra,
      });
    },
    [opportunityId, product, surface],
  );

  const absolute = toAbsolutePublicUrl(absoluteOpportunityUrl(destinationHref));

  const finishShare = useCallback(
    async (url: string, kind: 'plain' | 'personal' | 'company') => {
      const shareSessionId = newShareSessionId();
      track('opportunity_share_intent', { shareKind: kind, shareSessionId });
      if (kind === 'company') {
        track('opportunity_share_link_created', {
          shareKind: kind,
          shareSessionId,
          shareUrlHost: (() => {
            try {
              return new URL(url).host;
            } catch {
              return null;
            }
          })(),
        });
      }
      const result = await shareListingOrCopy({
        url,
        title,
        text: text || title,
      });
      track(
        result.method === 'clipboard'
          ? 'opportunity_share_link_copied'
          : result.ok
            ? 'opportunity_share_native_opened'
            : 'opportunity_share_intent',
        {
          shareMethod: result.method,
          ok: result.ok,
          shareKind: kind,
          shareSessionId,
        },
      );
      if (result.ok && result.method === 'clipboard') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
      return result;
    },
    [text, title, track],
  );

  const resolveAndShare = useCallback(
    async (force?: {
      mode: 'personal' | 'company';
      organizationId?: string;
    }) => {
      const resolved = await resolveShareUrl({
        listingAbsoluteUrl: absolute,
        surface,
        forceMode: force?.mode,
        forceOrganizationId: force?.organizationId,
      });
      await finishShare(resolved.url, resolved.kind);
    },
    [absolute, finishShare, resolveShareUrl, surface],
  );

  const onShare = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy || loading) return;
      setBusy(true);
      try {
        if (needsContextChoice) {
          setChooserOpen(true);
          return;
        }
        await resolveAndShare();
      } finally {
        setBusy(false);
      }
    },
    [busy, loading, needsContextChoice, resolveAndShare],
  );

  const btnClass =
    variant === 'icon'
      ? `inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 ${className}`
      : variant === 'text'
        ? `inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 ${className}`
        : `inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 ${className}`;

  const chooserPortal =
    chooserOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/45"
              aria-label={t('common.close')}
              onClick={() => setChooserOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t('share.chooseContext')}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
            >
              <AffiliatePromoteChooser
                memberships={memberships}
                busy={busy}
                onChoosePersonal={() => {
                  setSharePreference('personal');
                  setBusy(true);
                  void resolveAndShare({ mode: 'personal' })
                    .then(() => setChooserOpen(false))
                    .finally(() => setBusy(false));
                }}
                onChooseCompany={(organizationId) => {
                  setSharePreference('company', organizationId);
                  setBusy(true);
                  void resolveAndShare({
                    mode: 'company',
                    organizationId,
                  })
                    .then(() => setChooserOpen(false))
                    .finally(() => setBusy(false));
                }}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={onShare}
        disabled={busy || loading}
        aria-label={copied ? t('share.copied') : resolvedLabel}
        className={`${btnClass} disabled:opacity-60`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
        {variant !== 'icon' ? (
          <span>{copied ? t('share.copied') : resolvedLabel}</span>
        ) : null}
      </button>
      {chooserPortal}
    </div>
  );
}
