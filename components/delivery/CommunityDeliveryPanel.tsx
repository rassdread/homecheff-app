'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { CommunityDeliveryRequestListItem } from '@/lib/delivery/delivery-marketplace-types';

type Props = {
  isOnline: boolean;
};

function formatSchedule(item: CommunityDeliveryRequestListItem): string | null {
  const date = item.pickupDate ?? item.deliveryDate;
  if (!date) return item.pickupTimeWindow ?? item.deliveryTimeWindow;
  try {
    const label = new Date(date).toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const window = item.pickupTimeWindow ?? item.deliveryTimeWindow;
    return window ? `${label} · ${window}` : label;
  } catch {
    return item.pickupTimeWindow ?? item.deliveryTimeWindow;
  }
}

export default function CommunityDeliveryPanel({ isOnline }: Props) {
  const { t } = useTranslation();
  const [available, setAvailable] = useState<CommunityDeliveryRequestListItem[]>([]);
  const [mine, setMine] = useState<CommunityDeliveryRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/delivery/community-requests');
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.errorKey === 'string' ? data.errorKey : null;
        setError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      setAvailable(data.available ?? []);
      setMine(data.mine ?? []);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    id: string,
    action: 'claim' | 'accept' | 'complete',
  ) => {
    setBusyId(id);
    setError(null);
    try {
      const path =
        action === 'claim'
          ? `/api/delivery-requests/${id}/claim`
          : action === 'accept'
            ? `/api/delivery-requests/${id}/accept`
            : `/api/delivery-requests/${id}/complete`;
      const res = await fetch(path, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.errorKey === 'string'
            ? data.errorKey
            : typeof data.error === 'string' && data.error.startsWith('delivery.')
              ? data.error
              : null;
        setError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      await load();
    } catch {
      setError(t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const renderCard = (
    item: CommunityDeliveryRequestListItem,
    mode: 'available' | 'mine',
  ) => {
    const schedule = formatSchedule(item);
    const statusKey = `delivery.request.status.${item.status.toLowerCase()}`;

    return (
      <div
        key={item.id}
        className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-5 hover:border-emerald-200 transition-all"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2">
            {item.title}
          </h4>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
            {t(statusKey)}
          </span>
        </div>

        <div className="space-y-1 text-xs text-gray-600 mb-3">
          {item.pickupAddress ? (
            <p className="flex items-start gap-1">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0" aria-hidden />
              <span>
                <span className="font-medium">{t('delivery.community.pickup')}: </span>
                {item.pickupAddress}
              </span>
            </p>
          ) : null}
          {item.deliveryAddress ? (
            <p className="flex items-start gap-1">
              <Package className="w-3 h-3 mt-0.5 shrink-0" aria-hidden />
              <span>
                <span className="font-medium">{t('delivery.community.dropoff')}: </span>
                {item.deliveryAddress}
              </span>
            </p>
          ) : null}
          {schedule ? (
            <p className="flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0" aria-hidden />
              {schedule}
            </p>
          ) : null}
          {item.distanceKm != null ? (
            <p className="text-gray-500">
              {t('delivery.community.distance', { km: item.distanceKm })}
            </p>
          ) : null}
        </div>

        {mode === 'mine' && item.courierName && item.activeAssignment?.status === 'ACCEPTED' ? (
          <p className="text-[11px] text-emerald-700 mb-2">
            {t('delivery.community.youAreCourier')}
          </p>
        ) : null}

        {mode === 'available' && item.canClaim ? (
          <button
            type="button"
            disabled={!isOnline || busyId === item.id}
            onClick={() => void runAction(item.id, 'claim')}
            className="w-full bg-emerald-600 text-white py-2.5 px-3 rounded-lg hover:bg-emerald-700 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busyId === item.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle className="w-4 h-4" aria-hidden />
            )}
            {t('delivery.community.claim')}
          </button>
        ) : null}

        {mode === 'mine' && item.needsAccept ? (
          <button
            type="button"
            disabled={busyId === item.id}
            onClick={() => void runAction(item.id, 'accept')}
            className="w-full bg-emerald-600 text-white py-2.5 px-3 rounded-lg hover:bg-emerald-700 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busyId === item.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle className="w-4 h-4" aria-hidden />
            )}
            {t('delivery.community.accept')}
          </button>
        ) : null}

        {mode === 'mine' && item.canComplete ? (
          <button
            type="button"
            disabled={busyId === item.id}
            onClick={() => void runAction(item.id, 'complete')}
            className="w-full bg-indigo-600 text-white py-2.5 px-3 rounded-lg hover:bg-indigo-700 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busyId === item.id ? (
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Truck className="w-4 h-4" aria-hidden />
            )}
            {t('delivery.community.complete')}
          </button>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {!isOnline ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {t('delivery.community.goOnlineHint')}
        </p>
      ) : null}

      {mine.length > 0 ? (
        <section>
          <h3 className="text-base font-bold text-gray-900 mb-3">
            {t('delivery.community.myJobs')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mine.map((item) => renderCard(item, 'mine'))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-bold text-gray-900">
            {t('delivery.community.available')}
          </h3>
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800"
          >
            <RefreshCw className="w-4 h-4" />
            {t('delivery.refresh')}
          </button>
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-gray-600">{t('delivery.community.empty')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {available.map((item) => renderCard(item, 'available'))}
          </div>
        )}
      </section>
    </div>
  );
}
