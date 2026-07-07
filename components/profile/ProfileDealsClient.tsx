'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, List, Loader2 } from 'lucide-react';
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
  thisWeek: 'marketplace.agreements.agenda.thisWeek',
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
  thisWeek: [],
  later: [],
  unscheduled: [],
  completed: [],
};

const EMPTY_SUMMARY: AgreementsHubSummary = {
  nextAgreement: null,
  plannedTodayCount: 0,
  openActionCount: 0,
  activeDeliveryCount: 0,
  waitingPaymentCount: 0,
  proposalsToRespondCount: 0,
};

type HubView = 'list' | 'agenda';

/**
 * Unified operational hub "Mijn Afspraken" (CE-2A). Aggregates pending/countered
 * proposals and community-order deals with filters, an agenda/planning view,
 * timeline, next-action and chat CTA — the central cockpit at /profile/deals.
 */
export default function ProfileDealsClient() {
  const { t } = useTranslation();
  const [view, setView] = useState<HubView>('list');
  const [filter, setFilter] = useState<AgreementsHubFilter>('');
  const [items, setItems] = useState<AgreementHubItem[]>([]);
  const [counts, setCounts] =
    useState<AgreementsHubResponse['counts']>(EMPTY_COUNTS);
  const [agenda, setAgenda] = useState<AgreementsHubAgenda>(EMPTY_AGENDA);
  // Sidebar-ready quick insights (data only — no sidebar redesign here).
  const [, setSummary] = useState<AgreementsHubSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

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

  const agendaIsEmpty = AGREEMENT_AGENDA_BUCKETS.every(
    (bucket) => agenda[bucket].length === 0,
  );

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
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
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
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          {items.map(renderItem)}
        </ul>
      )}
    </div>
  );
}
