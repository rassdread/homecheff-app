'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, ExternalLink, CreditCard, Clock } from 'lucide-react';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';
import { connectCtaModelForStatus } from '@/lib/stripe/connect-account-status';
import type { ConnectTrack } from '@/lib/stripe/connect-tracks';
import ConnectTrackSelector from '@/components/seller/ConnectTrackSelector';

export default function StripeConnectSetup() {
  const [uiStatus, setUiStatus] = useState<HomecheffConnectUiStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [connectTrack, setConnectTrack] = useState<ConnectTrack | null>(null);
  const [recoveryEligible, setRecoveryEligible] = useState(false);
  const [configurationMismatch, setConfigurationMismatch] = useState(false);
  const [dualTrackEnabled, setDualTrackEnabled] = useState(true);
  const [entryTitle, setEntryTitle] = useState<string | null>(null);
  const [entryBody, setEntryBody] = useState<string | null>(null);

  useEffect(() => {
    void checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/stripe/connect/onboard?ts=${Date.now()}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setUiStatus(
          (data.uiStatus as HomecheffConnectUiStatus) ||
            (data.isCompleted || data.paymentReady
              ? 'PAYMENT_READY'
              : data.hasAccount
                ? 'INCOMPLETE'
                : 'NOT_STARTED')
        );
        setConnectTrack(
          data.connectTrack === 'PARTICULAR' || data.connectTrack === 'BUSINESS'
            ? data.connectTrack
            : null,
        );
        setDualTrackEnabled(data.dualTrackEnabled !== false);
        setRecoveryEligible(Boolean(data.recoveryEligible));
        setConfigurationMismatch(Boolean(data.configurationMismatch));
        setEntryTitle(data.cta?.titleNl || null);
        setEntryBody(data.cta?.bodyNl || null);
        const migrationClass = data.migrationClass as string | undefined;
        setShowTrackPicker(
          Boolean(
            data.dualTrackEnabled !== false &&
              (data.needsTrackSelection ||
                data.recoveryEligible ||
                data.configurationMismatch ||
                data.entryState === 'CHOOSE_TRACK' ||
                data.entryState === 'RECOVER_MISMATCH' ||
                migrationClass === 'USER_CONFIRMATION_REQUIRED' ||
                migrationClass === 'NEW_ACCOUNT_CHOICE'),
          ),
        );
      }
    } catch (err) {
      console.error('Error checking Stripe status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const startOnboarding = async (track?: ConnectTrack, forceReplace?: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await startStripeConnectOnboarding({
        returnPath: '/settings?tab=payments',
        track: track || connectTrack || undefined,
        forceReplace,
      });
      if (result.needsTrackSelection) {
        setShowTrackPicker(true);
        setError(result.error || 'Kies particulier of bedrijf om verder te gaan.');
        return;
      }
      if (!result.ok) {
        setError(result.error || 'Er is een probleem opgetreden. Probeer het later opnieuw.');
        await checkStatus();
      } else if (!result.redirected) {
        await checkStatus();
      }
    } catch {
      setError('Er is een probleem opgetreden. Probeer het later opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  if (statusLoading && !uiStatus) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
        Status laden…
      </div>
    );
  }

  if (uiStatus === 'PAYMENT_READY' && !configurationMismatch) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Betaalaccount gereed</h3>
            <p className="text-green-600">
              Je betaalaccount is gereed om betalingen via HomeCheff te ontvangen
              {connectTrack === 'PARTICULAR'
                ? ' (particulier).'
                : connectTrack === 'BUSINESS'
                  ? ' (bedrijf).'
                  : '.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showTrackPicker && dualTrackEnabled) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        {configurationMismatch && (entryTitle || entryBody) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              {entryTitle || 'Je betaalaccount moet opnieuw worden ingesteld'}
            </p>
            {entryBody && (
              <p className="mt-1 text-sm text-amber-900">{entryBody}</p>
            )}
          </div>
        )}
        <ConnectTrackSelector
          recoveryMode={recoveryEligible || configurationMismatch}
          mismatchMode={configurationMismatch}
          loading={isLoading}
          error={error}
          onSelect={async (track) => {
            setConnectTrack(track);
            await startOnboarding(
              track,
              (recoveryEligible || configurationMismatch) &&
                track === 'PARTICULAR',
            );
          }}
        />
      </div>
    );
  }

  if (uiStatus === 'PENDING_VERIFICATION') {
    const model = connectCtaModelForStatus('PENDING_VERIFICATION');
    return (
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-6">
        <div className="flex items-start">
          <Clock className="h-6 w-6 text-sky-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-sky-800">{model.titleNl}</h3>
            <p className="text-sky-700 mt-1">{model.bodyNl}</p>
            {connectTrack && (
              <p className="mt-2 text-xs font-medium text-sky-800">
                Track: {connectTrack === 'PARTICULAR' ? 'Particulier' : 'Bedrijf'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const model = connectCtaModelForStatus(uiStatus || 'NOT_STARTED');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <CreditCard className="h-8 w-8 text-blue-600" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{model.titleNl}</h3>
          <p className="text-gray-600 mb-4">{model.bodyNl}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {model.showOnboardingCta && (
            <Button
              onClick={() => {
                if (dualTrackEnabled && !connectTrack) {
                  setShowTrackPicker(true);
                  return;
                }
                void startOnboarding(connectTrack || undefined);
              }}
              disabled={isLoading}
              className="inline-flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Bezig met laden...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {model.ctaLabelNl}
                </>
              )}
            </Button>
          )}

          {recoveryEligible && (
            <button
              type="button"
              className="mt-3 block text-sm text-emerald-800 underline"
              onClick={() => setShowTrackPicker(true)}
            >
              Particulier betaalprofiel opnieuw instellen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
