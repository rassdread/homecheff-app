'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type DealRow = {
  id: string;
  status: string;
  proposalTitle: string;
  counterpartName: string | null;
  canReview: boolean;
  conversationId: string;
  createdAt: string;
  completedAt: string | null;
};

export default function ProfileDealsClient() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'OPEN' | 'COMPLETED' | 'CANCELLED' | ''>('');
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : '';
    void fetch(`/api/profile/deals${qs}`)
      .then((r) => (r.ok ? r.json() : { deals: [] }))
      .then((data) => setDeals(data.deals ?? []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const filters: Array<{ id: typeof filter; label: string }> = [
    { id: '', label: t('trust.deals.filterAll') },
    { id: 'OPEN', label: t('trust.deals.filterOpen') },
    { id: 'COMPLETED', label: t('trust.deals.filterCompleted') },
    { id: 'CANCELLED', label: t('trust.deals.filterCancelled') },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t('profile.deals.navLabel')}</h1>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f.id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : deals.length === 0 ? (
        <p className="text-sm text-gray-600">{t('trust.deals.empty')}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {deals.map((deal) => (
            <li key={deal.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{deal.proposalTitle}</p>
                  {deal.counterpartName ? (
                    <p className="text-xs text-gray-600">
                      {t('trust.deals.with', { name: deal.counterpartName })}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                  {t(`communityOrder.status.${deal.status.toLowerCase()}`)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/messages/${deal.conversationId}`}
                  className="text-xs font-semibold text-emerald-700 underline"
                >
                  {t('trust.deals.openChat')}
                </Link>
                {deal.canReview ? (
                  <Link
                    href={`/deal-review/${deal.id}`}
                    className="text-xs font-semibold text-emerald-700 underline"
                  >
                    {t('trust.cta.reviewDeal')}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
