'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

/** Same sections as the signup agreement modal. No new legal text. */
export default function DeliveryAgreementView() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-emerald-800">
        <Link href="/delivery/dashboard" className="font-semibold hover:underline">
          Terug naar je bezorgomgeving
        </Link>
      </p>
      <h1 id="bezorgerovereenkomst" className="mt-4 text-2xl font-bold text-gray-900">
        {t('deliverySignup.legalModalTitle')}
      </h1>
      <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">{t('deliverySignup.generalTerms')}</h2>
          <p>
            {t('deliverySignup.generalTermsText')}{' '}
            <Link href="/terms" className="text-emerald-700 underline">
              /terms
            </Link>
            .
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">{t('deliverySignup.privacyPolicy')}</h2>
          <p>
            {t('deliverySignup.privacyPolicyText')}{' '}
            <Link href="/privacy" className="text-emerald-700 underline">
              /privacy
            </Link>
            .
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">{t('deliverySignup.liability')}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('deliverySignup.liability1')}</li>
            <li>{t('deliverySignup.liability2')}</li>
            <li>{t('deliverySignup.liability3')}</li>
            <li>{t('deliverySignup.liability4')}</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">{t('deliverySignup.insurance')}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('deliverySignup.insurance1')}</li>
            <li>{t('deliverySignup.insurance2')}</li>
            <li>{t('deliverySignup.insurance3')}</li>
            <li>{t('deliverySignup.insurance4')}</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">{t('deliverySignup.taxes')}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('deliverySignup.taxes1')}</li>
            <li>{t('deliverySignup.taxes2')}</li>
            <li>{t('deliverySignup.taxes3')}</li>
            <li>{t('deliverySignup.taxes4')}</li>
            <li>{t('deliverySignup.taxes5')}</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-gray-900">{t('deliverySignup.platformRules')}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('deliverySignup.platformRules1')}</li>
            <li>{t('deliverySignup.platformRules2')}</li>
            <li>{t('deliverySignup.platformRules3')}</li>
            <li>{t('deliverySignup.platformRules4')}</li>
            <li>{t('deliverySignup.platformRules5')}</li>
          </ul>
        </section>
        <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="mb-2 font-semibold text-yellow-900">{t('deliverySignup.importantNote')}</h2>
          <p className="text-yellow-800">{t('deliverySignup.importantNoteText')}</p>
        </section>
      </div>
    </main>
  );
}
