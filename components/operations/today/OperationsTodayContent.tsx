'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import OperationsTasksSection from '@/components/operations/OperationsTasksSection';
import OperationsFinanceHero from '@/components/operations/today/OperationsFinanceHero';
import OperationsRoleAttentionChips from '@/components/operations/today/OperationsRoleAttentionChips';
import SellerTodayCard from '@/components/operations/today/SellerTodayCard';
import DeliveryTodayCard from '@/components/operations/today/DeliveryTodayCard';
import PartnerTodayCard from '@/components/operations/today/PartnerTodayCard';
import OperationsQuickActionsGrid from '@/components/operations/today/OperationsQuickActionsGrid';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useOperationsTodayRoleData } from '@/hooks/useOperationsTodayRoleData';
import { useTodayTasksSurface } from '@/hooks/useTodayTasksSurface';
import { useTranslation } from '@/hooks/useTranslation';
import { OPERATIONS_ROUTES } from '@/lib/operations/operations-entry';
import {
  resolveAutoExpandRole,
  resolveTimeGreetingKey,
  formatGreetingName,
  shouldShowFinanceFirst,
} from '@/lib/operations/operations-today-helpers';

function roleFlags(ctx: ReturnType<typeof useOperationsSidepanel>['ctx']) {
  const role = (ctx?.role || '').toUpperCase();
  return {
    isSeller: (ctx?.sellerRoles?.length ?? 0) > 0 || role === 'SELLER',
    isDelivery: Boolean(ctx?.hasDeliveryProfile) || role === 'DELIVERY',
    isAffiliate: Boolean(ctx?.hasAffiliate),
  };
}

export default function OperationsTodayContent() {
  const { data: session } = useSession();
  const { tOr, language } = useTranslation();
  const tasksSurface = useTodayTasksSurface();
  const { actionCenter, totals, ctx, loading: coreLoading } =
    useOperationsSidepanel();
  const {
    delivery,
    seller,
    partner,
    loading: roleLoading,
  } = useOperationsTodayRoleData(ctx);

  const { isSeller, isDelivery, isAffiliate } = roleFlags(ctx);

  const financeFirst = shouldShowFinanceFirst(actionCenter, totals);
  const hasActiveDelivery = Boolean(delivery?.currentOrder);

  const autoExpand = useMemo(
    () => resolveAutoExpandRole(actionCenter, delivery),
    [actionCenter, delivery],
  );

  const [expandedRole, setExpandedRole] = useState<{
    seller: boolean;
    delivery: boolean;
    partner: boolean;
  }>({ seller: false, delivery: false, partner: false });

  useEffect(() => {
    if (roleLoading || coreLoading) return;
    setExpandedRole({
      seller: autoExpand === 'seller',
      delivery: autoExpand === 'delivery',
      partner: autoExpand === 'partner',
    });
  }, [autoExpand, roleLoading, coreLoading]);

  const toggleRole = (role: 'seller' | 'delivery' | 'partner') => {
    setExpandedRole((prev) => {
      const next = !prev[role];
      return {
        seller: role === 'seller' ? next : false,
        delivery: role === 'delivery' ? next : false,
        partner: role === 'partner' ? next : false,
      };
    });
  };

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
  const workspaceLabel = tOr(
    'operations.workspaceLabel',
    'Operations',
    'Operations',
  );

  const dateLabel = new Intl.DateTimeFormat(
    language === 'en' ? 'en-GB' : 'nl-NL',
    { weekday: 'long', day: 'numeric', month: 'long' },
  ).format(new Date());

  const analyticsLink = tOr(
    'operations.today.footer.analytics',
    'Statistics →',
    'Statistieken →',
  );

  const tasksBlock = hasActiveDelivery ? null : (
    <OperationsTasksSection surface={tasksSurface} />
  );

  const financeBlock = (
    <OperationsFinanceHero compact={tasksSurface === 'inline'} />
  );

  const priorityBlocks =
    financeFirst && !hasActiveDelivery ? (
      <>
        {financeBlock}
        {tasksBlock}
      </>
    ) : (
      <>
        {tasksBlock}
        {financeBlock}
      </>
    );

  const showSellerCard = isSeller;
  const showDeliveryCard = isDelivery;
  const showPartnerCard = isAffiliate;
  const hasRoleCards = showSellerCard || showDeliveryCard || showPartnerCard;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4 lg:max-w-none lg:pb-0">
      {/* Greeting */}
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {workspaceLabel} · {todayLabel}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {userName ? `${greeting}, ${userName}` : greeting}
        </h1>
        <p className="text-sm capitalize text-gray-500">{dateLabel}</p>
      </header>

      {/* Priority: tasks/finance + role chips */}
      <div className="space-y-4">
        {hasActiveDelivery ? (
          <DeliveryTodayCard
            data={delivery}
            expanded={expandedRole.delivery}
            onToggle={() => toggleRole('delivery')}
            loading={roleLoading}
            variant="active-bar"
          />
        ) : null}

        {priorityBlocks}

        <OperationsRoleAttentionChips />
      </div>

      {/* Role cards — below first scroll on mobile */}
      {hasRoleCards ? (
        <section
          className="space-y-3 lg:space-y-4"
          aria-label={tOr(
            'operations.today.roleCards',
            'By role',
            'Per rol',
          )}
        >
          {showDeliveryCard ? (
            <DeliveryTodayCard
              data={delivery}
              expanded={expandedRole.delivery}
              onToggle={() => toggleRole('delivery')}
              loading={roleLoading}
            />
          ) : null}
          {showSellerCard ? (
            <SellerTodayCard
              data={seller}
              expanded={expandedRole.seller}
              onToggle={() => toggleRole('seller')}
              loading={roleLoading}
            />
          ) : null}
          {showPartnerCard ? (
            <PartnerTodayCard
              data={partner}
              expanded={expandedRole.partner}
              onToggle={() => toggleRole('partner')}
              loading={roleLoading}
            />
          ) : null}
        </section>
      ) : null}

      <OperationsQuickActionsGrid />

      {isSeller ? (
        <footer className="border-t border-gray-200/80 pt-4">
          <Link
            href={OPERATIONS_ROUTES.seller.analytics}
            prefetch
            className="text-sm font-medium text-gray-500 transition hover:text-emerald-700"
          >
            {analyticsLink}
          </Link>
        </footer>
      ) : null}
    </div>
  );
}
