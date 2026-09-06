'use client';

import { useCallback, useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Share2, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMarketplaceShareContext } from '@/hooks/useMarketplaceShareContext';
import { useTranslation } from '@/hooks/useTranslation';
import { cardActionBoundaryProps } from '@/lib/ui/card-action-boundary';
import {
  canUseWebShare,
  shareListingOrCopy,
  toAbsolutePublicUrl,
} from '@/lib/share/listing-share';

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
 * Compact share control for Marketplace listing tiles.
 * Personal: one-click share with ?ref=.
 * Company: ensure /a/[slug] (reuse), second tap when async (iOS user-activation safe).
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
  const { t } = useTranslation();
  const { data: session } = useSession();
  const {
    mode,
    memberships,
    loading: contextLoading,
    needsContextChoice,
    setSharePreference,
    resolveShareUrl,
  } = useMarketplaceShareContext();

  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const [preparedKind, setPreparedKind] = useState<'plain' | 'personal' | 'company' | null>(
    null,
  );
  const [preparing, setPreparing] = useState(false);

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

  const runShareWithUrl = useCallback(
    async (url: string, kind: 'plain' | 'personal' | 'company') => {
      const result = await shareListingOrCopy({
        url,
        title,
        text: description?.trim() || title,
      });
      trackAnalytics(result.method, result.ok, kind);
      if (result.ok && result.method === 'clipboard') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } else if (!result.ok && result.method === 'failed') {
        setError(t('share.copyFailed'));
        window.setTimeout(() => setError(null), 2500);
      }
      return result;
    },
    [description, t, title, trackAnalytics],
  );

  const prepareCompanyOrChoice = useCallback(
    async (force?: { mode: 'personal' | 'company'; organizationId?: string }) => {
      setPreparing(true);
      setError(null);
      try {
        const absolute = toAbsolutePublicUrl(href, baseUrl);
        const resolved = await resolveShareUrl({
          listingAbsoluteUrl: absolute,
          surface,
          forceMode: force?.mode,
          forceOrganizationId: force?.organizationId,
        });
        setPreparedUrl(resolved.url);
        setPreparedKind(resolved.kind);
        return resolved;
      } finally {
        setPreparing(false);
      }
    },
    [baseUrl, href, resolveShareUrl, surface],
  );

  const onShare = useCallback(
    async (e: MouseEvent | KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      setError(null);

      const absolute = toAbsolutePublicUrl(href, baseUrl);

      // Dual-role ambiguity → open choice panel (no silent company force)
      if (needsContextChoice && !preparedUrl) {
        setPanelOpen(true);
        return;
      }

      // Company context: open panel for iOS-safe second activation when URL not cached yet
      if (mode.kind === 'company') {
        setBusy(true);
        try {
          const resolved = await resolveShareUrl({
            listingAbsoluteUrl: absolute,
            surface,
          });
          if (resolved.kind === 'company' && resolved.fromCache) {
            await runShareWithUrl(resolved.url, 'company');
            return;
          }
          if (resolved.kind === 'company') {
            setPreparedUrl(resolved.url);
            setPreparedKind('company');
            setPanelOpen(true);
            return;
          }
          await runShareWithUrl(resolved.url, resolved.kind);
        } finally {
          setBusy(false);
        }
        return;
      }

      // Personal / plain — one-click (sync from cached personal code)
      if (!shareReady) return;
      setBusy(true);
      try {
        const resolved = await resolveShareUrl({ listingAbsoluteUrl: absolute, surface });
        await runShareWithUrl(resolved.url, resolved.kind);
      } finally {
        setBusy(false);
      }
    },
    [
      baseUrl,
      busy,
      href,
      mode.kind,
      needsContextChoice,
      preparedUrl,
      resolveShareUrl,
      runShareWithUrl,
      shareReady,
      surface,
    ],
  );

  const onChoosePersonal = useCallback(async () => {
    setSharePreference('personal');
    setBusy(true);
    try {
      const absolute = toAbsolutePublicUrl(href, baseUrl);
      const resolved = await resolveShareUrl({
        listingAbsoluteUrl: absolute,
        surface,
        forceMode: 'personal',
      });
      setPanelOpen(false);
      await runShareWithUrl(resolved.url, resolved.kind);
    } finally {
      setBusy(false);
    }
  }, [baseUrl, href, resolveShareUrl, runShareWithUrl, setSharePreference, surface]);

  const onChooseCompany = useCallback(
    async (organizationId: string) => {
      setSharePreference('company', organizationId);
      setBusy(true);
      try {
        const resolved = await prepareCompanyOrChoice({
          mode: 'company',
          organizationId,
        });
        // Keep panel open for second activation (iOS)
        if (resolved.kind === 'company' && canUseWebShare()) {
          setPanelOpen(true);
          return;
        }
        setPanelOpen(false);
        await runShareWithUrl(resolved.url, resolved.kind);
      } finally {
        setBusy(false);
      }
    },
    [prepareCompanyOrChoice, runShareWithUrl, setSharePreference],
  );

  const onConfirmPreparedShare = useCallback(async () => {
    if (!preparedUrl || !preparedKind) return;
    setBusy(true);
    try {
      await runShareWithUrl(preparedUrl, preparedKind);
      setPanelOpen(false);
    } finally {
      setBusy(false);
    }
  }, [preparedKind, preparedUrl, runShareWithUrl]);

  const onConfirmPreparedCopy = useCallback(async () => {
    if (!preparedUrl || !preparedKind) return;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(preparedUrl);
      trackAnalytics('clipboard', true, preparedKind);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      setPanelOpen(false);
    } catch {
      setError(t('share.copyFailed'));
    } finally {
      setBusy(false);
    }
  }, [preparedKind, preparedUrl, t, trackAnalytics]);

  useEffect(() => {
    if (!panelOpen) return;
    if (mode.kind === 'company' && !preparedUrl && !preparing) {
      void prepareCompanyOrChoice();
    }
  }, [mode.kind, panelOpen, prepareCompanyOrChoice, preparedUrl, preparing]);

  const companyLabel =
    memberships.find((m) =>
      mode.kind === 'company' ? m.organizationId === mode.organizationId : true,
    )?.displayName ||
    memberships[0]?.companyName ||
    '';

  return (
    <div {...cardActionBoundaryProps()} className={`relative ${className}`} data-preview-ignore>
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        aria-label={copied ? t('share.copied') : t('share.shareItem')}
        title={copied ? t('share.copied') : t('share.shareItem')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md ring-1 ring-white/80 backdrop-blur-sm transition-colors hover:bg-white hover:text-secondary-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-brand disabled:opacity-60"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden />
        )}
      </button>

      {panelOpen ? (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setPanelOpen(false)}
          />
          <div
            role="dialog"
            aria-label={t('share.via')}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
          >
            {needsContextChoice && !preparedUrl ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-600">{t('share.chooseContext')}</p>
                <button
                  type="button"
                  className="rounded-lg bg-emerald-50 px-3 py-2 text-left text-sm font-medium text-emerald-900 hover:bg-emerald-100"
                  onClick={() => void onChoosePersonal()}
                >
                  {t('share.shareAsYourself')}
                </button>
                {memberships.map((m) => (
                  <button
                    key={m.organizationId}
                    type="button"
                    className="rounded-lg bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-100"
                    onClick={() => void onChooseCompany(m.organizationId)}
                  >
                    {t('share.shareOnBehalfOf', {
                      company: m.displayName || m.companyName,
                    })}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {preparing || !preparedUrl ? (
                  <p className="text-xs text-amber-800">{t('share.preparingCompanyLink')}</p>
                ) : (
                  <>
                    <p className="text-xs text-emerald-800">
                      {preparedKind === 'company'
                        ? t('share.companyHint', { company: companyLabel })
                        : t('share.affiliateHint')}
                    </p>
                    {canUseWebShare() ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        onClick={() => void onConfirmPreparedShare()}
                      >
                        {t('share.shareNow')}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                      onClick={() => void onConfirmPreparedCopy()}
                    >
                      {copied ? t('share.copied') : t('share.copyLink')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      ) : null}

      {error ? (
        <span className="sr-only" role="status">
          {error}
        </span>
      ) : null}
      {copied ? (
        <span className="sr-only" role="status">
          {t('share.copied')}
        </span>
      ) : null}
    </div>
  );
}
