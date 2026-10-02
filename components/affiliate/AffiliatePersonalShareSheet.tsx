'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle,
  Copy,
  Download,
  Mail,
  Printer,
  Share2,
  X,
} from 'lucide-react';
import QRCodeSVG from 'react-qr-code';
import QRCode from 'qrcode';
import { useOverlayHistoryBack } from '@/hooks/useOverlayHistoryBack';
import { useTranslation } from '@/hooks/useTranslation';
import { useAffiliatePersonalShareSeed } from '@/components/affiliate/AffiliatePersonalShareProvider';
import { resolveAffiliatePersonalShareUrl } from '@/lib/affiliate/personal-share-url';
import { canUseWebShare, invokeNativeShareOnce } from '@/lib/share/listing-share';
import { buildSingleUrlWhatsAppHref } from '@/lib/share/exactly-once-share';
import {
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
} from '@/lib/share/social-destination-urls';

type Props = {
  open: boolean;
  onClose: () => void;
  referralLink?: string | null;
  referralCode?: string | null;
};

/**
 * Single personal-affiliate share surface.
 * QR, copy, native share and social destinations all use one URL.
 */
export default function AffiliatePersonalShareSheet({
  open,
  onClose,
  referralLink,
  referralCode,
}: Props) {
  const seed = useAffiliatePersonalShareSeed();
  const knownLink = referralLink || seed.referralLink;
  const knownCode = referralCode || seed.referralCode;
  const { t, tOr, language } = useTranslation();
  const titleId = useId();
  const [fetchedUrl, setFetchedUrl] = useState('');
  const latchedUrl = useRef('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [nativeReady, setNativeReady] = useState(false);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://homecheff.eu';
  const liveUrl =
    resolveAffiliatePersonalShareUrl({
      referralLink: knownLink,
      referralCode: knownCode,
      origin,
    }) || fetchedUrl;
  if (liveUrl) latchedUrl.current = liveUrl;
  const shareUrl = liveUrl || latchedUrl.current;

  const title = tOr(
    'affiliate.dashboard.personalShareCta',
    'Share my affiliate link',
    'Deel mijn affiliate-link',
  );
  const scanHint = tOr(
    'affiliate.dashboard.personalShareScan',
    'Scan to view HomeCheff through me',
    'Scan om HomeCheff via mij te bekijken',
  );
  const shareText = tOr(
    'affiliate.dashboard.personalShareText',
    'Join HomeCheff',
    'Doe mee met HomeCheff',
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
  const shareLabel = tOr('affiliate.dashboard.shareAction', 'Share', 'Delen');
  const downloadLabel = t('affiliate.dashboard.downloadQR') || 'QR downloaden';
  const closeLabel = tOr('common.close', 'Close', 'Sluiten');

  useOverlayHistoryBack(`affiliate-personal-share:${titleId}`, open, onClose);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/affiliate/referral-link');
      if (!res.ok) return;
      const json = await res.json();
      const origin = window.location.origin;
      const next = resolveAffiliatePersonalShareUrl({
        referralLink: json.link,
        referralCode: json.code,
        origin,
      });
      if (next) setFetchedUrl(next);
    } catch {
      /* a failed request must not clear a code we already have */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setNativeReady(canUseWebShare());
    const provided = resolveAffiliatePersonalShareUrl({
      referralLink: knownLink,
      referralCode: knownCode,
      origin: window.location.origin,
    });
    if (!provided) void load();
  }, [open, load, knownCode, knownLink]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

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
      /* the link stays visible so the user can select it */
    }
  };

  const nativeShare = async () => {
    if (!shareUrl || !canUseWebShare()) return;
    const result = await invokeNativeShareOnce({
      url: shareUrl,
      title: 'HomeCheff',
      text: shareText,
    });
    if (result.ok) onClose();
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
      anchor.download = `homecheff-affiliate-qr-${language}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      /* on-screen QR remains available */
    } finally {
      setDownloading(false);
    }
  };

  const printQr = () => {
    if (!shareUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${t('roleQuickLinks.printQr')}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;padding:24px;">
        <div id="qr"></div>
        <p style="margin-top:16px;font-size:12px;word-break:break-all;max-width:320px;text-align:center;">${shareUrl}</p>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
        <script>
          QRCode.toCanvas(document.getElementById('qr'), ${JSON.stringify(shareUrl)}, { width: 280 }, function() { window.print(); });
        <\/script>
      </body></html>
    `);
    win.document.close();
  };

  if (!open || typeof document === 'undefined') return null;

  const ready = Boolean(shareUrl) && !loading;
  const waHref = ready ? buildSingleUrlWhatsAppHref(shareUrl, 'HomeCheff', shareText) : undefined;
  const fbHref = ready ? buildFacebookShareUrl(shareUrl) : undefined;
  const liHref = ready ? buildLinkedInShareUrl(shareUrl) : undefined;
  const xHref = ready
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    : undefined;
  const mailHref = ready
    ? `mailto:?subject=${encodeURIComponent('HomeCheff')}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
    : undefined;

  const channelClass =
    'inline-flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50';

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-affiliate-share-sheet
        data-share-url={shareUrl || undefined}
        className="relative z-10 max-h-[min(92dvh,760px)] w-full max-w-md overflow-x-hidden overflow-y-auto rounded-t-2xl border border-slate-200 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
          <h2 id={titleId} className="text-base font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {loading && !shareUrl ? (
            <div className="animate-pulse space-y-3 py-4" aria-busy="true">
              <div className="mx-auto h-[220px] w-[220px] max-w-full rounded-xl bg-emerald-100" />
              <div className="h-12 rounded-xl bg-emerald-100" />
            </div>
          ) : !shareUrl ? (
            <p className="py-6 text-center text-sm text-slate-600">
              {tOr(
                'affiliate.dashboard.personalShareUnavailable',
                'Your affiliate link is not available yet.',
                'Je affiliatelink is nog niet beschikbaar.',
              )}
            </p>
          ) : (
            <>
              <div
                className="mx-auto w-[min(240px,78vw)] max-w-full rounded-xl border-2 border-emerald-200 bg-white p-3"
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
              </div>
              <p className="text-center text-sm text-slate-700">{scanHint}</p>
              <p
                className="break-all rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 font-mono text-sm text-emerald-950"
                data-affiliate-share-link
              >
                {shareUrl}
              </p>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  data-affiliate-copy-link
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span role="status">{copied ? copiedLabel : copyLabel}</span>
                </button>
                {nativeReady ? (
                  <button
                    type="button"
                    onClick={() => void nativeShare()}
                    data-affiliate-native-share
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
                  >
                    <Share2 className="h-4 w-4" aria-hidden />
                    {shareLabel}
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-affiliate-share-whatsapp
                  className={`${channelClass} border-emerald-100 bg-emerald-50 text-emerald-950 sm:col-span-2`}
                >
                  WhatsApp
                </a>
                <a
                  href={fbHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-affiliate-share-facebook
                  className={channelClass}
                >
                  Facebook
                </a>
                <a
                  href={liHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-affiliate-share-linkedin
                  className={channelClass}
                >
                  LinkedIn
                </a>
                <a
                  href={xHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-affiliate-share-x
                  className={channelClass}
                >
                  X
                </a>
                <a href={mailHref} data-affiliate-share-email className={channelClass}>
                  <Mail className="h-4 w-4 text-blue-600" aria-hidden />
                  {tOr('share.email', 'Email', 'E-mail')}
                </a>
                <button
                  type="button"
                  onClick={() => void downloadQr()}
                  disabled={downloading}
                  data-affiliate-download-qr
                  className={`${channelClass} disabled:opacity-50`}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {downloading ? t('affiliate.dashboard.downloading') || '…' : downloadLabel}
                </button>
                <button type="button" onClick={printQr} className={channelClass}>
                  <Printer className="h-4 w-4" aria-hidden />
                  {t('roleQuickLinks.printQr')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
