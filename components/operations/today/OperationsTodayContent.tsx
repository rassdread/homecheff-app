'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import OperationsTasksSection from '@/components/operations/OperationsTasksSection';
import DeliveryTodayCard from '@/components/operations/today/DeliveryTodayCard';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useOperationsTodayRoleData } from '@/hooks/useOperationsTodayRoleData';
import { useTodayTasksSurface } from '@/hooks/useTodayTasksSurface';
import { useTranslation } from '@/hooks/useTranslation';
import {
  deriveTodayEmptyNextAction,
  selectTodayActionItems,
} from '@/lib/operations/today-priority';
import {
  formatGreetingName,
  resolveTimeGreetingKey,
} from '@/lib/operations/operations-today-helpers';

export default function OperationsTodayContent() {
  const { data: session } = useSession();
  const { tOr, language } = useTranslation();
  const tasksSurface = useTodayTasksSurface();
  const { actionCenter, ctx, loading: coreLoading } = useOperationsSidepanel();
  const { delivery, loading: roleLoading } = useOperationsTodayRoleData(ctx);

  const hasActiveDelivery = Boolean(delivery?.currentOrder);
  const waiting = selectTodayActionItems(actionCenter?.items ?? []);
  const listed = hasActiveDelivery
    ? waiting.filter((item) => item.id !== 'delivery-active')
    : waiting;
  const nextAction =
    !coreLoading && waiting.length === 0 ? deriveTodayEmptyNextAction(ctx) : null;
  const showQueue = coreLoading || listed.length > 0 || waiting.length === 0;

  const userName = formatGreetingName(
    (session?.user?.name as string | undefined) ??
      (session?.user?.username as string | undefined),
  );
  const greetingKey = resolveTimeGreetingKey(new Date().getHours());
  const greetingFallback =
    new Date().getHours() < 12
      ? 'Goedemorgen'
      : new Date().getHours() < 18
        ? 'Goedemiddag'
        : 'Goedenavond';
  const greeting = tOr(greetingKey, greetingFallback, greetingFallback);
  const todayLabel = tOr('operations.tabs.today', 'Today', 'Vandaag');

  const dateLabel = new Intl.DateTimeFormat(
    language === 'en' ? 'en-GB' : 'nl-NL',
    { weekday: 'long', day: 'numeric', month: 'long' },
  ).format(new Date());

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4 lg:max-w-none lg:pb-0">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {todayLabel}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {userName ? `${greeting}, ${userName}` : greeting}
        </h1>
        <p className="text-sm capitalize text-gray-500">{dateLabel}</p>
      </header>

      {hasActiveDelivery ? (
        <DeliveryTodayCard
          data={delivery}
          expanded={false}
          onToggle={() => undefined}
          loading={roleLoading}
          variant="active-bar"
        />
      ) : null}

      {showQueue ? (
        <OperationsTasksSection
          surface={tasksSurface}
          excludeIds={hasActiveDelivery ? ['delivery-active'] : []}
        />
      ) : null}

      {nextAction ? (
        <Link
          href={nextAction.href}
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {tOr(nextAction.labelKey, nextAction.fallbackEn, nextAction.fallbackNl)}
        </Link>
      ) : null}
    </div>
  );
}
