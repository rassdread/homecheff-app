'use client';

import { useCallback, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Share2, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';
import { useTranslation } from '@/hooks/useTranslation';
import { cardActionBoundaryProps } from '@/lib/ui/card-action-boundary';
import {
  shareListingOrCopy,
  toAbsolutePublicUrl,
} from '@/lib/share/listing-share';

type TileShareActionProps = {
  /** Relative href or absolute public listing URL */
  href: string;
  title: string;
  description?: string | null;
  /** Optional origin override (SSR-safe absolute URL when known) */
  baseUrl?: string;
  /** Analytics surface label */
  surface?: 'feed' | 'search' | 'profile' | 'category' | 'tile';
  listingId?: string;
  className?: string;
};

/**
 * Compact share control for Marketplace listing tiles.
 * Native share sheet when available; otherwise copies the canonical public URL.
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
  const { addAffiliateToUrl, loading: referralLoading } = useAffiliateLink();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareReady = !session?.user?.email || !referralLoading;

  const onShare = useCallback(
    async (e: MouseEvent | KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      setError(null);
      setBusy(true);
      try {
        const absolute = toAbsolutePublicUrl(href, baseUrl);
        const url = shareReady ? addAffiliateToUrl(absolute) : absolute;
        const result = await shareListingOrCopy({
          url,
          title,
          text: description?.trim() || title,
        });

        if (typeof window !== 'undefined') {
          const w = window as Window & {
            gtag?: (...args: unknown[]) => void;
            dataLayer?: Record<string, unknown>[];
          };
          const payload = {
            listingId: listingId || undefined,
            surface,
            shareMethod: result.method,
            ok: result.ok,
          };
          try {
            if (typeof w.gtag === 'function') w.gtag('event', 'listing_share_clicked', payload);
            if (Array.isArray(w.dataLayer)) {
              w.dataLayer.push({ event: 'listing_share_clicked', ...payload });
            }
          } catch {
            /* ignore analytics */
          }
        }

        if (result.ok && result.method === 'clipboard') {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } else if (!result.ok && result.method === 'failed') {
          setError(t('share.copyFailed'));
          window.setTimeout(() => setError(null), 2500);
        }
        // cancelled = silent
      } finally {
        setBusy(false);
      }
    },
    [
      addAffiliateToUrl,
      baseUrl,
      busy,
      description,
      href,
      listingId,
      shareReady,
      surface,
      t,
      title,
    ],
  );

  return (
    <div {...cardActionBoundaryProps()} className={className} data-preview-ignore>
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
