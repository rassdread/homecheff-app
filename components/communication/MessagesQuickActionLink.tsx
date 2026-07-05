'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import CommsUnreadBadge from '@/components/communication/CommsUnreadBadge';
import { useCommsUnread } from '@/hooks/useCommsUnread';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Guest flow — render button instead of link */
  onGuestClick?: () => void;
  /** Compact grid cell (operations) vs full-width row (home sidebar) */
  layout?: 'row' | 'grid';
  /** Override unread count (tests); default reads CommsUnreadProvider */
  unreadCount?: number;
};

/**
 * Berichten quick action — badge + urgent styling when unread > 0.
 * Single source: useCommsUnread (CommsUnreadProvider).
 */
export default function MessagesQuickActionLink({
  className,
  onGuestClick,
  layout = 'row',
  unreadCount: unreadOverride,
}: Props) {
  const { t } = useTranslation();
  const { count: liveCount } = useCommsUnread();
  const count = unreadOverride ?? liveCount;
  const urgent = count > 0;

  const baseClass =
    layout === 'grid'
      ? 'group flex min-h-[44px] items-center justify-between gap-1 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition'
      : 'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors text-left';

  const stateClass = urgent
    ? 'border-orange-300 bg-orange-50/90 text-orange-950 hover:border-orange-400 hover:bg-orange-50 shadow-sm'
    : layout === 'grid'
      ? 'border-gray-200/80 bg-white text-gray-900 hover:border-emerald-200 hover:bg-emerald-50/40'
      : 'border-gray-200 bg-white text-gray-800 hover:border-secondary-brand/30 hover:bg-secondary-50/40';

  const inner = (
    <>
      <span className="relative flex min-w-0 items-center gap-2">
        <MessageCircle
          className={cn(
            'h-4 w-4 shrink-0',
            urgent ? 'text-orange-600' : 'text-secondary-brand',
          )}
          aria-hidden
        />
        <span className="truncate">{t('bottomNav.messages')}</span>
        {layout === 'row' ? <CommsUnreadBadge count={count} /> : null}
      </span>
      {layout === 'grid' ? <CommsUnreadBadge count={count} /> : null}
    </>
  );

  if (onGuestClick) {
    return (
      <button type="button" onClick={onGuestClick} className={cn(baseClass, stateClass, className)}>
        {inner}
      </button>
    );
  }

  return (
    <Link href="/messages" prefetch className={cn(baseClass, stateClass, className)}>
      {inner}
    </Link>
  );
}
