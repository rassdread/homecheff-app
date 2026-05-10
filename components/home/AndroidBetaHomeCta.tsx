'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Smartphone, X, Share2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

const HK = 'home.androidBeta';

export default function AndroidBetaHomeCta({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [apkOk, setApkOk] = useState<boolean | null>(null);

  const envApk = process.env.NEXT_PUBLIC_ANDROID_BETA_APK_URL?.trim() ?? '';

  useEffect(() => {
    if (envApk && /^https?:\/\//i.test(envApk)) {
      setApkOk(true);
      return;
    }
    let cancelled = false;
    fetch('/downloads/homecheff-beta.apk', { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        if (cancelled) return;
        // Alleen waarschuwen bij duidelijke 404; andere codes (405, 403) niet als "weg" zien.
        if (r.status === 404) setApkOk(false);
        else setApkOk(true);
      })
      .catch(() => {
        if (!cancelled) setApkOk(null);
      });
    return () => {
      cancelled = true;
    };
  }, [envApk]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      setShareCode(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/affiliate/referral-link', { credentials: 'include' });
        const data = (await res.json().catch(() => ({}))) as { code?: string | null };
        if (!cancelled && typeof data.code === 'string' && data.code.trim()) {
          setShareCode(data.code.trim());
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://homecheff.eu/app';
    const origin = window.location.origin || 'https://homecheff.eu';
    if (shareCode) return `${origin}/app?ref=${encodeURIComponent(shareCode)}`;
    return `${origin}/app`;
  }, [shareCode]);

  const onShareInvite = useCallback(async () => {
    setShareBusy(true);
    setShareHint(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title: t(`${HK}.shareNativeTitle`),
          text: t(`${HK}.shareNativeText`),
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareHint(t(`${HK}.shareHintCopied`));
      } else {
        setShareHint(shareUrl);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareHint(t(`${HK}.shareHintCopied`));
      } catch {
        setShareHint(t(`${HK}.shareHintManual`));
      }
    } finally {
      setShareBusy(false);
    }
  }, [shareUrl, t]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    queueMicrotask(() => closeRef.current?.focus());
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  useEffect(() => {
    if (sheetOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sheetOpen]);

  const loggedIn = status === 'authenticated' && Boolean(session?.user);
  const showApkWarning = apkOk === false;

  const shareBusyLabel = t(`${HK}.shareBusy`);

  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/80 p-4 shadow-[0_12px_40px_-18px_rgba(16,185,129,0.35)] sm:p-5',
          className
        )}
        aria-labelledby="home-android-beta-title"
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-300/60 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
                Android · Beta
              </span>
            </div>
            <h2
              id="home-android-beta-title"
              className="text-lg font-bold leading-tight text-gray-900 sm:text-xl"
            >
              {t(`${HK}.title`)}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">{t(`${HK}.subtitle`)}</p>
            <p className="text-xs text-gray-500">{t(`${HK}.note`)}</p>
            {showApkWarning ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                {t(`${HK}.apkUnavailable`)}
              </p>
            ) : null}
          </div>
          <div
            className="flex shrink-0 justify-center text-emerald-700/90 sm:pt-1"
            aria-hidden
          >
            <div className="rounded-2xl border border-emerald-200/80 bg-white/90 p-3 shadow-sm">
              <Smartphone className="h-10 w-10 sm:h-11 sm:w-11" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="relative mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/app"
            className={cn(
              'inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[200px] touch-manipulation'
            )}
          >
            {t(`${HK}.ctaDownload`)}
          </Link>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-gray-300 bg-white/90 px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[160px] touch-manipulation"
          >
            {t(`${HK}.ctaMoreInfo`)}
          </button>
        </div>

        {loggedIn ? (
          <div className="relative mt-4 rounded-xl border border-emerald-100/90 bg-white/60 p-3 sm:p-4">
            <p className="text-sm font-semibold text-gray-900">{t(`${HK}.shareTitle`)}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{t(`${HK}.shareBody`)}</p>
            <button
              type="button"
              onClick={() => void onShareInvite()}
              disabled={shareBusy}
              className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-60 sm:w-auto touch-manipulation"
            >
              <Share2 className="h-4 w-4 shrink-0" aria-hidden />
              {shareBusy ? shareBusyLabel : t(`${HK}.shareCta`)}
            </button>
            {shareHint ? (
              <p className="mt-2 break-all text-xs text-gray-600">{shareHint}</p>
            ) : null}
          </div>
        ) : null}

        <p className="relative mt-3 text-[11px] leading-snug text-gray-500">{t(`${HK}.trustOnlyDomain`)}</p>
      </section>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/45"
            aria-label={t(`${HK}.sheetCloseAria`)}
            onClick={() => setSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(90vh,620px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-gray-100 bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-2 border-b border-gray-100 bg-gradient-to-b from-emerald-50/90 to-white px-4 pb-3 pt-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-700">
                  <Smartphone className="h-6 w-6" aria-hidden />
                </span>
                <h3 id={titleId} className="text-base font-bold text-gray-900">
                  {t(`${HK}.sheetTitle`)}
                </h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                aria-label={t(`${HK}.sheetCloseAria`)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 text-sm text-gray-800 sm:px-5 sm:py-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+5.5rem))]">
              <ol className="list-decimal space-y-3 pl-4 marker:font-semibold">
                <li>{t(`${HK}.sheetStep1`)}</li>
                <li>{t(`${HK}.sheetStep2`)}</li>
                <li>{t(`${HK}.sheetStep3`)}</li>
              </ol>
              <p className="mt-4 text-sm leading-relaxed text-gray-700">{t(`${HK}.sheetBetaNote`)}</p>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{t(`${HK}.sheetPermissionsNote`)}</p>
              <p className="mt-4 rounded-lg border border-gray-100 bg-gray-50/90 px-3 py-2 text-xs leading-relaxed text-gray-700">
                {t(`${HK}.sheetTrust`)}
              </p>
              <p className="mt-2 text-xs font-medium text-emerald-900">{t(`${HK}.trustOnlyDomain`)}</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 touch-manipulation"
                >
                  {t(`${HK}.sheetClose`)}
                </button>
                <Link
                  href="/app"
                  onClick={() => setSheetOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 touch-manipulation"
                >
                  {t(`${HK}.continueDownload`)}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
