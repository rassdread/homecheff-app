'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type { CommsOperationsSummary } from '@/lib/communication/comms-operations-summary';

type Props = {
  className?: string;
  compact?: boolean;
};

export default function UnansweredMessagesWidget({
  className,
  compact = false,
}: Props) {
  const { tOr } = useTranslation();
  const [summary, setSummary] = useState<CommsOperationsSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/operations/communication-summary', {
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as CommsOperationsSummary;
        if (!cancelled) setSummary(data);
      } catch {
        /* ignore */
      }
    };

    void load();
    const onRefresh = () => void load();
    window.addEventListener('unreadCountUpdate', onRefresh);
    window.addEventListener('messagesRead', onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener('unreadCountUpdate', onRefresh);
      window.removeEventListener('messagesRead', onRefresh);
    };
  }, []);

  const count = summary?.unansweredCount ?? 0;
  if (count <= 0) return null;

  const title =
    count === 1
      ? tOr(
          'operations.comms.unansweredOne',
          '1 conversation waiting for your reply',
          '1 gesprek wacht op antwoord',
        )
      : tOr(
          'operations.comms.unansweredMany',
          '{{count}} conversations waiting for your reply',
          '{{count}} gesprekken wachten op antwoord',
        ).replace('{{count}}', String(count));

  return (
    <div
      className={cn(
        'hc-dorpsplein-card flex items-start gap-3 border-l-4 border-l-orange-400 px-3 py-2.5',
        className,
      )}
    >
      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {!compact && summary?.primaryConversationLabel ? (
          <p className="mt-0.5 text-xs text-gray-600">{summary.primaryConversationLabel}</p>
        ) : null}
        {summary?.primaryConversationHref ? (
          <Link
            href={summary.primaryConversationHref}
            className="mt-1.5 inline-flex text-xs font-semibold text-emerald-700 hover:underline"
          >
            {tOr('operations.comms.openChat', 'Open chat', 'Gesprek openen')}
          </Link>
        ) : (
          <Link
            href="/messages"
            className="mt-1.5 inline-flex text-xs font-semibold text-emerald-700 hover:underline"
          >
            {tOr('operations.comms.openMessages', 'Open messages', 'Berichten openen')}
          </Link>
        )}
      </div>
    </div>
  );
}
