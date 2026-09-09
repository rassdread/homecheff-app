'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Mail, MessageCircle, Share2, X } from 'lucide-react';
import {
  buildMailtoShareUrl,
  buildWhatsAppShareUrl,
  canUseWebShare,
  shouldPreferNativeShare,
} from '@/lib/share/listing-share';

export type VisibleShareCopy = {
  title: string;
  preparing: string;
  error: string;
  whatsapp: string;
  email: string;
  copyLink: string;
  copied: string;
  moreOptions: string;
  close: string;
};

const DEFAULT_COPY_NL: VisibleShareCopy = {
  title: 'Delen',
  preparing: 'Deellink voorbereiden…',
  error: 'Delen lukt nu niet automatisch. Kopieer de link en probeer het opnieuw.',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  copyLink: 'Link kopiëren',
  copied: 'Link gekopieerd',
  moreOptions: 'Meer opties',
  close: 'Sluiten',
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Final absolute URL (already attributed). */
  url: string | null;
  shareTitle: string;
  shareText?: string;
  preparing?: boolean;
  copy?: Partial<VisibleShareCopy>;
  /** Called after a successful copy. */
  onCopied?: () => void;
  /** Called when native "Meer opties" is used. */
  onNativeShare?: () => void;
};

/**
 * Single visible HomeCheff share presentation layer.
 * Desktop: always actionable destinations. Mobile: same panel as fallback.
 */
export default function HomecheffVisibleShareSheet({
  open,
  onClose,
  url,
  shareTitle,
  shareText,
  preparing = false,
  copy: copyOverrides,
  onCopied,
  onNativeShare,
}: Props) {
  const copy: VisibleShareCopy = { ...DEFAULT_COPY_NL, ...copyOverrides };
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset confirmation only when the sheet opens — not when parent re-creates onClose.
  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setError(null);
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const doCopy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setError(null);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(copy.error);
    }
  }, [copy.error, onCopied, url]);

  const doNative = useCallback(async () => {
    if (!url || !canUseWebShare()) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText || shareTitle,
        url,
      });
      onNativeShare?.();
      onClose();
    } catch (err) {
      const name =
        err && typeof err === 'object' && 'name' in err
          ? String((err as { name: string }).name)
          : '';
      if (name === 'AbortError') return;
      setError(copy.error);
    }
  }, [copy.error, onClose, onNativeShare, shareText, shareTitle, url]);

  if (!open || typeof document === 'undefined') return null;

  const ready = Boolean(url) && !preparing;
  const showNative = canUseWebShare();

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={copy.close}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[min(90vh,640px)] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {copy.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label={copy.close}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {preparing || !url ? (
            <p className="flex items-center gap-2 text-sm text-slate-600" role="status">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
                aria-hidden
              />
              {copy.preparing}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {error}
            </p>
          ) : null}

          <div className={`grid grid-cols-1 gap-2 ${!ready ? 'pointer-events-none opacity-50' : ''}`}>
            <a
              href={ready ? buildWhatsAppShareUrl(url!, shareTitle) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-100"
              onClick={(e) => {
                if (!ready) e.preventDefault();
              }}
            >
              <MessageCircle className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden />
              {copy.whatsapp}
            </a>

            <a
              href={ready ? buildMailtoShareUrl(url!, shareTitle, shareText) : undefined}
              className="inline-flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              onClick={(e) => {
                if (!ready) e.preventDefault();
              }}
            >
              <Mail className="h-5 w-5 text-blue-600 shrink-0" aria-hidden />
              {copy.email}
            </a>

            <button
              type="button"
              disabled={!ready}
              onClick={() => void doCopy()}
              className="inline-flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
              ) : (
                <Copy className="h-5 w-5 text-slate-700 shrink-0" aria-hidden />
              )}
              {copied ? copy.copied : copy.copyLink}
            </button>

            {showNative ? (
              <button
                type="button"
                disabled={!ready}
                onClick={() => void doNative()}
                className="inline-flex min-h-[48px] items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Share2 className="h-5 w-5 shrink-0" aria-hidden />
                {copy.moreOptions}
                {shouldPreferNativeShare() ? null : (
                  <span className="sr-only"> (apparaat)</span>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
