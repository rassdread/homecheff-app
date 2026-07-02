'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Shield, Trash2, Smartphone } from 'lucide-react';
import Logo from '@/components/Logo';
import { useTranslation } from '@/hooks/useTranslation';

export default function DeleteAccountPublicContent() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center text-emerald-700 hover:text-emerald-800 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Logo size="md" />
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-6 sm:p-8 space-y-8">
          <header className="space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t('deleteAccountPage.title')}
            </h1>
            <p className="text-slate-600 leading-relaxed">{t('deleteAccountPage.intro')}</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              {t('deleteAccountPage.inAppTitle')}
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 leading-relaxed pl-1">
              <li>{t('deleteAccountPage.inAppStep1')}</li>
              <li>{t('deleteAccountPage.inAppStep2')}</li>
              <li>{t('deleteAccountPage.inAppStep3')}</li>
              <li>{t('deleteAccountPage.inAppStep4')}</li>
            </ol>
            <Link
              href="/settings?tab=privacy&accountTab=delete"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t('deleteAccountPage.inAppCta')}
            </Link>
            <p className="text-xs text-slate-500">{t('deleteAccountPage.inAppLoginHint')}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              {t('deleteAccountPage.whatHappensTitle')}
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• {t('deleteAccountPage.deletedImmediate1')}</li>
              <li>• {t('deleteAccountPage.deletedImmediate2')}</li>
              <li>• {t('deleteAccountPage.deletedImmediate3')}</li>
              <li>• {t('deleteAccountPage.deletedImmediate4')}</li>
            </ul>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <h2 className="text-base font-semibold text-amber-950">
              {t('deleteAccountPage.retentionTitle')}
            </h2>
            <p className="text-sm text-amber-900 leading-relaxed">
              {t('deleteAccountPage.retentionBody')}
            </p>
            <ul className="text-sm text-amber-900 space-y-1.5 list-disc list-inside">
              <li>{t('deleteAccountPage.retentionItem1')}</li>
              <li>{t('deleteAccountPage.retentionItem2')}</li>
              <li>{t('deleteAccountPage.retentionItem3')}</li>
              <li>{t('deleteAccountPage.retentionItem4')}</li>
            </ul>
            <p className="text-xs text-amber-800">{t('deleteAccountPage.retentionPeriod')}</p>
          </section>

          <section className="space-y-3 border-t border-slate-100 pt-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              {t('deleteAccountPage.supportTitle')}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('deleteAccountPage.supportBody')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:team@homecheff.eu"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                team@homecheff.eu
              </a>
              <Link
                href="/contact"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                {t('deleteAccountPage.contactCta')}
              </Link>
            </div>
          </section>

          <p className="text-xs text-slate-500">{t('deleteAccountPage.processingTime')}</p>
        </div>
      </div>
    </main>
  );
}
