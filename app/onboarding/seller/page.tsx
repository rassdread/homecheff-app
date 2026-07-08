'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { openCreateFlow } = useCreateFlow();
  const { t } = useTranslation();

  return (
    <main className="min-h-screen p-4 max-w-3xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl p-6 shadow border border-gray-200">
        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-2">
          {t('onboardingBranch.sellerStep')}
        </p>
        <h1 className="text-2xl font-bold mb-2">{t('onboardingBranch.sellerTitle')}</h1>
        <p className="text-gray-600 mb-6">{t('onboardingBranch.sellerSubtitle')}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push('/sell/new?category=CHEFF')}
            className="text-left p-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">{t('onboardingBranch.categoryFood')}</p>
            <p className="text-sm text-gray-600">{t('onboardingBranch.categoryFoodDesc')}</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/sell/new?category=GARDEN')}
            className="text-left p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">{t('onboardingBranch.categoryGarden')}</p>
            <p className="text-sm text-gray-600">{t('onboardingBranch.categoryGardenDesc')}</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/sell/new?category=DESIGNER')}
            className="text-left p-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">{t('onboardingBranch.categoryCreations')}</p>
            <p className="text-sm text-gray-600">{t('onboardingBranch.categoryCreationsDesc')}</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/sell')}
            className="text-left p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <p className="font-semibold text-gray-900">{t('onboardingBranch.categoryServices')}</p>
            <p className="text-sm text-gray-600">{t('onboardingBranch.categoryServicesDesc')}</p>
          </button>
        </div>

        <div className="mt-6 flex justify-between">
          <Button onClick={() => router.push('/onboarding/buyer')} variant="outline">
            {t('onboardingBranch.prev')}
          </Button>
          <Button type="button" onClick={openCreateFlow}>
            {t('onboardingBranch.nextSell')}
          </Button>
        </div>
      </section>
    </main>
  );
}
