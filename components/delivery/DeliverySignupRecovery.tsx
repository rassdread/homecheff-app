'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { readSignupStep } from '@/lib/delivery/delivery-signup-draft';

export function useSignupStepHistory(
  step: number,
  setStep: (next: number) => void,
  maxStep: number,
  ready: boolean,
  normalize?: (step: number) => number,
) {
  const skipPush = useRef(false);
  const normalizeRef = useRef(normalize);
  normalizeRef.current = normalize;

  useEffect(() => {
    if (!ready) return;
    const onPop = () => {
      const next = readSignupStep(window.location.search, maxStep);
      if (next == null) return;
      const visible = normalizeRef.current ? normalizeRef.current(next) : next;
      if (visible !== next) {
        const url = new URL(window.location.href);
        url.searchParams.set('step', String(visible));
        window.history.replaceState({ hcSignupStep: visible }, '', url);
      }
      skipPush.current = true;
      setStep(visible);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [ready, maxStep, setStep]);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    const url = new URL(window.location.href);
    const current = readSignupStep(url.search, maxStep);
    url.searchParams.set('step', String(step));
    if (current == null) {
      window.history.replaceState({ hcSignupStep: step }, '', url);
      return;
    }
    if (current !== step) {
      window.history.pushState({ hcSignupStep: step }, '', url);
    }
  }, [step, ready, maxStep]);
}

export function DeliverySignupRecovery({
  canRestart,
  leaveOpen,
  restartOpen,
  onAskLeave,
  onAskRestart,
  onDismiss,
  onSaveAndLeave,
  onDiscardAndLeave,
  onConfirmRestart,
}: {
  canRestart: boolean;
  leaveOpen: boolean;
  restartOpen: boolean;
  onAskLeave: () => void;
  onAskRestart: () => void;
  onDismiss: () => void;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onConfirmRestart: () => void;
}) {
  const { tOr } = useTranslation();
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onAskLeave}
          className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-900"
        >
          {tOr('deliverySignup.continueLater', 'Continue later', 'Later verder')}
        </button>
        {canRestart ? (
          <button
            type="button"
            onClick={onAskRestart}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-gray-700 underline"
          >
            {tOr('deliverySignup.startOver', 'Start over', 'Opnieuw beginnen')}
          </button>
        ) : null}
      </div>

      {leaveOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true">
            <h2 className="text-lg font-semibold text-gray-900">
              {tOr('deliverySignup.leaveTitle', 'Leave this signup', 'Aanmelding sluiten')}
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              {tOr(
                'deliverySignup.leaveBody',
                'Saving keeps what you filled in on this device. You return to HomeCheff and are not sent straight back into this signup.',
                'Opslaan bewaart wat je hebt ingevuld op dit apparaat. Je gaat terug naar HomeCheff en komt niet meteen weer in deze aanmelding.',
              )}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={onSaveAndLeave}
                className="min-h-11 rounded-lg bg-primary-brand px-4 text-sm font-semibold text-white"
              >
                {tOr('deliverySignup.saveAndClose', 'Save and close', 'Opslaan en sluiten')}
              </button>
              <button
                type="button"
                onClick={onDiscardAndLeave}
                className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-900"
              >
                {tOr('deliverySignup.discardChanges', 'Discard changes', 'Wijzigingen verwerpen')}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="min-h-11 rounded-lg px-4 text-sm font-semibold text-gray-700"
              >
                {tOr('deliverySignup.stay', 'Stay', 'Terug naar de aanmelding')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {restartOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true">
            <h2 className="text-lg font-semibold text-gray-900">
              {tOr('deliverySignup.restartTitle', 'Start this signup over', 'Deze aanmelding opnieuw beginnen')}
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              {tOr(
                'deliverySignup.restartBody',
                'This clears only what you filled in for this delivery signup and have not finished. Your account, payments, seller profile, orders and agreements you already accepted stay. An active courier stays active.',
                'Dit wist alleen wat je in deze bezorgaanmelding hebt ingevuld en nog niet hebt afgerond. Je account, betalingen, verkopersprofiel, opdrachten en eerder geaccepteerde afspraken blijven bestaan. Een bezorger die al actief is, blijft actief.',
              )}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={onConfirmRestart}
                className="min-h-11 rounded-lg bg-primary-brand px-4 text-sm font-semibold text-white"
              >
                {tOr('deliverySignup.confirmRestart', 'Clear this draft', 'Concept wissen')}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-900"
              >
                {tOr('deliverySignup.stay', 'Stay', 'Terug naar de aanmelding')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
