'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Copy, CheckCircle, Download, Printer, QrCode } from 'lucide-react';
import QRCodeSVG from 'react-qr-code';
import QRCode from 'qrcode';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AffiliateQuickShareModal({ open, onClose }: Props) {
  const { t, language } = useTranslation();
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/affiliate/dashboard');
      if (!res.ok) {
        setError(true);
        return;
      }
      const json = await res.json();
      setReferralLink(json.referralLink ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const downloadQr = async () => {
    if (!referralLink) return;
    setDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(referralLink, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `homecheff-partner-qr-${language}.png`;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  };

  const printQr = () => {
    if (!referralLink) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${t('roleQuickLinks.printQr')}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;padding:24px;">
        <div id="qr"></div>
        <p style="margin-top:16px;font-size:12px;word-break:break-all;max-width:320px;text-align:center;">${referralLink}</p>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
        <script>
          QRCode.toCanvas(document.getElementById('qr'), ${JSON.stringify(referralLink)}, { width: 280 }, function() { window.print(); });
        <\/script>
      </body></html>
    `);
    win.document.close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="affiliate-quick-share-title"
        className={cn(
          'absolute left-1/2 top-1/2 w-[min(100%-2rem,400px)] -translate-x-1/2 -translate-y-1/2',
          'rounded-2xl border border-gray-200 bg-white shadow-2xl',
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 id="affiliate-quick-share-title" className="text-base font-bold text-gray-900">
            {t('roleQuickLinks.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="animate-pulse space-y-3 py-6">
              <div className="mx-auto h-40 w-40 rounded-lg bg-gray-100" />
              <div className="h-4 rounded bg-gray-100" />
            </div>
          ) : error || !referralLink ? (
            <p className="py-6 text-center text-sm text-gray-600">
              {t('roleQuickLinks.modalUnavailable')}
            </p>
          ) : (
            <>
              <div className="mx-auto mb-4 w-fit rounded-xl border-2 border-emerald-200 bg-white p-3">
                <QRCodeSVG value={referralLink} size={180} level="H" />
              </div>
              <p className="mb-3 break-all rounded-lg bg-emerald-50 px-3 py-2 text-xs font-mono text-emerald-900">
                {referralLink}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? t('roleQuickLinks.copied') : t('roleQuickLinks.copyLink')}
                </button>
                <button
                  type="button"
                  onClick={() => void downloadQr()}
                  disabled={downloading}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  {downloading ? t('common.loading') : t('roleQuickLinks.downloadQr')}
                </button>
                <button
                  type="button"
                  onClick={printQr}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 sm:col-span-2"
                >
                  <Printer className="h-4 w-4" />
                  {t('roleQuickLinks.printQr')}
                </button>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-500">
                <QrCode className="h-3.5 w-3.5" aria-hidden />
                {t('roleQuickLinks.modalHint')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
