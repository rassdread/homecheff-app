'use client';

import { useCallback, useEffect, useState } from 'react';
import ConnectTrackSelector from '@/components/seller/ConnectTrackSelector';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';
import {
  connectPayoutBannerModel,
  type ConnectPayoutBannerModel,
} from '@/lib/stripe/connect-payout-banner';
import type { ConnectTrack } from '@/lib/stripe/connect-tracks';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';

export const CONNECT_PAYOUT_OPEN_EVENT = 'hc-connect-payout-open';

type StatusPayload = {
  hasAccount?: boolean;
  uiStatus?: HomecheffConnectUiStatus;
  canCreateOnboardingLink?: boolean;
  needsTrackSelection?: boolean;
  paymentReady?: boolean;
  isCompleted?: boolean;
  connectTrack?: string | null;
};

function readableError(error?: string): string {
  if (!error || error === 'TRACK_REQUIRED') {
    return 'Kies of je HomeCheff als particulier of als bedrijf gebruikt.';
  }
  return error;
}

export default function ConnectPayoutBanner({ returnPath }: { returnPath: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/stripe/connect/onboard?ts=${Date.now()}`, {
          cache: 'no-store',
        });
        const data = (await response.json().catch(() => null)) as StatusPayload | null;
        if (!cancelled && response.ok && data) setStatus(data);
      } catch {
        if (!cancelled) setStatus(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const model: ConnectPayoutBannerModel = connectPayoutBannerModel({
    hasAccount: Boolean(status?.hasAccount),
    uiStatus: status?.uiStatus ?? (status?.paymentReady || status?.isCompleted ? 'PAYMENT_READY' : 'NOT_STARTED'),
    canCreateOnboardingLink: status?.canCreateOnboardingLink,
    needsTrackSelection: status?.needsTrackSelection,
    paymentReady: Boolean(status?.paymentReady || status?.isCompleted),
    connectTrack: status?.connectTrack,
  });

  const launch = useCallback(
    async (track?: ConnectTrack) => {
      setLoading(true);
      setError(null);
      try {
        const result = await startStripeConnectOnboarding({
          returnPath,
          track,
        });
        if (result.needsTrackSelection) {
          setChoosing(true);
          setError(result.error ? readableError(result.error) : null);
          return;
        }
        if (!result.ok && !result.redirected) {
          setError(readableError(result.error));
        }
      } finally {
        setLoading(false);
      }
    },
    [returnPath],
  );

  const begin = useCallback(() => {
    if (model.askTrack) {
      setChoosing(true);
      setError(null);
      return;
    }
    void launch();
  }, [launch, model.askTrack]);

  useEffect(() => {
    const open = () => begin();
    window.addEventListener(CONNECT_PAYOUT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONNECT_PAYOUT_OPEN_EVENT, open);
  }, [begin]);

  if (!loaded) return null;

  if (model.presentation === 'payments') {
    return (
      <section id="connect-payout-banner" className="mt-4" aria-labelledby="connect-payout-payments">
        <h2 id="connect-payout-payments" className="text-sm font-semibold text-gray-800">
          Betalingen
        </h2>
        <p className="mt-1 text-sm text-gray-600">{model.paymentsLineNl}</p>
      </section>
    );
  }

  return (
    <section
      id="connect-payout-banner"
      className="mt-4 rounded-xl border-2 border-emerald-700 bg-emerald-50 px-4 py-4 text-emerald-950"
    >
      <h2 className="text-base font-semibold sm:text-lg">{model.titleNl}</h2>
      {model.bodyNl ? <p className="mt-1 text-sm leading-relaxed">{model.bodyNl}</p> : null}
      {choosing ? (
        <div className="mt-3 rounded-xl bg-white p-3 text-slate-900">
          <ConnectTrackSelector
            loading={loading}
            error={error}
            onSelect={(track) => launch(track)}
          />
        </div>
      ) : null}
      {model.actionLabelNl && !choosing ? (
        <button
          type="button"
          onClick={begin}
          disabled={loading}
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {loading ? 'Stripe wordt geopend…' : model.actionLabelNl}
        </button>
      ) : null}
      {error && !choosing ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}
    </section>
  );
}
