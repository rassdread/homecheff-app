'use client';

import { useCallback, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMarketplaceShareContext } from '@/hooks/useMarketplaceShareContext';
import { useTranslation } from '@/hooks/useTranslation';
import { cardActionBoundaryProps } from '@/lib/ui/card-action-boundary';
import {
  shareListingOrCopy,
  shouldPreferNativeShare,
  toAbsolutePublicUrl,
} from '@/lib/share/listing-share';
import AffiliatePromoteChooser from '@/components/share/AffiliatePromoteChooser';
import HomecheffVisibleShareSheet from '@/components/share/HomecheffVisibleShareSheet';

type TileShareActionProps = {
  href: string;
  title: string;
  description?: string | null;
  baseUrl?: string;
  surface?: 'feed' | 'search' | 'profile' | 'category' | 'tile';
  listingId?: string;
  className?: string;
};

/**
 * Compact share for Marketplace tiles — same visible share layer as Verdien hub.
 */
export default function TileShareAction({
  href,
  title,
  description,
  baseUrl,
  surface = 'tile',
  listingId,
  className = '',
}: TileShareActionProps) {
  const { t, isReady } = useTranslation();
  const { data: session } = useSession();
  const {
    memberships,
    loading: contextLoading,
    needsContextChoice,
    setSharePreference,
    resolveShareUrl,
  } = useMarketplaceShareContext();

  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const shareReady = !session?.user?.email || !contextLoading;

  const trackAnalytics = useCallback(
    (shareMethod: string, ok: boolean, kind?: string | null) => {
      if (typeof window === 'undefined') return;
      const w = window as Window & {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: Record<string, unknown>[];
      };
      const payload = {
        listingId: listingId || undefined,
        surface,
        shareMethod,
        ok,
        shareKind: kind || undefined,
      };
      try {
        if (typeof w.gtag === 'function') w.gtag('event', 'listing_share_clicked', payload);
        if (Array.isArray(w.dataLayer)) {
          w.dataLayer.push({ event: 'listing_share_clicked', ...payload });
        }
      } catch {
        /* ignore */
      }
    },
    [listingId, surface],
  );

  const openSheet = useCallback((url: string) => {
    setSheetUrl(url);
    setSheetOpen(true);
  }, []);

  const runShareWithUrl = useCallback(
    async (url: string, kind: 'plain' | 'personal' | 'company') => {
      if (shouldPreferNativeShare()) {
        const result = await shareListingOrCopy({
          url,
          title,
          text: description?.trim() || title,
        });
        trackAnalytics(result.method, result.ok, kind);
        if (result.method === 'needs_visible_panel' || result.method === 'failed') {
          openSheet(url);
          return result;
        }
        if (result.ok && result.method === 'clipboard') {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }
        return result;
      }
      openSheet(url);
      trackAnalytics('panel', true, kind);
      return { ok: true as const, method: 'clipboard' as const };
    },
    [description, openSheet, title, trackAnalytics],
  );

  const resolveAndShare = useCallback(
    async (force?: {
      mode: 'personal' | 'company';
      organizationId?: string;
    }) => {
      const absolute = toAbsolutePublicUrl(href, baseUrl);
      const resolved = await resolveShareUrl({
        listingAbsoluteUrl: absolute,
        surface,
        forceMode: force?.mode,
        forceOrganizationId: force?.organizationId,
      });
      await runShareWithUrl(resolved.url, resolved.kind);
    },
    [baseUrl, href, resolveShareUrl, runShareWithUrl, surface],
  );

  const onShare = useCallback(
    async (e: MouseEvent | KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy || !shareReady) return;
      if (needsContextChoice) {
        setChooserOpen(true);
        return;
      }
      setBusy(true);
      try {
        await resolveAndShare();
      } finally {
        setBusy(false);
      }
    },
    [busy, needsContextChoice, resolveAndShare, shareReady],
  );

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
                  void resolveAndShare({ mode: 'personal' }).finally(() => setBusy(false));
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
    <div {...cardActionBoundaryProps()} className={`relative ${className}`} data-preview-ignore>
      <button
        ref={triggerRef}
        type="button"
        onClick={onShare}
        disabled={busy || !shareReady}
        aria-label={copied ? (isReady ? t('share.copied') : 'Link gekopieerd') : isReady ? t('share.shareItem') : 'Delen'}
        title={copied ? (isReady ? t('share.copied') : 'Link gekopieerd') : isReady ? t('share.shareItem') : 'Delen'}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md ring-1 ring-white/80 backdrop-blur-sm transition-colors hover:bg-white hover:text-secondary-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-brand disabled:opacity-60"
      >
        {busy ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        ) : copied ? (
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
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
        shareText={description?.trim() || title}
        onCopied={() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
          trackAnalytics('panel_copy', true, null);
        }}
      />
    </div>
  );
}
