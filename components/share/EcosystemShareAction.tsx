'use client';

import { useCallback, useState, type MouseEvent } from 'react';
import { Share2, Check } from 'lucide-react';
import { useMarketplaceShareContext } from '@/hooks/useMarketplaceShareContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  canUseWebShare,
  shareListingOrCopy,
  toAbsolutePublicUrl,
} from '@/lib/share/listing-share';
import { absoluteOpportunityUrl } from '@/lib/share/ecosystem-opportunities';
import {
  newShareSessionId,
  trackOpportunityClient,
} from '@/lib/analytics/opportunity-analytics-client';

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
};

/**
 * Universal opportunity share — personal ?ref= / company /a/[slug] / plain.
 * Reuses Marketplace share context; iOS-safe second tap when company URL is async.
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
}: EcosystemShareActionProps) {
  const { t } = useTranslation();
  const {
    mode,
    needsContextChoice,
    memberships,
    setSharePreference,
    resolveShareUrl,
    loading,
  } = useMarketplaceShareContext();

  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const [preparedKind, setPreparedKind] = useState<'plain' | 'personal' | 'company' | null>(
    null,
  );

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

  const absolute = toAbsolutePublicUrl(
    absoluteOpportunityUrl(destinationHref),
  );

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
        { shareMethod: result.method, ok: result.ok, shareKind: kind, shareSessionId },
      );
      if (result.ok && result.method === 'clipboard') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
      return result;
    },
    [text, title, track],
  );

  const onShare = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy || loading) return;
      setBusy(true);
      try {
        if (needsContextChoice) {
          setPanelOpen(true);
          return;
        }
        const resolved = await resolveShareUrl({
          listingAbsoluteUrl: absolute,
          surface,
        });
        if (resolved.kind === 'company' && !resolved.fromCache) {
          setPreparedUrl(resolved.url);
          setPreparedKind('company');
          setPanelOpen(true);
          return;
        }
        await finishShare(resolved.url, resolved.kind);
      } finally {
        setBusy(false);
      }
    },
    [
      absolute,
      busy,
      finishShare,
      loading,
      needsContextChoice,
      resolveShareUrl,
      surface,
    ],
  );

  const btnClass =
    variant === 'icon'
      ? `inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 ${className}`
      : variant === 'text'
        ? `inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 ${className}`
        : `inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 ${className}`;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={onShare}
        disabled={busy || loading}
        aria-label={copied ? t('share.copied') : t(labelKey)}
        className={`${btnClass} disabled:opacity-60`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
        {variant !== 'icon' ? (
          <span>{copied ? t('share.copied') : t(labelKey)}</span>
        ) : null}
      </button>

      {panelOpen ? (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setPanelOpen(false)} />
          <div
            role="dialog"
            aria-label={t('share.via')}
            className="absolute right-0 bottom-full z-50 mb-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
          >
            {needsContextChoice && !preparedUrl ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-600">{t('share.chooseContext')}</p>
                <button
                  type="button"
                  className="rounded-lg bg-emerald-50 px-3 py-2 text-left text-sm font-medium text-emerald-900"
                  onClick={async () => {
                    setSharePreference('personal');
                    setBusy(true);
                    try {
                      const r = await resolveShareUrl({
                        listingAbsoluteUrl: absolute,
                        surface,
                        forceMode: 'personal',
                      });
                      setPanelOpen(false);
                      await finishShare(r.url, r.kind);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t('share.shareAsYourself')}
                </button>
                {memberships.map((m) => (
                  <button
                    key={m.organizationId}
                    type="button"
                    className="rounded-lg bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-900"
                    onClick={async () => {
                      setSharePreference('company', m.organizationId);
                      setBusy(true);
                      try {
                        const r = await resolveShareUrl({
                          listingAbsoluteUrl: absolute,
                          surface,
                          forceMode: 'company',
                          forceOrganizationId: m.organizationId,
                        });
                        setPreparedUrl(r.url);
                        setPreparedKind(r.kind);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {t('share.shareOnBehalfOf', {
                      company: m.displayName || m.companyName,
                    })}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {!preparedUrl ? (
                  <p className="text-xs text-amber-800">{t('share.preparingCompanyLink')}</p>
                ) : (
                  <>
                    {canUseWebShare() ? (
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                        onClick={async () => {
                          if (!preparedUrl || !preparedKind) return;
                          await finishShare(preparedUrl, preparedKind);
                          setPanelOpen(false);
                        }}
                      >
                        {t('share.shareNow')}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium"
                      onClick={async () => {
                        if (!preparedUrl || !preparedKind) return;
                        await navigator.clipboard.writeText(preparedUrl);
                        track('opportunity_share_link_copied', {
                          shareKind: preparedKind,
                        });
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 2000);
                        setPanelOpen(false);
                      }}
                    >
                      {t('share.copyLink')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      ) : null}
      {mode.kind === 'company' ? null : null}
    </div>
  );
}
