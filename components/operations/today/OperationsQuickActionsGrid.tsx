'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MessagesQuickActionLink from '@/components/communication/MessagesQuickActionLink';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useCommsUnread } from '@/hooks/useCommsUnread';
import { useTranslation } from '@/hooks/useTranslation';
import { deriveTodayQuickActions } from '@/lib/operations/operations-today-helpers';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export default function OperationsQuickActionsGrid({ className }: Props) {
  const { t, tOr } = useTranslation();
  const { ctx, loading } = useOperationsSidepanel();
  const { count: messagesUnreadCount } = useCommsUnread();
  const promoteMessages = messagesUnreadCount > 0;

  const title = tOr(
    'operations.sidepanel.actions.title',
    'Quick actions',
    'Snelle acties',
  );

  const actions = deriveTodayQuickActions(ctx);

  if (loading) {
    return (
      <section
        className={cn('hc-dorpsplein-card animate-pulse p-4', className)}
        aria-label={title}
      >
        <div className="mb-3 h-4 w-28 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-gray-100" />
          ))}
        </div>
      </section>
    );
  }

  if (actions.length === 0 && !promoteMessages) return null;

  return (
    <section className={cn('hc-dorpsplein-card p-4', className)} aria-label={title}>
      <h2 className="hc-section-title mb-3 text-base">{title}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {promoteMessages ? <MessagesQuickActionLink layout="grid" className="col-span-2 sm:col-span-1" /> : null}
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            prefetch
            className="group flex min-h-[44px] items-center justify-between gap-1 rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 text-left text-sm font-semibold text-gray-900 transition hover:border-emerald-200 hover:bg-emerald-50/40"
          >
            <span className="min-w-0 truncate">{t(action.labelKey)}</span>
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-emerald-600"
              aria-hidden
            />
          </Link>
        ))}
        {!promoteMessages ? <MessagesQuickActionLink layout="grid" /> : null}
      </div>
    </section>
  );
}
