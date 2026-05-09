'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  applyReferralFromQuery,
  setAndroidBetaSourceCookie,
  setBetaIntentFlag,
  syncHomecheffRefFromHcRefCookie,
  HOMECHEFF_REF_KEY,
} from '@/lib/beta-download-client';

type Props = {
  apkUrl: string | null;
  versionLabel: string | null;
  initialRefLabel: string | null;
  initialCodeParam: string | null;
};

export default function BetaDownloadPageClient({
  apkUrl,
  versionLabel,
  initialRefLabel,
  initialCodeParam,
}: Props) {
  const [refDisplay, setRefDisplay] = useState<string | null>(initialRefLabel);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

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

  async function trackDownloadClick() {
    try {
      await fetch('/api/beta/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refCode: refDisplay }),
      });
    } catch {
      /* ignore */
    }
  }

  async function onShareBeta() {
    setShareBusy(true);
    setShareHint(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'HomeCheff beta',
          text: 'Probeer de HomeCheff Android-beta.',
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareHint('Link gekopieerd naar klembord.');
      } else {
        setShareHint(shareUrl);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareHint('Link gekopieerd naar klembord.');
      } catch {
        setShareHint('Kon link niet delen. Kopieer handmatig: ' + shareUrl);
      }
    } finally {
      setShareBusy(false);
    }
  }

  const hasApk = Boolean(apkUrl && apkUrl.startsWith('http'));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/80 to-gray-50 pb-16 pt-8 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Android · Beta</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Download de HomeCheff Beta-app</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Dit is de <strong>Android beta- en testversie</strong> van HomeCheff. Functies kunnen veranderen;
            je helpt ons door feedback te geven.
          </p>
          {refDisplay ? (
            <p className="text-sm text-emerald-800 bg-emerald-100/70 rounded-lg px-3 py-2 inline-block">
              Je download is gekoppeld aan uitnodiging van <span className="font-medium">{refDisplay}</span>.
            </p>
          ) : null}
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">APK downloaden</h2>
          {hasApk ? (
            <a
              href={apkUrl!}
              download
              rel="noopener noreferrer"
              onClick={() => void trackDownloadClick()}
              className="flex w-full justify-center items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 transition-colors shadow-sm"
            >
              Download Android beta
            </a>
          ) : (
            <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
              Beta download tijdelijk niet beschikbaar.
            </p>
          )}
          {versionLabel ? (
            <p className="text-xs text-gray-500">
              Versie / changelog: <span className="font-mono text-gray-700">{versionLabel}</span>
            </p>
          ) : null}
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-900">
            <strong>Veiligheid:</strong> download de APK alleen vanaf{' '}
            <span className="font-medium">homecheff.eu</span>. Gebruik geen onbekende mirrors.
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Installeren op Android</h2>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
            <li>Open dit bestand na download (vaak in je meldingen of map Downloads).</li>
            <li>
              Sta <strong>installatie uit onbekende bron</strong> toe voor je browser of bestands-app als daar
              om gevraagd wordt.
            </li>
            <li>Volg de schermen om de installatie te voltooien.</li>
            <li>Log in op je bestaande HomeCheff-account of maak een nieuw account aan.</li>
          </ol>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Account</h2>
          <p className="text-sm text-gray-600">
            Voor de beta heb je een HomeCheff-account nodig voor berichten, HCP en je profiel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="flex-1 text-center rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 transition-colors"
            >
              Account aanmaken
            </Link>
            <Link
              href="/login"
              className="flex-1 text-center rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 transition-colors"
            >
              Inloggen
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Deel HomeCheff beta</h2>
          <p className="text-sm text-gray-600">
            Deel de beta met jouw referralcode — zo groeit het netwerk eerlijk en meetbaar.
          </p>
          <button
            type="button"
            disabled={shareBusy}
            onClick={() => void onShareBeta()}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium py-3 px-4 transition-colors disabled:opacity-60"
          >
            {shareBusy ? 'Bezig…' : 'Deel HomeCheff beta'}
          </button>
          {shareHint ? <p className="text-xs text-gray-600 break-all">{shareHint}</p> : null}
          {!shareCode ? (
            <p className="text-xs text-gray-500">
              Geen affiliate-code op dit account? Dan delen we de algemene beta-link ({shareUrl}).
            </p>
          ) : null}
        </section>

        <section className="text-center text-xs text-gray-500 pb-8 space-y-2">
          <p>
            Direct APK-installatie gebruikt geen Play Store install referrer — attributie loopt via deze pagina,
            cookies en je referralcode.
          </p>
          <p>
            <Link href="/settings/app" className="text-emerald-700 hover:underline font-medium">
              App-instellingen
            </Link>{' '}
            (meldingen, locatie, HCP-meldingen, beta-functies).
          </p>
        </section>
      </div>
    </div>
  );
}
