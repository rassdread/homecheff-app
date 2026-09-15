'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Copy,
  ImagePlus,
  Linkedin,
  Mail,
  MessageCircle,
  Share2,
  X,
} from 'lucide-react';
import { useOverlayHistoryBack } from '@/hooks/useOverlayHistoryBack';
import {
  canUseWebShare,
  shareListingOrCopy,
  shouldPreferNativeShare,
} from '@/lib/share/listing-share';
import {
  formatShareForChannel,
  type HomecheffSharePayload,
} from '@/lib/share/homecheff-share-payload';
import {
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  buildMailtoShareUrlFromPayload,
  buildWhatsAppShareUrlFromPayload,
  buildXShareUrlFromPayload,
} from '@/lib/share/social-destination-urls';

export type VisibleShareCopy = {
  title: string;
  preparing: string;
  error: string;
  whatsapp: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  x: string;
  email: string;
  copyLink: string;
  copied: string;
  moreOptions: string;
  close: string;
  instagramHint: string;
  tiktokHint: string;
  textCopiedHint: string;
  openImage: string;
  back: string;
  itemPreview: string;
  addMessage: string;
  addPhoto: string;
  removePhoto: string;
  replacePhoto: string;
  filesUnsupported: string;
};

const DEFAULT_COPY_NL: VisibleShareCopy = {
  title: 'Delen',
  preparing: 'Deellink voorbereiden…',
  error: 'Delen lukt nu niet automatisch. Kopieer de link en probeer het opnieuw.',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
  email: 'E-mail',
  copyLink: 'Link kopiëren',
  copied: 'Link gekopieerd',
  moreOptions: 'Meer opties',
  close: 'Sluiten',
  instagramHint:
    'Tekst is gekopieerd. Deel de afbeelding via Instagram en plak de tekst bij je bericht.',
  tiktokHint:
    'Tekst is gekopieerd. Open TikTok, plak de tekst bij je bericht en voeg desgewenst de afbeelding toe.',
  textCopiedHint: 'Tekst gekopieerd',
  openImage: 'Open deelafbeelding',
  back: 'Terug',
  itemPreview: 'Dit item',
  addMessage: 'Bericht toevoegen',
  addPhoto: 'Foto toevoegen',
  removePhoto: 'Foto verwijderen',
  replacePhoto: 'Andere foto',
  filesUnsupported:
    'Dit platform ondersteunt het rechtstreeks meesturen van een foto vanuit de browser niet. De link is gekopieerd zodat je hem in de app kunt delen.',
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Final absolute URL (already attributed). Used when payload is absent. */
  url: string | null;
  shareTitle: string;
  shareText?: string;
  /** Preferred: full semantic payload */
  payload?: HomecheffSharePayload | null;
  preparing?: boolean;
  copy?: Partial<VisibleShareCopy>;
  onCopied?: () => void;
  onNativeShare?: () => void;
  onDestination?: (destination: string) => void;
  /** Listing cover — preview only, never uploaded as a new listing attachment. */
  itemImageUrl?: string | null;
  allowUserMedia?: boolean;
};

