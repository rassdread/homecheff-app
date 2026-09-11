'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import DynamicAddressFields, {
  type AddressData,
} from '@/components/ui/DynamicAddressFields';
import { useTranslation } from '@/hooks/useTranslation';
import {
  fulfillmentDateLabelKey,
  fulfillmentTimeLabelKey,
  resolveLocationPanelPresentation,
} from '@/lib/proposals/fulfillment-location';
import type { CommunityOrderDTO } from '@/lib/proposals/proposal-types';

type LocationView = {
  state: string;
  ownerRole: 'SELLER' | 'BUYER' | null;
  viewerCanComplete: boolean;
  scheduleLockedFromProposal: boolean;
  scheduleDate: string | null;
  scheduleTimeWindow: string | null;
  exactAddress: string | null;
  savedAddressLine: string | null;
  counterpartName: string | null;
  fulfillmentMode: string | null;
  communityOrder?: { status?: string } | null;
};

type Props = {
  communityOrderId: string;
  onCompleted?: (order: CommunityOrderDTO) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  const l = label.trim();
  const v = value.trim();
  if (!l || !v) return null;
  return (
    <p className="text-[11px] text-amber-900 whitespace-pre-line">
      {l}: <span className="font-medium">{v}</span>
    </p>
  );
}

export default function FulfillmentLocationPanel({
  communityOrderId,
  onCompleted,
}: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<LocationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [useSaved, setUseSaved] = useState(false);
  const [address, setAddress] = useState<AddressData>({ country: 'NL' });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/community-orders/${communityOrderId}/fulfillment-location`,
      );
      if (!res.ok) {
        setView(null);
        return;
      }
      const data = (await res.json()) as LocationView;
      setView(data);
      if (data.scheduleDate) setScheduleDate(data.scheduleDate);
      if (data.scheduleTimeWindow) setScheduleTime(data.scheduleTimeWindow);
      if (data.viewerCanComplete && data.state !== 'COMPLETE') {
        setShowForm(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityOrderId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('common.loading', { defaultValue: 'Laden…' })}
      </div>
    );
  }

  if (!view || view.state === 'LOCATION_NOT_REQUIRED') return null;

  const mode = view.fulfillmentMode;
  const dateLabel = t(fulfillmentDateLabelKey(mode as never), {
    defaultValue: 'Datum',
  });
  const timeLabel = t(fulfillmentTimeLabelKey(mode as never), {
    defaultValue: 'Tijd',
  });
  const addressHeading =
    view.ownerRole === 'BUYER'
      ? t('proposal.location.deliveryAddress', {
          defaultValue: 'Afleveradres',
        })
      : t('proposal.location.pickupAddress', {
          defaultValue: 'Afhaaladres',
        });

  const exactAddress = view.exactAddress?.trim() || '';
  const scheduleDateValue = view.scheduleDate?.trim() || '';
  const scheduleTimeValue = view.scheduleTimeWindow?.trim() || '';
  const hasAddress = exactAddress.length > 0;
  const orderCompleted = view.communityOrder?.status === 'COMPLETED';
  const locationComplete = view.state === 'COMPLETE' && hasAddress;
  const presentation = resolveLocationPanelPresentation({
    state: view.state as never,
    exactAddress,
    scheduleDate: scheduleDateValue,
    scheduleTimeWindow: scheduleTimeValue,
    viewerCanComplete: view.viewerCanComplete,
  });

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/community-orders/${communityOrderId}/fulfillment-location`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            useSavedProfileAddress: useSaved,
            address: useSaved ? undefined : address,
            scheduleDate: view.scheduleLockedFromProposal
              ? undefined
              : scheduleDate || null,
            scheduleTimeWindow: view.scheduleLockedFromProposal
              ? undefined
              : scheduleTime || null,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.errorKey === 'string'
            ? t(data.errorKey, {
                defaultValue: data.error || t('common.error', { defaultValue: 'Er ging iets mis' }),
              })
            : data.error || t('common.error', { defaultValue: 'Er ging iets mis' }),
        );
        return;
      }
      onCompleted?.(data.communityOrder);
      setShowForm(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const pendingCopy =
    view.ownerRole === 'BUYER'
      ? t('proposal.location.deliveryPendingOther', {
          name: view.counterpartName || '',
          defaultValue: 'Afleveradres wordt nog bevestigd.',
        })
      : t('proposal.location.pickupPendingOther', {
          name: view.counterpartName || '',
          defaultValue: 'Afhaaladres wordt nog bevestigd.',
        });

  const ctaLabel =
    view.ownerRole === 'BUYER'
      ? t('proposal.location.confirmDeliveryCta', {
          defaultValue: 'Afleveradres bevestigen',
        })
      : t('proposal.location.confirmPickupCta', {
          defaultValue: 'Afhaaladres invullen',
        });

  // Historical completed deals without operational address: meaningful empty state,
  // never bare "Label:" / ":" rows.
  if (presentation === 'not_recorded') {
    return (
      <div
        className="rounded-lg border border-gray-200 bg-gray-50/80 p-2.5 space-y-1"
        data-hc-fulfillment-location=""
        data-hc-community-order-id={communityOrderId}
        data-hc-location-state="NOT_RECORDED"
      >
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" aria-hidden />
          <p className="text-[11px] text-gray-700">
            {orderCompleted
              ? t('proposal.location.notRecordedCompleted', {
                  defaultValue:
                    'Locatie is voor deze afgeronde afspraak niet vastgelegd.',
                })
              : t('proposal.location.notRecorded', {
                  defaultValue: 'Locatie is nog niet vastgelegd.',
                })}
          </p>
        </div>
      </div>
    );
  }

  if (presentation === 'hidden') return null;

  const addressDisplay = hasAddress
    ? exactAddress
    : view.viewerCanComplete
      ? t('proposal.location.addressPendingSelf', {
          defaultValue: 'Nog te bevestigen',
        })
      : pendingCopy;

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 space-y-2"
      data-hc-fulfillment-location=""
      data-hc-community-order-id={communityOrderId}
      data-hc-location-state={view.state}
    >
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-semibold text-amber-950">
            {locationComplete
              ? t('proposal.location.completeHeading', {
                  defaultValue: 'Locatie afgerond',
                })
              : t('proposal.location.pendingHeading', {
                  defaultValue: 'Afspraak bevestigd — gegevens nog afronden',
                })}
          </p>
          <DetailRow
            label={dateLabel}
            value={
              scheduleDateValue ||
              (view.viewerCanComplete
                ? t('proposal.location.tbd', { defaultValue: 'Nog te bepalen' })
                : '')
            }
          />
          <DetailRow
            label={timeLabel}
            value={
              scheduleTimeValue ||
              (view.viewerCanComplete
                ? t('proposal.location.tbd', { defaultValue: 'Nog te bepalen' })
                : '')
            }
          />
          <DetailRow label={addressHeading} value={addressDisplay} />
        </div>
      </div>

      {view.viewerCanComplete && !showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800"
          data-hc-location-cta=""
        >
          {ctaLabel}
        </button>
      ) : null}

      {view.viewerCanComplete && showForm ? (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-white p-2.5">
          {view.savedAddressLine ? (
            <label className="flex items-start gap-2 text-xs text-gray-800">
              <input
                type="radio"
                checked={useSaved}
                onChange={() => setUseSaved(true)}
                className="mt-0.5"
              />
              <span>
                {t('proposal.location.useSaved', {
                  defaultValue: 'Dit adres gebruiken',
                })}
                <br />
                <span className="text-gray-600">{view.savedAddressLine}</span>
              </span>
            </label>
          ) : null}
          <label className="flex items-start gap-2 text-xs text-gray-800">
            <input
              type="radio"
              checked={!useSaved}
              onChange={() => setUseSaved(false)}
              className="mt-0.5"
            />
            <span>
              {t('proposal.location.otherAddress', {
                defaultValue: 'Ander adres',
              })}
            </span>
          </label>
          {!useSaved ? (
            <DynamicAddressFields
              value={address}
              onChange={setAddress}
              required
              showCountrySelector={false}
            />
          ) : null}

          {!view.scheduleLockedFromProposal ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  {dateLabel}
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-700">
                  {timeLabel}
                </label>
                <input
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  placeholder="14:00–16:00"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  required
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-gray-600">
              {t('proposal.location.scheduleLocked', {
                defaultValue:
                  'Datum en tijd zijn al afgesproken en blijven ongewijzigd.',
              })}
            </p>
          )}

          {error ? (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div
            className="sticky bottom-0 z-10 -mx-2.5 -mb-2.5 mt-1 flex gap-2 border-t border-amber-100 bg-white/95 px-2.5 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-white/80"
            data-hc-location-sticky-cta=""
          >
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              data-hc-location-submit=""
            >
              {busy ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                t('proposal.location.saveCta', {
                  defaultValue: 'Locatie bevestigen',
                })
              )}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700"
            >
              {t('common.close', { defaultValue: 'Sluiten' })}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
