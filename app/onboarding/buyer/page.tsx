'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto">
      <section className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">
          {t('onboardingBranch.buyerStep')}
        </p>
        <h1 className="text-2xl font-bold mb-2">{t('onboardingBranch.buyerTitle')}</h1>
        <p className="text-gray-600 mb-6">{t('onboardingBranch.buyerSubtitle')}</p>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => router.push('/onboarding/seller')}
            className="text-left p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">{t('onboardingBranch.earnTitle')}</p>
            <p className="text-sm text-gray-600">{t('onboardingBranch.earnSubtitle')}</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/dorpsplein')}
            className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <p className="font-semibold text-gray-900">{t('onboardingBranch.discoverTitle')}</p>
            <p className="text-sm text-gray-600">{t('onboardingBranch.discoverSubtitle')}</p>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => router.push('/')}>{t('onboardingBranch.skip')}</Button>
        </div>
      </section>
    </main>
  );
}
