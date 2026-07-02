'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import MakerContactSettings from '@/components/profile/MakerContactSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

export default function OnboardingContactPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const goNext = () => {
    trackOnboardingEvent('ONBOARDING_STEP_COMPLETED', { surface: 'contact' });
    router.push('/onboarding/payments');
  };

  const onSkip = () => {
    trackOnboardingEvent('ONBOARDING_STEP_SKIPPED', { surface: 'contact' });
    router.push('/onboarding/payments');
  };

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">
          {t('onboardingFlow.contactStep') || 'Stap 3 van 4'}
        </p>
        <h1 className="text-2xl font-bold mb-2">
          {t('onboardingFlow.contactTitle') || 'Hoe kunnen mensen je bereiken?'}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('onboardingFlow.contactSubtitle') ||
            'Optioneel — je kunt dit later instellen onder Bereikbaarheid.'}
        </p>

        <MakerContactSettings />

        <div className="mt-6 flex justify-between gap-3">
          <Button type="button" variant="outline" onClick={onSkip}>
            {t('onboardingFlow.skip') || 'Overslaan'}
          </Button>
          <Button type="button" onClick={goNext}>
            {t('onboardingFlow.continue') || 'Volgende'}
          </Button>
        </div>
      </section>
    </main>
  );
}
