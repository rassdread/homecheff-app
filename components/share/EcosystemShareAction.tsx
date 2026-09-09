'use client';

import { useCallback, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Check } from 'lucide-react';
import { useMarketplaceShareContext } from '@/hooks/useMarketplaceShareContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  shareListingOrCopy,
  shouldPreferNativeShare,
  toAbsolutePublicUrl,
} from '@/lib/share/listing-share';
import { absoluteOpportunityUrl } from '@/lib/share/ecosystem-opportunities';
import {
  newShareSessionId,
  trackOpportunityClient,
} from '@/lib/analytics/opportunity-analytics-client';
import AffiliatePromoteChooser from '@/components/share/AffiliatePromoteChooser';
import HomecheffVisibleShareSheet from '@/components/share/HomecheffVisibleShareSheet';

type EcosystemShareActionProps = {
  destinationHref: string;
  title: string;
  text?: string;
  surface: string;
  product?: string;
  opportunityId?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'text';
  labelKey?: string;
  label?: string;
};

/**
 * Opportunity share — USER_INTENT_FIRST + ACTIONABLE_AND_VISIBLE.
 * Resolve attribution → optional human dual chooser → native (mobile) or visible destinations.
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
  const { t, isReady } = useTranslation();
  const resolvedLabel = label || (isReady ? t(labelKey) : labelKey === 'share.shareItem' ? 'Delen' : label) || 'Delen';
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  const openSheetWithUrl = useCallback((url: string) => {
    setSheetUrl(url);
    setSheetOpen(true);
  }, []);

  const finishShare = useCallback(
    async (url: string, kind: 'plain' | 'personal' | 'company') => {
      const shareSessionId = newShareSessionId();
      track('opportunity_share_intent', { shareKind: kind, shareSessionId });
      if (kind === 'company') {
        track('opportunity_share_link_created', {
          shareKind: kind,
          shareSessionId,
        });
      }

      // Mobile-prefer native; otherwise always show visible destinations.
      if (shouldPreferNativeShare()) {
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
        if (result.method === 'needs_visible_panel' || result.method === 'failed') {
          openSheetWithUrl(url);
          return result;
        }
        if (result.ok && result.method === 'clipboard') {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }
        return result;
      }

      openSheetWithUrl(url);
      track('opportunity_share_panel_opened', {
        shareKind: kind,
        shareSessionId,
      });
      return { ok: true as const, method: 'clipboard' as const };
    },
    [openSheetWithUrl, text, title, track],
  );

  const resolveAndShare = useCallback(
    async (force?: {
      mode: 'personal' | 'company';
      organizationId?: string;
    }) => {
      try {
        const resolved = await resolveShareUrl({
          listingAbsoluteUrl: absolute,
          surface,
          forceMode: force?.mode,
          forceOrganizationId: force?.organizationId,
        });
        await finishShare(resolved.url, resolved.kind);
      } catch {
        // Still give the user a visible way to share the base destination.
        openSheetWithUrl(absolute);
      }
    },
    [absolute, finishShare, openSheetWithUrl, resolveShareUrl, surface],
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
          <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/45"
              aria-label={isReady ? t('common.close') : 'Sluiten'}
              onClick={() => setChooserOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Voor wie promoot je?"
              className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
            >
              <AffiliatePromoteChooser
                memberships={memberships}
                busy={busy}
                onChoosePersonal={() => {
                  setSharePreference('personal');
                  setChooserOpen(false);
                  setBusy(true);
                  void resolveAndShare({ mode: 'personal' }).finally(() =>
                    setBusy(false),
                  );
                }}
                onChooseCompany={(organizationId) => {
                  setSharePreference('company', organizationId);
                  setChooserOpen(false);
                  setBusy(true);
                  void resolveAndShare({
                    mode: 'company',
                    organizationId,
                  }).finally(() => setBusy(false));
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
        ref={triggerRef}
        type="button"
        onClick={onShare}
        disabled={busy || loading}
        aria-label={copied ? (isReady ? t('share.copied') : 'Link gekopieerd') : resolvedLabel}
        className={`${btnClass} disabled:opacity-60`}
      >
        {busy || loading ? (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        ) : copied ? (
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
        {variant !== 'icon' ? (
          <span>
            {copied
              ? isReady
                ? t('share.copied')
                : 'Link gekopieerd'
              : resolvedLabel}
          </span>
        ) : null}
      </button>
      {chooserPortal}
      <HomecheffVisibleShareSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          window.setTimeout(() => triggerRef.current?.focus(), 0);
        }}
        url={sheetUrl}
        shareTitle={title}
        shareText={text}
        preparing={sheetOpen && !sheetUrl}
        onCopied={() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
          track('opportunity_share_link_copied', { shareMethod: 'panel_copy' });
        }}
        onNativeShare={() => {
          track('opportunity_share_native_opened', { shareMethod: 'panel_more' });
        }}
        copy={{
          title: isReady ? t('share.via') || 'Delen' : 'Delen',
          preparing: isReady ? t('share.preparingLink') || 'Deellink voorbereiden…' : 'Deellink voorbereiden…',
          whatsapp: isReady ? t('share.whatsapp') || 'WhatsApp' : 'WhatsApp',
          email: isReady ? t('share.email') || 'E-mail' : 'E-mail',
          copyLink: isReady ? t('share.copyLink') || 'Link kopiëren' : 'Link kopiëren',
          copied: isReady ? t('share.copied') || 'Link gekopieerd' : 'Link gekopieerd',
          moreOptions: isReady ? t('share.moreOptions') || 'Meer opties' : 'Meer opties',
          close: isReady ? t('common.close') || 'Sluiten' : 'Sluiten',
          error:
            'Delen lukt nu niet automatisch. Kopieer de link en probeer het opnieuw.',
        }}
      />
    </div>
  );
}
