'use client';

import Link from 'next/link';
import { ShieldAlert, Mail } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { PolicyPageFooterLinks } from '@/components/legal/PolicyAgreementLinks';
import { SAFETY_SUPPORT_EMAIL } from '@/lib/legal/policy-urls';

export default function SafetyPage() {
  const { t } = useTranslation();

  return (
    <PolicyPageShell>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <header
            className="px-6 sm:px-8 py-10 sm:py-12 text-white"
            style={{
              background: 'linear-gradient(135deg, #006D52 0%, #0067B1 100%)',
            }}
          >
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-12 h-12 shrink-0" aria-hidden />
              <div>
                <h1 className="text-3xl font-bold">{t('safetyPage.title')}</h1>
                <p className="mt-2 text-white/90 text-lg">{t('safetyPage.subtitle')}</p>
              </div>
            </div>
          </header>

          <div className="px-6 sm:px-8 py-10 sm:py-12 space-y-8 text-gray-700">
            <p className="text-sm text-gray-500">
              <strong>{t('safetyPage.lastUpdated')}:</strong> {t('safetyPage.lastUpdatedDate')}
            </p>

            <PolicySection title={t('safetyPage.zeroToleranceTitle')}>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('safetyPage.zeroToleranceCsam')}</li>
                <li>{t('safetyPage.zeroToleranceMinors')}</li>
              </ul>
            </PolicySection>

            <PolicySection title={t('safetyPage.reportingTitle')}>
              <p>{t('safetyPage.reportingIntro')}</p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>{t('safetyPage.reportingContent')}</li>
                <li>{t('safetyPage.reportingMessages')}</li>
                <li>{t('safetyPage.reportingProfiles')}</li>
                <li>{t('safetyPage.reportingListings')}</li>
              </ul>
              <p className="mt-3">{t('safetyPage.reportingInApp')}</p>
            </PolicySection>

            <PolicySection title={t('safetyPage.enforcementTitle')}>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('safetyPage.enforcementReview')}</li>
                <li>{t('safetyPage.enforcementRemove')}</li>
                <li>{t('safetyPage.enforcementSuspend')}</li>
                <li>{t('safetyPage.enforcementAuthorities')}</li>
              </ul>
            </PolicySection>

            <PolicySection title={t('safetyPage.communityTitle')}>
              <p>{t('safetyPage.communityBody')}</p>
            </PolicySection>

            <PolicySection title={t('safetyPage.contactTitle')}>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="mb-3">{t('safetyPage.contactIntro')}</p>
                <p className="flex items-center gap-2 font-medium text-[#006D52]">
                  <Mail className="h-5 w-5 shrink-0" aria-hidden />
                  <a href={`mailto:${SAFETY_SUPPORT_EMAIL}`} className="hover:underline">
                    {SAFETY_SUPPORT_EMAIL}
                  </a>
                </p>
                <p className="mt-3 text-sm text-gray-600">
                  {t('safetyPage.contactUrgent')}{' '}
                  <Link href="/contact" className="text-[#0067B1] hover:underline font-medium">
                    {t('safetyPage.contactFormLink')}
                  </Link>
                </p>
              </div>
            </PolicySection>

            <div className="border-t border-gray-200 pt-8 space-y-4">
              <PolicyPageFooterLinks />
              <p className="text-sm text-gray-500 text-center">{t('safetyPage.footerNote')}</p>
            </div>
          </div>
        </div>
      </article>
    </PolicyPageShell>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}

function PolicyPageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 py-10 sm:py-12">{children}</div>;
}
