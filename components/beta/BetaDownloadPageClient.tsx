'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import {
  applyReferralFromQuery,
  setAndroidBetaSourceCookie,
  setBetaIntentFlag,
  syncHomecheffRefFromHcRefCookie,
  HOMECHEFF_REF_KEY,
} from '@/lib/beta-download-client';
import { getGooglePlayOpenTestingUrl, isPlayOpenTestingUrlConfigured } from '@/lib/app-distribution';
import { openExternalUrl } from '@/lib/native/openExternalUrl';

type Props = {
  playStoreUrl: string | null;
  versionLabel: string | null;
  initialRefLabel: string | null;
  initialCodeParam: string | null;
};

export default function BetaDownloadPageClient({
  playStoreUrl,
  versionLabel,
  initialRefLabel,
  initialCodeParam,
}: Props) {
  const { t } = useTranslation();
  const [refDisplay, setRefDisplay] = useState<string | null>(initialRefLabel);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const resolvedPlayUrl = (playStoreUrl ?? getGooglePlayOpenTestingUrl()).trim();
  const hasPlayUrl = isPlayOpenTestingUrlConfigured(resolvedPlayUrl);

  useEffect(() => {
    setAndroidBetaSourceCookie();
    setBetaIntentFlag();
    syncHomecheffRefFromHcRefCookie();
    if (initialCodeParam) {
      applyReferralFromQuery(initialCodeParam);
      setRefDisplay(initialCodeParam);
    }
    try {
      const ls = localStorage.getItem(HOMECHEFF_REF_KEY)?.trim();
      if (ls) setRefDisplay(ls);
    } catch {
      /* ignore */
    }
  }, [initialCodeParam]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/affiliate/referral-link', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
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
  }, []);

  const shareUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://homecheff.eu';
    if (shareCode) return `${origin}/app?ref=${encodeURIComponent(shareCode)}`;
    return `${origin}/app`;
  }, [shareCode]);

  async function trackPlayCtaClick() {
    try {
      await fetch('/api/beta/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refCode: refDisplay, channel: 'play_open_testing' }),
      });
    } catch {
      /* ignore */
    }
  }

  async function onOpenPlay() {
    if (!hasPlayUrl) return;
    void trackPlayCtaClick();
    await openExternalUrl(resolvedPlayUrl);
  }

  async function onShareBeta() {
    setShareBusy(true);
    setShareHint(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('appPlayLanding.shareTitle'),
          text: t('appPlayLanding.shareText'),
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareHint(t('appPlayLanding.shareCopied'));
      } else {
        setShareHint(shareUrl);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareHint(t('appPlayLanding.shareCopied'));
      } catch {
        setShareHint(t('appPlayLanding.shareManual', { url: shareUrl }));
      }
    } finally {
      setShareBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/80 to-gray-50 pb-16 pt-8 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {t('appPlayLanding.eyebrow')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('appPlayLanding.title')}</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{t('appPlayLanding.intro')}</p>
          {refDisplay ? (
            <p className="text-sm text-emerald-800 bg-emerald-100/70 rounded-lg px-3 py-2 inline-block">
              {t('appPlayLanding.refLinked', { ref: refDisplay })}
            </p>
          ) : null}
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('appPlayLanding.playSectionTitle')}</h2>
          {hasPlayUrl ? (
            <button
              type="button"
              onClick={() => void onOpenPlay()}
              className="flex w-full justify-center items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 transition-colors shadow-sm touch-manipulation"
            >
              {t('appPlayLanding.ctaOpenPlay')}
            </button>
          ) : (
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
              {t('playMigration.playUrlMissing')}
            </p>
          )}
          {versionLabel ? (
            <p className="text-xs text-gray-500">
              {t('appPlayLanding.versionLabel')}{' '}
              <span className="font-mono text-gray-700">{versionLabel}</span>
            </p>
          ) : null}
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-950">
            {t('appPlayLanding.playTrustNote')}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">{t('appPlayLanding.stepsTitle')}</h2>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
            <li>{t('appPlayLanding.step1')}</li>
            <li>{t('appPlayLanding.step2')}</li>
            <li>{t('appPlayLanding.step3')}</li>
            <li>{t('appPlayLanding.step4')}</li>
          </ol>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('appPlayLanding.accountTitle')}</h2>
          <p className="text-sm text-gray-600">{t('appPlayLanding.accountBody')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              prefetch={false}
              className="flex-1 min-h-[48px] touch-pan-y text-center rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 transition-colors select-none"
            >
              {t('appPlayLanding.createAccount')}
            </Link>
            <Link
              href="/login"
              prefetch={false}
              className="flex-1 min-h-[48px] touch-pan-y text-center rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 transition-colors select-none"
            >
              {t('appPlayLanding.login')}
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">{t('appPlayLanding.shareTitle')}</h2>
          <p className="text-sm text-gray-600">{t('appPlayLanding.shareBody')}</p>
          <button
            type="button"
            disabled={shareBusy}
            onClick={() => void onShareBeta()}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium py-3 px-4 transition-colors disabled:opacity-60 touch-manipulation"
          >
            {shareBusy ? t('common.sending') : t('appPlayLanding.shareCta')}
          </button>
          {shareHint ? <p className="text-xs text-gray-600 break-all">{shareHint}</p> : null}
          {!shareCode ? (
            <p className="text-xs text-gray-500">{t('appPlayLanding.shareFallback', { url: shareUrl })}</p>
          ) : null}
        </section>

        <section className="text-center text-xs text-gray-500 pb-8 space-y-2">
          <p>{t('appPlayLanding.attributionNote')}</p>
          <p>
            <Link
              href="/settings/app"
              prefetch={false}
              className="inline-flex min-h-[44px] touch-pan-y items-center text-emerald-700 hover:underline font-medium select-none"
            >
              {t('appPlayLanding.settingsLink')}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
