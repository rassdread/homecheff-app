'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, List } from 'lucide-react';
import { CardListLoadingSkeleton } from '@/components/navigation/RouteLoadingSkeletons';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  AgreementAgendaBucket,
  AgreementHubDealItem,
  AgreementHubItem,
  AgreementsHubAgenda,
  AgreementsHubFilter,
  AgreementsHubResponse,
  AgreementsHubSummary,
} from '@/lib/agreements/agreements-hub-types';
import {
  AGREEMENT_AGENDA_BUCKETS,
  AGREEMENTS_HUB_FILTERS,
} from '@/lib/agreements/agreements-hub-types';
import AgreementHubDealCard from '@/components/agreements/AgreementHubDealCard';
import AgreementHubProposalCard from '@/components/agreements/AgreementHubProposalCard';
import CourierAgreementsStrip from '@/components/agreements/CourierAgreementsStrip';

const FILTER_LABEL_KEYS: Record<AgreementsHubFilter, string> = {
  '': 'marketplace.agreements.filters.all',
  ACTION_REQUIRED: 'marketplace.agreements.filters.actionRequired',
  OPEN: 'marketplace.agreements.filters.open',
  IN_PROGRESS: 'marketplace.agreements.filters.inProgress',
  WAITING_PAYMENT: 'marketplace.agreements.filters.waitingPayment',
  WAITING_DELIVERY: 'marketplace.agreements.filters.waitingDelivery',
  COMPLETED: 'marketplace.agreements.filters.completed',
  CANCELLED: 'marketplace.agreements.filters.cancelled',
};

const AGENDA_LABEL_KEYS: Record<AgreementAgendaBucket, string> = {
  today: 'marketplace.agreements.agenda.today',
  tomorrow: 'marketplace.agreements.agenda.tomorrow',
  thisWeek: 'marketplace.agreements.agenda.thisWeek',
  nextWeek: 'marketplace.agreements.agenda.nextWeek',
  later: 'marketplace.agreements.agenda.later',
  unscheduled: 'marketplace.agreements.agenda.unscheduled',
  completed: 'marketplace.agreements.agenda.completed',
};

const EMPTY_COUNTS: AgreementsHubResponse['counts'] = {
  '': 0,
  ACTION_REQUIRED: 0,
  OPEN: 0,
  IN_PROGRESS: 0,
  WAITING_PAYMENT: 0,
  WAITING_DELIVERY: 0,
  COMPLETED: 0,
  CANCELLED: 0,
};

const EMPTY_AGENDA: AgreementsHubAgenda = {
  today: [],
  tomorrow: [],
  thisWeek: [],
  nextWeek: [],
  later: [],
  unscheduled: [],
  completed: [],
};

const EMPTY_SUMMARY: AgreementsHubSummary = {
  nextAgreement: null,
  nextAction: null,
  plannedTodayCount: 0,
  openActionCount: 0,
  activeDeliveryCount: 0,
  waitingPaymentCount: 0,
  proposalsToRespondCount: 0,
};

type HubView = 'list' | 'agenda';

function itemTitle(item: AgreementHubItem): string {
  return item.kind === 'proposal'
    ? item.proposal.title
    : item.deal.proposalTitle || item.deal.title;
}

function itemCounterpart(item: AgreementHubItem): string | null {
  return item.kind === 'proposal'
    ? item.counterpartName
    : item.deal.counterpartName;
}

function itemActionLabelKey(item: AgreementHubItem): string {
  return item.kind === 'proposal'
    ? item.primaryCtaLabelKey
    : item.deal.dealUx.primaryCta.labelKey;
}

/**
 * Unified operational cockpit "Mijn Afspraken" (CE-2A + CE-2B). One screen to
 * manage proposals, deals, payments, deliveries, actions, completion and history:
 * a next-up cockpit strip, an "action required" section, filters, and an
 * agenda/planning view grouped by today → history.
 */
