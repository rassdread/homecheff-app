'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  courierAcceptanceRemainingMs,
  courierStatusCopy,
  formatCourierCountdown,
  type CourierCheckoutKind,
} from '@/lib/delivery/checkout-courier-status';

export default function CourierAcceptanceStatus({
  kind,
  locale,
  expiresAt,
  serverNow,
  syncedAt,
  paymentRemainingMs,
  switching,
  onSwitchCourier,
}: {
  kind: CourierCheckoutKind;
  locale: string;
  expiresAt: string | null;
  serverNow: string | null;
  syncedAt: number | null;
  paymentRemainingMs: number | null;
  switching?: boolean;
  onSwitchCourier?: () => void;
}) {
  const copy = courierStatusCopy(locale);
  const [now, setNow] = useState(() => Date.now());
  const [paymentBase, setPaymentBase] = useState(paymentRemainingMs);
  const [paymentSyncedAt, setPaymentSyncedAt] = useState(() => Date.now());

  useEffect(() => {
    setPaymentBase(paymentRemainingMs);
    setPaymentSyncedAt(Date.now());
  }, [paymentRemainingMs]);

  useEffect(() => {
    if (kind !== 'waiting' && kind !== 'accepted') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [kind]);

  if (kind === 'hidden') return null;

  const responseRemaining =
    kind === 'waiting'
      ? courierAcceptanceRemainingMs({
          expiresAt,
          serverNow,
          clientNow: now,
          clientNowAtServerSync: syncedAt,
        })
      : null;

  const shell =
    kind === 'accepted'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : kind === 'waiting'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-amber-200 bg-white text-amber-950';

  const body =
    kind === 'waiting'
      ? copy.waiting
      : kind === 'accepted'
        ? copy.accepted
        : kind === 'rejected'
          ? copy.rejected
          : kind === 'courier_expired'
            ? copy.expired
            : kind === 'payment_expired'
              ? copy.paymentExpired
              : copy.stockExpired;

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${shell}`} role="status">
      {kind === 'waiting' ? (
        <p className="font-semibold">{copy.waitingTitle}</p>
      ) : null}
      <p className={kind === 'accepted' ? 'font-medium' : undefined}>{body}</p>
      {kind === 'waiting' ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-amber-800/80">{copy.responseLabel}</p>
            <p className="font-mono text-2xl font-semibold tabular-nums leading-none">
              {formatCourierCountdown(responseRemaining)}
            </p>
            <p className="mt-1 text-xs text-amber-900/80">{copy.waitingHint}</p>
          </div>
          {onSwitchCourier ? (
            <button
              type="button"
              disabled={switching}
              onClick={onSwitchCourier}
              className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 disabled:opacity-60"
            >
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.switchCourier}
            </button>
          ) : null}
        </div>
      ) : null}
      {kind === 'accepted' && paymentBase != null ? (
        <p className="mt-2 text-xs text-emerald-900">
          {copy.paymentLabel}:{' '}
          {formatCourierCountdown(Math.max(0, paymentBase - (now - paymentSyncedAt)))}
        </p>
      ) : null}
    </div>
  );
}
