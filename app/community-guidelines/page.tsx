'use client';

import { Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { PolicyPageFooterLinks } from '@/components/legal/PolicyAgreementLinks';

function PolicyPageShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 py-10 sm:py-12">{children}</div>;
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}

export default function CommunityGuidelinesPage() {
  const { t } = useTranslation();

  return (
    <PolicyPageShell>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <header
            className="px-6 sm:px-8 py-10 sm:py-12 text-white"
            style={{
              background: 'linear-gradient(135deg, #0067B1 0%, #006D52 100%)',
            }}
          >
            <div className="flex items-start gap-4">
              <Users className="w-12 h-12 shrink-0" aria-hidden />
              <div>
                <h1 className="text-3xl font-bold">{t('communityGuidelinesPage.title')}</h1>
                <p className="mt-2 text-white/90 text-lg">{t('communityGuidelinesPage.subtitle')}</p>
              </div>
            </div>
          </header>

          <div className="px-6 sm:px-8 py-10 sm:py-12 space-y-8 text-gray-700">
            <p className="text-sm text-gray-500">
              <strong>{t('communityGuidelinesPage.lastUpdated')}:</strong>{' '}
              {t('communityGuidelinesPage.lastUpdatedDate')}
            </p>

            <PolicySection title={t('communityGuidelinesPage.respectTitle')}>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('communityGuidelinesPage.respect1')}</li>
                <li>{t('communityGuidelinesPage.respect2')}</li>
                <li>{t('communityGuidelinesPage.respect3')}</li>
              </ul>
            </PolicySection>

            <PolicySection title={t('communityGuidelinesPage.contentTitle')}>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('communityGuidelinesPage.content1')}</li>
                <li>{t('communityGuidelinesPage.content2')}</li>
                <li>{t('communityGuidelinesPage.content3')}</li>
              </ul>
            </PolicySection>

            <PolicySection title={t('communityGuidelinesPage.commerceTitle')}>
              <p>{t('communityGuidelinesPage.commerceBody')}</p>
            </PolicySection>

            <PolicySection title={t('communityGuidelinesPage.safetyTitle')}>
              <p>{t('communityGuidelinesPage.safetyBody')}</p>
            </PolicySection>

            <div className="border-t border-gray-200 pt-8 space-y-4">
              <PolicyPageFooterLinks />
              <p className="text-sm text-gray-500 text-center">{t('communityGuidelinesPage.footerNote')}</p>
            </div>
          </div>
        </div>
      </article>
    </PolicyPageShell>
  );
}