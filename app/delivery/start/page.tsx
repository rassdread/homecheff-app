'use client';

import Link from 'next/link';
import { Bike, Building2, UserRound } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import EcosystemShareAction from '@/components/share/EcosystemShareAction';

/**
 * Delivery onboarding chooser — individual / company / driver-for-company.
 */
export default function DeliveryStartPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/80 to-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {t('verdienHub.cards.delivery.title')}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('deliveryStart.title')}
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">{t('deliveryStart.subtitle')}</p>
          <p className="text-xs text-gray-500 sm:text-sm">{t('deliveryStart.ageNote')}</p>
        </header>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <Link
              href="/delivery/signup"
              className="flex items-start gap-4 transition hover:opacity-90"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Bike className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold text-gray-900">
                  {t('deliveryStart.individualTitle')}
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  {t('deliveryStart.individualBody')}
                </span>
              </span>
            </Link>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <EcosystemShareAction
                destinationHref="/delivery/signup"
                title={t('verdienHub.cards.delivery.title')}
                text={t('verdienHub.shareCopy.delivery_individual')}
                surface="delivery_start"
                product="delivery"
                opportunityId="delivery_individual"
                labelKey="verdienHub.cards.delivery.share"
                variant="text"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <Link
              href="/delivery/company/signup"
              className="flex items-start gap-4 transition hover:opacity-90"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Building2 className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold text-gray-900">
                  {t('deliveryStart.companyTitle')}
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  {t('deliveryStart.companyBody')}
                </span>
              </span>
            </Link>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <EcosystemShareAction
                destinationHref="/delivery/company/signup"
                title={t('verdienHub.cards.deliveryCompany.title')}
                text={t('verdienHub.shareCopy.delivery_company')}
                surface="delivery_start"
                product="delivery"
                opportunityId="delivery_company"
                labelKey="verdienHub.cards.deliveryCompany.share"
                variant="text"
              />
            </div>
          </div>

          <Link
            href="/delivery/invite"
            className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <UserRound className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-gray-900">
                {t('deliveryStart.driverTitle')}
              </span>
              <span className="mt-1 block text-sm text-gray-600">
                {t('deliveryStart.driverBody')}
              </span>
            </span>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-500">
          {t('deliveryStart.alreadyPartner')}{' '}
          <Link href="/delivery/dashboard" className="font-medium text-emerald-700 underline">
            {t('deliveryStart.goDashboard')}
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link href="/werken-bij" className="font-medium text-emerald-700 hover:underline">
            {t('verdienHub.title')}
          </Link>
        </p>
      </div>
    </div>
  );
}
