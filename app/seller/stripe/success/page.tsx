'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import {
  clearStripeConnectReturnPath,
  readStripeConnectReturnPath,
} from '@/lib/stripe/stripe-connect-return-path';
import { stripeIncompleteReturn } from '@/lib/stripe/stripe-return-actions';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

type ViewState = 'loading' | HomecheffConnectUiStatus | 'error';

export default function StripeConnectSuccess() {
  const router = useRouter();
  const { language } = useTranslation();
  const en = language === 'en';
  const [status, setStatus] = useState<ViewState>('loading');
  const [canCreateLink, setCanCreateLink] = useState(false);
  const [returnPath, setReturnPath] = useState('/mijn-homecheff');
  const [ctaLoading, setCtaLoading] = useState(false);
  const resumeLock = useRef(false);

  useEffect(() => {
    setReturnPath(readStripeConnectReturnPath('/mijn-homecheff'));

    const checkStatus = async () => {
      try {
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
        setCanCreateLink(Boolean(data.canCreateOnboardingLink));

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
    if (returnPath.startsWith('/settings')) return returnPath;
    return '/mijn-homecheff';
  };

  const resumeOnboarding = async () => {
    if (resumeLock.current) return;
    resumeLock.current = true;
    setCtaLoading(true);
    try {
      const result = await startStripeConnectOnboarding({
        returnPath: continueHref(),
      });
      if (!result.redirected) {
        resumeLock.current = false;
        setCtaLoading(false);
        if (result.statusOnly) window.location.reload();
      }
    } catch {
      resumeLock.current = false;
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
    canCreateLink &&
    (status === 'ACTION_REQUIRED' ||
      status === 'INCOMPLETE' ||
      status === 'NOT_STARTED' ||
      status === 'RESTRICTED');
  const restrictedWaiting =
    status === 'RESTRICTED' && !canCreateLink && !ready && !pending;

  let icon = <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />;
  let title = 'Je betaalaccount';
  let body = 'We konden de status niet bepalen. Probeer het opnieuw.';
  let primaryLabel = 'Ga naar Mijn HomeCheff';
  let primaryAction = () => router.push(continueHref());

  if (ready) {
    icon = <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />;
    title = 'Betaalaccount gereed';
    body =
      'Welkom bij HomeCheff. Je Stripe-betaalaccount is succesvol gekoppeld. Je kunt nu betalingen via HomeCheff ontvangen.';
    primaryLabel =
      returnPath.startsWith('/sell') || returnPath.startsWith('/product/')
        ? 'Ga verder met je aanbod'
        : 'Ga naar Mijn HomeCheff';
  } else if (pending || restrictedWaiting) {
    icon = <Clock className="h-16 w-16 text-sky-600 mx-auto mb-4" />;
    title = 'Verificatie wordt gecontroleerd';
    body =
      'Je gegevens zijn ingestuurd. Stripe controleert ze. Je hoeft ze niet opnieuw in te vullen. Je kunt alvast verder in HomeCheff.';
    primaryLabel =
      returnPath.startsWith('/sell') || returnPath.startsWith('/product/')
        ? 'Ga verder met je aanbod'
        : 'Ga naar Mijn HomeCheff';
  } else if (actionNeeded) {
    icon = <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />;
    title = en ? 'Payment account not finished' : 'Betaalaccount nog niet compleet';
    body = en
      ? 'Stripe still needs a few details before you can receive payments via HomeCheff.'
      : 'Stripe heeft nog enkele gegevens nodig voordat je betalingen via HomeCheff kunt ontvangen.';
    primaryLabel = en ? 'Finish your details' : 'Gegevens afronden';
    primaryAction = () => {
      void resumeOnboarding();
    };
  } else if (status === 'error') {
    icon = <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />;
    title = 'Statuscontrole mislukt';
    body =
      'Er ging iets mis bij het controleren van je betaalaccount. Probeer het opnieuw.';
    primaryLabel = 'Opnieuw controleren';
    primaryAction = () => window.location.reload();
  }

  const incomplete = stripeIncompleteReturn({
    uiStatus: status,
    canCreateLink,
    returnPath,
  });

  const leaveSetup = () => {
    const path = incomplete.leavePath;
    clearStripeConnectReturnPath();
    router.push(path);
  };

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
          {ctaLoading ? (en ? 'Opening Stripe…' : 'Stripe wordt geopend…') : primaryLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        {incomplete.showResume ? (
          <button
            type="button"
            onClick={leaveSetup}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800"
          >
            {en ? incomplete.leaveLabelEn : incomplete.leaveLabelNl}
          </button>
        ) : null}

        {(ready || pending || restrictedWaiting) && (
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
