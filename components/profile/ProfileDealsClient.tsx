'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ProfileDealDTO } from '@/lib/proposals/profile-deal-types';
import ProfileDealCard from '@/components/profile/ProfileDealCard';

export default function ProfileDealsClient() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'OPEN' | 'COMPLETED' | 'CANCELLED' | ''>('');
  const [deals, setDeals] = useState<ProfileDealDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeals = useCallback(async (status: typeof filter) => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    try {
      const res = await fetch(`/api/profile/deals${qs}`);
      const data = res.ok ? await res.json() : { deals: [] };
      setDeals(data.deals ?? []);
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeals(filter);
  }, [filter, loadDeals]);

  const handleDealUpdated = useCallback((updated: ProfileDealDTO) => {
    setDeals((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  }, []);

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
            <ProfileDealCard
              key={deal.id}
              deal={deal}
              onUpdated={handleDealUpdated}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
