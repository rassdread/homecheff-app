'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import CommsUnreadBadge, { formatCommsUnreadCount } from '@/components/communication/CommsUnreadBadge';
import { useCommsUnread } from '@/hooks/useCommsUnread';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

/**
 * Prominent unread-messages alert for homepage sidebar — visible without scrolling.
 * Renders nothing when unread count is 0.
 */
export default function MessagesUrgentSidebarCard({ className }: Props) {
  const { t, tOr } = useTranslation();
  const { count } = useCommsUnread();

  if (count <= 0) return null;

  const title =
    count === 1
      ? tOr(
          'homeDorpsplein.messagesUrgentOne',
          'You have 1 unread message',
          'Je hebt 1 ongelezen bericht',
        )
      : tOr(
          'homeDorpsplein.messagesUrgentMany',
          'You have {{count}} unread messages',
          'Je hebt {{count}} ongelezen berichten',
        ).replace('{{count}}', String(count));

  const ctaLabel = tOr(
    'homeDorpsplein.messagesUrgentCta',
    'Open messages',
    'Berichten openen',
  );

  const badgeLabel = formatCommsUnreadCount(count);

  return (
    <section
      className={cn(
        'hc-dorpsplein-card border-l-4 border-l-orange-400 bg-gradient-to-br from-orange-50/95 to-amber-50/60 px-4 py-3 shadow-sm',
        className,
      )}
      aria-label={t('bottomNav.messages')}
    >
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
          <MessageCircle className="h-4 w-4 text-orange-600" aria-hidden />
          <CommsUnreadBadge count={count} variant="corner" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-orange-950">{title}</p>
          <p className="mt-0.5 text-xs text-orange-900/75">
            {tOr(
              'homeDorpsplein.messagesUrgentHint',
              'Reply when it suits you — your conversation is waiting.',
              'Reageer wanneer het jou uitkomt — je gesprek wacht op je.',
            )}
          </p>
          <Link
            href="/messages"
            prefetch
            className="mt-2.5 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
            aria-label={`${ctaLabel}${badgeLabel ? ` (${badgeLabel})` : ''}`}
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
