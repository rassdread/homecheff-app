'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { consumeStripeConnectReturnPath } from '@/lib/stripe/stripe-connect-return-path';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

type ViewState = 'loading' | HomecheffConnectUiStatus | 'error';

export default function StripeConnectSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState<ViewState>('loading');
  const [returnPath, setReturnPath] = useState('/mijn-homecheff');
  const [ctaLoading, setCtaLoading] = useState(false);

  useEffect(() => {
    setReturnPath(consumeStripeConnectReturnPath('/mijn-homecheff'));

    const checkStatus = async () => {
      try {
        // Cache-bust so we never show a stale onboard CTA after return
        const response = await fetch(`/api/stripe/connect/onboard?ts=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await response.json();
        if (!response.ok) {
          setStatus('error');
          return;
        }
        const ui = (data.uiStatus as HomecheffConnectUiStatus) || (
          data.isCompleted || data.paymentReady ? 'PAYMENT_READY' : 'INCOMPLETE'
        );
        setStatus(ui);

        // Soft-refresh client routers so sidebar/action-center refetch
        try {
          router.refresh();
        } catch {
          /* ignore */
        }
      } catch {
        setStatus('error');
      }
    };

    void checkStatus();
  }, [router]);

  const continueHref = () => {
    if (returnPath.startsWith('/sell')) return returnPath;
    if (returnPath.startsWith('/product/')) return returnPath;
    if (returnPath.startsWith('/verkoper')) return returnPath;
    if (returnPath.startsWith('/profile')) return returnPath;
    if (returnPath.startsWith('/mijn-homecheff')) return returnPath;
    return '/mijn-homecheff';
  };

  const resumeOnboarding = async () => {
    setCtaLoading(true);
    try {
      await startStripeConnectOnboarding({ returnPath: continueHref() });
    } finally {
      setCtaLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Je betaalaccount wordt gecontroleerd…</p>
        </div>
      </div>
    );
  }

  const ready = status === 'PAYMENT_READY';
  const pending = status === 'PENDING_VERIFICATION';
  const actionNeeded =
    status === 'ACTION_REQUIRED' ||
    status === 'RESTRICTED' ||
    status === 'INCOMPLETE' ||
    status === 'NOT_STARTED';

  let icon = <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />;
  let title = 'Je betaalaccount';
  let body = 'We konden de status niet bepalen. Probeer het opnieuw.';
  let primaryLabel = 'Ga naar Mijn HomeCheff';
  let primaryAction = () => router.push(continueHref());

  if (ready) {
    icon = <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />;
    title = 'Je betaalaccount is klaar';
    body =
      'Welkom bij HomeCheff. Je Stripe-betaalaccount is succesvol gekoppeld aan je HomeCheff-account. Je kunt nu betalingen via HomeCheff ontvangen.';
    primaryLabel = returnPath.startsWith('/sell')
      ? 'Ga verder met je aanbod'
      : 'Ga naar Mijn HomeCheff';
  } else if (pending) {
    icon = <Clock className="h-16 w-16 text-sky-600 mx-auto mb-4" />;
    title = 'Je gegevens zijn ontvangen';
    body =
      'Stripe controleert je betaalaccount. Je hoeft nu niets opnieuw in te vullen. Je kunt alvast verder in HomeCheff.';
    primaryLabel = 'Ga naar Mijn HomeCheff';
  } else if (actionNeeded) {
    icon = <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />;
    title =
      status === 'ACTION_REQUIRED' || status === 'RESTRICTED'
        ? 'Actie nodig voor je betaalaccount'
        : 'Rond je betaalaccount af';
    body =
      status === 'ACTION_REQUIRED' || status === 'RESTRICTED'
        ? 'Stripe heeft nog extra gegevens nodig. Open je betaalaccount om verder te gaan.'
        : 'Je betaalaccount is nog niet helemaal klaar. Rond de stappen af om betalingen te kunnen ontvangen.';
    primaryLabel =
      status === 'ACTION_REQUIRED' || status === 'RESTRICTED'
        ? 'Actie nodig voor je betaalaccount'
        : 'Betaalaccount afronden';
    primaryAction = () => {
      void resumeOnboarding();
    };
  } else if (status === 'error') {
    icon = <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />;
    title = 'Statuscontrole mislukt';
    body = 'Er ging iets mis bij het controleren van je betaalaccount. Probeer het opnieuw.';
    primaryLabel = 'Opnieuw controleren';
    primaryAction = () => window.location.reload();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        {icon}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{title}</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">{body}</p>

        <Button
          onClick={primaryAction}
          disabled={ctaLoading}
          className="w-full inline-flex items-center justify-center min-h-[48px]"
        >
          {ctaLoading ? 'Bezig…' : primaryLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        {(ready || pending) && (
          <button
            type="button"
            onClick={() => router.push('/settings?tab=payments')}
            className="mt-4 text-sm font-medium text-slate-500 underline-offset-2 hover:underline"
          >
            Bekijk betaalaccount-status
          </button>
        )}
      </div>
    </div>
  );
}