function DestButton({
  ready,
  onClick,
  href,
  label,
  className,
  children,
}: {
  ready: boolean;
  onClick?: () => void;
  href?: string;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  const base =
    'inline-flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';
  if (href) {
    return (
      <a
        href={ready ? href : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={`${base} ${className} ${!ready ? 'pointer-events-none opacity-50' : ''}`}
        onClick={(e) => {
          if (!ready) e.preventDefault();
          else onClick?.();
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      disabled={!ready}
      aria-label={label}
      onClick={onClick}
      className={`${base} ${className} disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

/**
 * Single visible HomeCheff share presentation layer — social destinations + fallbacks.
 */
export default function HomecheffVisibleShareSheet({
  open,
  onClose,
  url,
  shareTitle,
  shareText,
  payload,
  preparing = false,
  copy: copyOverrides,
  onCopied,
  onNativeShare,
  onDestination,
  itemImageUrl = null,
  allowUserMedia = true,
}: Props) {
  const copy: VisibleShareCopy = { ...DEFAULT_COPY_NL, ...copyOverrides };
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [userFile, setUserFile] = useState<File | null>(null);
  const [userPreview, setUserPreview] = useState<string | null>(null);

  useOverlayHistoryBack(`visible-share-sheet:${titleId}`, open, onClose);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setHint(null);
    setError(null);
    setNote('');
    setUserFile(null);
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!userFile) {
      setUserPreview(null);
      return;
    }
    const url = URL.createObjectURL(userFile);
    setUserPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [userFile]);

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

  const effectiveUrl = payload?.url || url;
  const ready = Boolean(effectiveUrl) && !preparing;

  const composedText = [note.trim(), shareText || shareTitle].filter(Boolean).join('\n\n');

  const copyUrlWithOptionalFallback = useCallback(
    async (reason?: 'files_unsupported') => {
      if (!effectiveUrl) return;
      try {
        await navigator.clipboard.writeText(effectiveUrl);
        setCopied(true);
        setError(null);
        setHint(reason === 'files_unsupported' ? copy.filesUnsupported : null);
        onCopied?.();
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setError(copy.error);
      }
    },
    [copy.error, copy.filesUnsupported, effectiveUrl, onCopied],
  );

  const doCopyUrl = useCallback(async () => {
    if (!effectiveUrl) return;
    try {
      await navigator.clipboard.writeText(effectiveUrl);
      setCopied(true);
      setError(null);
      onCopied?.();
      onDestination?.('copy');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(copy.error);
    }
  }, [copy.error, effectiveUrl, onCopied, onDestination]);

  const copyCaptionAndMaybeNative = useCallback(
    async (channel: 'instagram' | 'tiktok') => {
      if (!effectiveUrl) return;
      const text = payload
        ? formatShareForChannel(payload, channel).text
        : `${shareText || shareTitle}\n\n${effectiveUrl}`;
      try {
        await navigator.clipboard.writeText(text);
        setHint(channel === 'instagram' ? copy.instagramHint : copy.tiktokHint);
        onDestination?.(channel);
      } catch {
        setError(copy.error);
        return;
      }

      if (canUseWebShare()) {
        try {
          const shareData: ShareData = {
            title: payload?.title || shareTitle,
            text,
            url: effectiveUrl,
          };
          // Prefer handing off to installed apps when the OS supports it.
          if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
            /* caption already copied */
          } else {
            await navigator.share(shareData);
            onNativeShare?.();
          }
        } catch (err) {
          const name =
            err && typeof err === 'object' && 'name' in err
              ? String((err as { name: string }).name)
              : '';
          if (name !== 'AbortError') {
            /* caption copy already succeeded — keep hint */
          }
        }
      }
    },
    [
      copy.error,
      copy.instagramHint,
      copy.tiktokHint,
      effectiveUrl,
      onDestination,
      onNativeShare,
      payload,
      shareText,
      shareTitle,
    ],
  );

  const doNative = useCallback(async () => {
    if (!effectiveUrl || !canUseWebShare()) return;
    const formatted = payload
      ? formatShareForChannel(payload, 'native')
      : { title: shareTitle, text: composedText || shareTitle, url: effectiveUrl };
    const files = userFile ? [userFile] : [];
    const result = await shareListingOrCopy(
      {
        url: formatted.url || effectiveUrl,
        title: formatted.title,
        text: formatted.text,
        files,
      },
      { allowSilentClipboard: false },
    );
    if (result.ok) {
      onNativeShare?.();
      onDestination?.('native');
      onClose();
      return;
    }
    if (result.method === 'cancelled') return;
    if (result.error === 'files_unsupported' || files.length > 0) {
      await copyUrlWithOptionalFallback('files_unsupported');
      return;
    }
    setError(copy.error);
  }, [
    composedText,
    copy.error,
    copyUrlWithOptionalFallback,
    effectiveUrl,
    onClose,
    onDestination,
    onNativeShare,
    payload,
    shareTitle,
    userFile,
  ]);

  if (!open || typeof document === 'undefined') return null;

  const showNative = canUseWebShare();
  const waHref = ready
    ? payload
      ? buildWhatsAppShareUrlFromPayload(payload)
      : `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${effectiveUrl}`)}`
    : undefined;
  const liHref = ready ? buildLinkedInShareUrl(effectiveUrl!) : undefined;
  const fbHref = ready ? buildFacebookShareUrl(effectiveUrl!) : undefined;
  const xHref = ready
    ? payload
      ? buildXShareUrlFromPayload(payload)
      : `https://twitter.com/intent/tweet?url=${encodeURIComponent(effectiveUrl!)}&text=${encodeURIComponent(shareTitle)}`
    : undefined;
  const mailHref = ready
    ? payload
      ? buildMailtoShareUrlFromPayload(payload)
      : `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText || shareTitle}\n\n${effectiveUrl}`)}`
    : undefined;
  const imageUrl = payload?.image || itemImageUrl || undefined;

  const onHrefShare = (destination: string) => {
    if (userFile) void copyUrlWithOptionalFallback('files_unsupported');
    onDestination?.(destination);
  };

  const rowClass =
    'border-slate-200 bg-white text-slate-900 hover:bg-slate-50';

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
        className="relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[min(92vh,720px)] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 z-10">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← {copy.back}
            </button>
            <h2 id={titleId} className="truncate text-base font-semibold text-slate-900">
              {copy.title}
            </h2>
          </div>
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
          {preparing || !effectiveUrl ? (
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

          {hint ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950" role="status">
              {hint}
              {imageUrl ? (
                <>
                  {' '}
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    {copy.openImage}
                  </a>
                </>
              ) : null}
            </p>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3">
            {itemImageUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={itemImageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover bg-white"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {copy.itemPreview}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900">{shareTitle}</p>
                </div>
              </div>
            ) : (
              <p className="truncate text-sm font-semibold text-slate-900">{shareTitle}</p>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">{copy.addMessage}</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            {allowUserMedia ? (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setUserFile(file);
                    e.target.value = '';
                  }}
                />
                {userPreview ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={userPreview} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {copy.replacePhoto}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                        onClick={() => setUserFile(null)}
                      >
                        {copy.removePhoto}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden />
                    {copy.addPhoto}
                  </button>
                )}
              </div>
            ) : null}
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${!ready ? 'pointer-events-none opacity-50' : ''}`}
          >
            <DestButton
              ready={ready}
              href={waHref}
              label={copy.whatsapp}
              className="border-emerald-100 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 sm:col-span-2"
              onClick={() => onHrefShare('whatsapp')}
            >
              <MessageCircle className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden />
              {copy.whatsapp}
            </DestButton>

            <DestButton
              ready={ready}
              href={liHref}
              label={copy.linkedin}
              className={rowClass}
              onClick={() => {
                if (payload) {
                  void navigator.clipboard
                    .writeText(formatShareForChannel(payload, 'linkedin').text)
                    .catch(() => {});
                }
                onHrefShare('linkedin');
              }}
            >
              <Linkedin className="h-5 w-5 text-[#0A66C2] shrink-0" aria-hidden />
              {copy.linkedin}
            </DestButton>

            <DestButton
              ready={ready}
              href={fbHref}
              label={copy.facebook}
              className={rowClass}
              onClick={() => onHrefShare('facebook')}
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-[#1877F2] text-[11px] font-bold text-white shrink-0"
                aria-hidden
              >
                f
              </span>
              {copy.facebook}
            </DestButton>

            <DestButton
              ready={ready}
              label={copy.instagram}
              className={rowClass}
              onClick={() => void copyCaptionAndMaybeNative('instagram')}
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600 text-[10px] font-bold text-white shrink-0"
                aria-hidden
              >
                Ig
              </span>
              {copy.instagram}
            </DestButton>

            <DestButton
              ready={ready}
              label={copy.tiktok}
              className={rowClass}
              onClick={() => void copyCaptionAndMaybeNative('tiktok')}
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-black text-[10px] font-bold text-white shrink-0"
                aria-hidden
              >
                Tk
              </span>
              {copy.tiktok}
            </DestButton>

            <DestButton
              ready={ready}
              href={xHref}
              label={copy.x}
              className={rowClass}
              onClick={() => onHrefShare('x')}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center text-base font-bold text-slate-900 shrink-0" aria-hidden>
                𝕏
              </span>
              {copy.x}
            </DestButton>

            <DestButton
              ready={ready}
              href={mailHref}
              label={copy.email}
              className={rowClass}
              onClick={() => onHrefShare('email')}
            >
              <Mail className="h-5 w-5 text-blue-600 shrink-0" aria-hidden />
              {copy.email}
            </DestButton>

            <DestButton
              ready={ready}
              label={copied ? copy.copied : copy.copyLink}
              className={`${rowClass} sm:col-span-2`}
              onClick={() => void doCopyUrl()}
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
              ) : (
                <Copy className="h-5 w-5 text-slate-700 shrink-0" aria-hidden />
              )}
              {copied ? copy.copied : copy.copyLink}
            </DestButton>

            {showNative ? (
              <DestButton
                ready={ready}
                label={copy.moreOptions}
                className="sm:col-span-2 border-transparent bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => void doNative()}
              >
                <Share2 className="h-5 w-5 shrink-0" aria-hidden />
                {copy.moreOptions}
                {shouldPreferNativeShare() ? null : (
                  <span className="sr-only"> (apparaat)</span>
                )}
              </DestButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
