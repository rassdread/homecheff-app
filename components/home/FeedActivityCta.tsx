'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Compact action for a feed activity line.
 * Organic neighbourhood activity and a future paid placement share this
 * control, but a paid placement must say so. This task does not rank or sell
 * placement; callers pass disclosure explicitly.
 */
export type FeedActivityDisclosure = 'organic' | 'sponsored';

export function focusFeedListing(listingId: string): boolean {
  if (typeof document === 'undefined') return false;
  let el: Element | null = null;
  try {
    el = document.querySelector(
      `[data-listing-id="${CSS.escape(listingId)}"]`,
    );
  } catch {
    return false;
  }
  if (!(el instanceof HTMLElement)) return false;
  el.style.scrollMarginTop = 'calc(4.75rem + env(safe-area-inset-top, 0px))';
  el.scrollIntoView({ behavior: 'auto', block: 'start' });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.classList.remove('hc-feed-activity-focus');
  if (!reduce) {
    void el.offsetWidth;
    el.classList.add('hc-feed-activity-focus');
    window.setTimeout(() => el.classList.remove('hc-feed-activity-focus'), 1200);
  }
  return true;
}

export default function FeedActivityCta({
  href,
  listingId,
  label,
  disclosure = 'organic',
}: {
  href: string;
  listingId?: string | null;
  label: string;
  disclosure?: FeedActivityDisclosure;
}) {
  const { t } = useTranslation();
  const sponsored = disclosure === 'sponsored';

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      {sponsored ? (
        <span
          className="rounded-md border border-stone-300 bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600"
          data-hc-activity-disclosure="sponsored"
        >
          {t('communityPulse.sponsored')}
        </span>
      ) : null}
      <Link
        href={href}
        data-hc-activity-cta=""
        data-hc-activity-disclosure={disclosure}
        className="inline-flex min-h-8 items-center rounded-lg border border-[var(--hc-border-quiet)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--hc-blue)]"
        onClick={(event) => {
          if (!listingId) return;
          if (focusFeedListing(listingId)) event.preventDefault();
        }}
      >
        {label}
      </Link>
    </span>
  );
}
