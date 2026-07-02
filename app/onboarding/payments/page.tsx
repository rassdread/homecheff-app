'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

export default function OnboardingPaymentsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const finish = (skipped: boolean) => {
    trackOnboardingEvent(skipped ? 'ONBOARDING_STEP_SKIPPED' : 'ONBOARDING_STEP_COMPLETED', {
      surface: 'payments',
    });
    trackOnboardingEvent('ONBOARDING_COMPLETED', { surface: 'payments_optional' });
    router.push('/onboarding/buyer');
  };

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto">
      <section className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">
          {t('onboardingFlow.paymentsStep') || 'Stap 4 van 4'}
        </p>
        <h1 className="text-2xl font-bold mb-2">
          {t('onboardingFlow.paymentsTitle') || 'Betalingen instellen'}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('onboardingFlow.paymentsSubtitle') ||
            'Optioneel — nodig als je wilt verkopen en uitbetalingen ontvangt.'}
        </p>

        <Link
          href="/settings?tab=payments"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {t('onboardingFlow.setupPayments') || 'Betalingen instellen'}
        </Link>

        <div className="mt-6 flex justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => finish(true)}>
            {t('onboardingFlow.skip') || 'Overslaan'}
          </Button>
          <Button type="button" onClick={() => finish(false)}>
            {t('onboardingFlow.finish') || 'Afronden'}
          </Button>
        </div>
      </section>
    </main>
  );
}
