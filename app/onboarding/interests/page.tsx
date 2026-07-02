'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

const INTEREST_OPTIONS = [
  { id: 'Koken', labelKey: 'onboardingFlow.interestCooking', fallback: 'Koken' },
  { id: 'Tuinieren', labelKey: 'onboardingFlow.interestGardening', fallback: 'Tuinieren' },
  { id: 'Creatief', labelKey: 'onboardingFlow.interestCreative', fallback: 'Creatief' },
  { id: 'Hulp & Klusjes', labelKey: 'onboardingFlow.interestHelp', fallback: 'Hulp & Klusjes' },
  { id: 'Bezorging', labelKey: 'onboardingFlow.interestDelivery', fallback: 'Bezorging' },
] as const;

export default function OnboardingInterestsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onContinue = async () => {
    setSaving(true);
    try {
      if (selected.length > 0) {
        await fetch('/api/profile/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interests: selected }),
        });
      }
      trackOnboardingEvent('ONBOARDING_STEP_COMPLETED', { surface: 'interests' });
      router.push('/onboarding/contact');
    } finally {
      setSaving(false);
    }
  };

  const onSkip = () => {
    trackOnboardingEvent('ONBOARDING_STEP_SKIPPED', { surface: 'interests' });
    router.push('/onboarding/contact');
  };

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto">
      <section className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">
          {t('onboardingFlow.interestsStep') || 'Stap 2 van 4'}
        </p>
        <h1 className="text-2xl font-bold mb-2">
          {t('onboardingFlow.interestsTitle') || 'Waar ben je in geïnteresseerd?'}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('onboardingFlow.interestsSubtitle') ||
            'Kies één of meer. Je kunt dit later aanpassen in je profiel.'}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {INTEREST_OPTIONS.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold text-gray-900">
                  {t(opt.labelKey) || opt.fallback}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-between gap-3">
          <Button type="button" variant="outline" onClick={onSkip} disabled={saving}>
            {t('onboardingFlow.skip') || 'Overslaan'}
          </Button>
          <Button type="button" onClick={onContinue} disabled={saving}>
            {t('onboardingFlow.continue') || 'Volgende'}
          </Button>
        </div>
      </section>
    </main>
  );
}
