'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Copy, Share2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type InviteNeighbourPanelProps = {
  className?: string;
};

export default function InviteNeighbourPanel({ className = '' }: InviteNeighbourPanelProps) {
  const { t } = useTranslation();
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enrollmentRequired, setEnrollmentRequired] = useState(false);
  const [copied, setCopied] = useState(false);
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const load = useCallback(async () => {
    setLoading(true);
      setError(false);
      setEnrollmentRequired(false);
      try {
        const res = await fetch('/api/affiliate/referral-link', {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          setError(true);
          setLink(null);
          return;
        }
        const json = (await res.json()) as { link?: string | null; enrollmentRequired?: boolean };
        if (json.enrollmentRequired || !json.link) {
          setEnrollmentRequired(Boolean(json.enrollmentRequired || !json.link));
          setLink(null);
          return;
        }
        setLink(json.link);
    } catch {
      setError(true);
      setLink(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const shareLink = async () => {
    if (!link || !canNativeShare) return;
    try {
      await navigator.share({
        title: t('inviteNeighbour.title'),
        text: t('inviteNeighbour.shareText'),
        url: link,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <section
      className={`rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm ${className}`}
      data-testid="hc-invite-neighbour"
    >
      <h1 className="text-xl font-bold text-gray-900">{t('inviteNeighbour.title')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {t('inviteNeighbour.description')}
      </p>

      {loading ? (
        <div className="mt-5 animate-pulse space-y-3">
          <div className="h-12 rounded-xl bg-gray-100" />
          <div className="h-11 rounded-xl bg-gray-100" />
        </div>
      ) : enrollmentRequired ? (
        <p className="mt-5 text-sm text-gray-600">{t('inviteNeighbour.enrollmentRequired')}</p>
      ) : error || !link ? (
        <p className="mt-5 text-sm text-gray-600">{t('inviteNeighbour.unavailable')}</p>
      ) : (
        <>
          <p className="mt-4 break-all rounded-xl bg-emerald-50 px-3 py-3 text-sm font-mono text-emerald-950">
            {link}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t('inviteNeighbour.copied') : t('inviteNeighbour.copy')}
            </button>
            {canNativeShare ? (
              <button
                type="button"
                onClick={() => void shareLink()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                {t('inviteNeighbour.share')}
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