export default function ProfileDealsClient() {
  const { t } = useTranslation();
  const [view, setView] = useState<HubView>('list');
  const [filter, setFilter] = useState<AgreementsHubFilter>('');
  const [items, setItems] = useState<AgreementHubItem[]>([]);
  const [counts, setCounts] =
    useState<AgreementsHubResponse['counts']>(EMPTY_COUNTS);
  const [agenda, setAgenda] = useState<AgreementsHubAgenda>(EMPTY_AGENDA);
  const [summary, setSummary] = useState<AgreementsHubSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  // Single refresh path (CE-2B.7): every mutation re-runs loadHub, which refreshes
  // items + counts + agenda + summary together — no divergent cache updates.
  const loadHub = useCallback(async (activeFilter: AgreementsHubFilter) => {
    setLoading(true);
    const qs = activeFilter ? `?filter=${activeFilter}` : '';
    try {
      const res = await fetch(`/api/agreements${qs}`);
      const data: AgreementsHubResponse = res.ok
        ? await res.json()
        : {
            items: [],
            counts: EMPTY_COUNTS,
            agenda: EMPTY_AGENDA,
            summary: EMPTY_SUMMARY,
          };
      setItems(data.items ?? []);
      setCounts(data.counts ?? EMPTY_COUNTS);
      setAgenda(data.agenda ?? EMPTY_AGENDA);
      setSummary(data.summary ?? EMPTY_SUMMARY);
    } catch {
      setItems([]);
      setCounts(EMPTY_COUNTS);
      setAgenda(EMPTY_AGENDA);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHub(filter);
  }, [filter, loadHub]);

  const handleDealUpdated = useCallback(
    (updated: AgreementHubDealItem['deal']) => {
      setItems((prev) =>
        prev.map((row) =>
          row.kind === 'deal' && row.id === updated.id
            ? { ...row, deal: updated, updatedAt: updated.updatedAt }
            : row,
        ),
      );
      void loadHub(filter);
    },
    [filter, loadHub],
  );

  const renderItem = (item: AgreementHubItem) =>
    item.kind === 'proposal' ? (
      <AgreementHubProposalCard key={`proposal-${item.id}`} item={item} />
    ) : (
      <AgreementHubDealCard
        key={`deal-${item.id}`}
        item={item}
        onUpdated={handleDealUpdated}
      />
    );

  const { actionItems, restItems } = useMemo(() => {
    const action: AgreementHubItem[] = [];
    const rest: AgreementHubItem[] = [];
    for (const item of items) {
      if (item.facets.includes('ACTION_REQUIRED')) action.push(item);
      else rest.push(item);
    }
    return { actionItems: action, restItems: rest };
  }, [items]);

  const agendaIsEmpty = AGREEMENT_AGENDA_BUCKETS.every(
    (bucket) => agenda[bucket].length === 0,
  );

  const nextAgreementLabel = summary.nextAgreement
    ? [
        itemTitle(summary.nextAgreement),
        summary.nextAgreement.agenda.timeLabel,
      ]
        .filter(Boolean)
        .join(' \u00b7 ')
    : t('marketplace.agreements.cockpit.allClear');

  const nextActionLabel = summary.nextAction
    ? `${t(itemActionLabelKey(summary.nextAction))} \u00b7 ${itemTitle(summary.nextAction)}`
    : t('marketplace.agreements.cockpit.allClear');

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">
            {t('community.agreements.title')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('community.agreements.subtitle')}
          </p>
        </div>
        <div
          className="flex shrink-0 rounded-full border border-gray-200 bg-white p-0.5"
          role="tablist"
          aria-label={t('marketplace.agreements.view.aria')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === 'list'}
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              view === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-600'
            }`}
          >
            <List className="h-3.5 w-3.5" aria-hidden />
            {t('marketplace.agreements.view.list')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'agenda'}
            onClick={() => setView('agenda')}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              view === 'agenda' ? 'bg-emerald-600 text-white' : 'text-gray-600'
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            {t('marketplace.agreements.view.agenda')}
          </button>
        </div>
      </header>

      {/* Cockpit strip — always shows next agreement + next action (CE-2B.4). */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            {t('marketplace.agreements.cockpit.nextAgreement')}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-emerald-950">
            {nextAgreementLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            {t('marketplace.agreements.cockpit.nextAction')}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-amber-950">
            {nextActionLabel}
          </p>
        </div>
      </div>

      <CourierAgreementsStrip />

      {view === 'list' ? (
        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          role="tablist"
          aria-label={t('marketplace.agreements.filters.aria')}
        >
          {AGREEMENTS_HUB_FILTERS.map((id) => {
            const count = counts?.[id];
            return (
              <button
                key={id || 'all'}
                type="button"
                role="tab"
                aria-selected={filter === id}
                onClick={() => setFilter(id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  filter === id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {t(FILTER_LABEL_KEYS[id])}
                {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <CardListLoadingSkeleton rows={3} />
      ) : view === 'agenda' ? (
        agendaIsEmpty ? (
          <p className="text-sm text-gray-600">
            {t('marketplace.agreements.empty')}
          </p>
        ) : (
          <div className="space-y-5">
            {AGREEMENT_AGENDA_BUCKETS.map((bucket) =>
              agenda[bucket].length > 0 ? (
                <section key={bucket} className="space-y-2">
                  <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t(AGENDA_LABEL_KEYS[bucket])}
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                      {agenda[bucket].length}
                    </span>
                  </h2>
                  <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                    {agenda[bucket].map(renderItem)}
                  </ul>
                </section>
              ) : null,
            )}
          </div>
        )
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-600">
          {t('marketplace.agreements.empty')}
        </p>
      ) : filter === '' && actionItems.length > 0 ? (
        <div className="space-y-5">
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
              {t('marketplace.agreements.sections.actionRequired')}
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                {actionItems.length}
              </span>
            </h2>
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-amber-200 bg-white">
              {actionItems.map(renderItem)}
            </ul>
          </section>
          {restItems.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('marketplace.agreements.sections.other')}
              </h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                {restItems.map(renderItem)}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          {items.map(renderItem)}
        </ul>
      )}
    </div>
  );
}
