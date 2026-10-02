'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Copy, Download, QrCode, Share2 } from 'lucide-react';
import QRCodeSVG from 'react-qr-code';
import QRCode from 'qrcode';
import AffiliatePersonalShareSheet from '@/components/affiliate/AffiliatePersonalShareSheet';
import { useTranslation } from '@/hooks/useTranslation';
import { resolveAffiliatePersonalShareUrl } from '@/lib/affiliate/personal-share-url';

type Props = {
  referralLink?: string | null;
  referralCode?: string | null;
  /** Set by the dashboard after it has read ReferralLink. Missing means not yet known. */
  serverShareState?: 'present' | 'missing';
  loading?: boolean;
};

/**
 * Primary affiliate identity on the dashboard.
 * QR, copy and the share sheet all use one URL.
 * "Deel mijn affiliate-link" opens the sheet; it does not copy silently.
 */
export default function AffiliatePersonalShareCard({
  referralLink,
  referralCode,
  serverShareState,
  loading = false,
}: Props) {
  const { t, tOr } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filledUrl, setFilledUrl] = useState('');
  const latchedUrl = useRef('');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://homecheff.eu';
  const serverUrl = resolveAffiliatePersonalShareUrl({
    referralLink,
    referralCode,
    origin,
  });
  const liveUrl = serverUrl || filledUrl;
  if (liveUrl) latchedUrl.current = liveUrl;
  const shareUrl = liveUrl || latchedUrl.current;
  const [filling, setFilling] = useState(false);

  useEffect(() => {
    if (shareUrl || serverShareState === 'present' || serverShareState === 'missing') return;
    let cancelled = false;
    setFilling(true);
    (async () => {
      try {
        const response = await fetch('/api/affiliate/referral-link');
        if (!response.ok) return;
        const json = await response.json();
        if (cancelled) return;
        const next = resolveAffiliatePersonalShareUrl({
          referralLink: json.link,
          referralCode: json.code,
          origin: window.location.origin,
        });
        if (next) setFilledUrl(next);
      } catch {
        /* a failed request must not clear a code we already have */
      } finally {
        if (!cancelled) setFilling(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverShareState, shareUrl]);

  const title = tOr(
    'affiliate.dashboard.personalShareTitle',
    'Your affiliate link',
    'Jouw affiliatelink',
  );
  const hint = tOr(
    'affiliate.dashboard.personalShareHint',
    'Share HomeCheff and earn when your network uses the platform.',
    'Deel HomeCheff en verdien wanneer jouw netwerk gebruikmaakt van het platform.',
  );
  const openLabel = tOr('affiliate.dashboard.shareAction', 'Share', 'Delen');
  const openName = tOr(
    'affiliate.dashboard.personalShareCta',
    'Share my affiliate link',
    'Deel mijn affiliate-link',
  );
  const copyLabel = tOr(
    'affiliate.dashboard.copyLinkAction',
    'Copy link',
    'Link kopiëren',
  );
  const copiedLabel = tOr(
    'affiliate.dashboard.linkCopied',
    'Link copied',
    'Link gekopieerd',
  );
  const downloadLabel = t('affiliate.dashboard.downloadQR') || 'QR downloaden';

  const markCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      markCopied();
    } catch {
      setSheetOpen(true);
    }
  };

  const downloadQr = async () => {
    if (!shareUrl) return;
    setDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(shareUrl, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = 'homecheff-affiliate-qr.png';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      /* keep the on-screen QR available */
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section
      id="delen"
      aria-labelledby="affiliate-personal-share-title"
      data-affiliate-personal-share
      data-share-url={shareUrl || undefined}
      className="scroll-mt-[calc(11rem+env(safe-area-inset-top,0px))] max-w-full overflow-x-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <QrCode className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="affiliate-personal-share-title" className="text-lg font-bold text-gray-900 sm:text-xl">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">{hint}</p>
        </div>
      </div>

      {!shareUrl && serverShareState === 'missing' && !loading && !filling ? (
        <p className="mt-5 text-sm text-gray-600">
          {tOr(
            'affiliate.dashboard.personalShareUnavailable',
            'Your affiliate link is not available yet.',
            'Je affiliatelink is nog niet beschikbaar.',
          )}
        </p>
      ) : !shareUrl ? (
        <div className="mt-5 animate-pulse space-y-3" aria-busy="true">
          <div className="mx-auto h-[220px] w-[220px] max-w-full rounded-xl bg-emerald-100" />
          <div className="h-12 rounded-xl bg-emerald-100" />
        </div>
      ) : (
        <div className="mt-5 grid max-w-full grid-cols-1 gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <div
            className="mx-auto w-[min(240px,72vw)] max-w-full rounded-xl border-2 border-emerald-200 bg-white p-3 shadow-sm lg:mx-0"
            data-affiliate-qr
          >
            <QRCodeSVG
              value={shareUrl}
              size={240}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
              style={{ width: '100%', height: 'auto' }}
            />
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              data-affiliate-open-share
              data-affiliate-share-with-qr
              aria-label={openName}
              className="mt-3 inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {openLabel}
            </button>
          </div>

          <div className="min-w-0">
            <p
              className="break-all rounded-xl border border-emerald-200 bg-white px-3 py-3 font-mono text-sm text-emerald-950"
              data-affiliate-share-link
            >
              {shareUrl}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void copyLink()}
                data-affiliate-copy-link
                className="inline-flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span role="status">{copied ? copiedLabel : copyLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                data-affiliate-open-share
                data-affiliate-share-next-to-link
                aria-label={openName}
                className="inline-flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                {openLabel}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void downloadQr()}
              disabled={downloading}
              data-affiliate-download-qr
              className="mt-2 inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading ? t('affiliate.dashboard.downloading') || '…' : downloadLabel}
            </button>
          </div>
        </div>
      )}

      <AffiliatePersonalShareSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        referralLink={shareUrl || referralLink}
        referralCode={referralCode}
      />
    </section>
  );
}
