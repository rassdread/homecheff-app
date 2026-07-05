'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type { CommsOperationsSummary } from '@/lib/communication/comms-operations-summary';

type Props = {
  className?: string;
};

export default function CustomerWaitingWidget({ className }: Props) {
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

  const count = summary?.customerWaitingCount ?? 0;
  if (count <= 0) return null;

  const title =
    count === 1
      ? tOr(
          'operations.comms.customerWaitingOne',
          '1 customer waiting for a reply',
          '1 klant wacht op reactie',
        )
      : tOr(
          'operations.comms.customerWaitingMany',
          '{{count}} customers waiting for a reply',
          '{{count}} klanten wachten op reactie',
        ).replace('{{count}}', String(count));

  return (
    <div
      className={cn(
        'hc-dorpsplein-card flex items-start gap-3 border-l-4 border-l-amber-500 px-3 py-2.5',
        className,
      )}
    >
      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-0.5 text-xs text-gray-600">
          {tOr(
            'operations.comms.customerWaitingHint',
            'Reply quickly to build trust.',
            'Reageer snel om vertrouwen op te bouwen.',
          )}
        </p>
        <Link
          href={summary?.primaryConversationHref ?? '/messages'}
          className="mt-1.5 inline-flex text-xs font-semibold text-emerald-700 hover:underline"
        >
          {tOr('operations.comms.respondNow', 'Respond now', 'Nu reageren')}
        </Link>
      </div>
    </div>
  );
}
