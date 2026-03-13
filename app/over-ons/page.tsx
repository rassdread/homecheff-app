'use client';

import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { ArrowLeft, Mail, Users, Heart, Target, Leaf } from 'lucide-react';
import Logo from '@/components/Logo';

const EMAILS = [
  { key: 'info', email: 'info@homecheff.eu' },
  { key: 'support', email: 'support@homecheff.eu' },
  { key: 'partners', email: 'partners@homecheff.eu' },
  { key: 'press', email: 'press@homecheff.eu' },
  { key: 'jobs', email: 'jobs@homecheff.eu' },
  { key: 'team', email: 'team@homecheff.eu' },
] as const;

export default function OverOnsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <Logo size="md" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('overOns.title')}
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          {t('overOns.subtitle')}
        </p>

        {/* Over HomeCheff */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('overOns.whoWeAreTitle')}
            </h2>
          </div>
          <div className="prose prose-lg text-gray-700 space-y-4">
            <p>{t('overOns.whoWeAre1')}</p>
            <p>{t('overOns.whoWeAre2')}</p>
            <p>{t('overOns.whoWeAre3')}</p>
          </div>
        </section>

        {/* Missie */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('overOns.missionTitle')}
            </h2>
          </div>
          <div className="prose prose-lg text-gray-700 space-y-4">
            <p>{t('overOns.mission1')}</p>
            <p>{t('overOns.mission2')}</p>
          </div>
        </section>

        {/* Wat we doen */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Leaf className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('overOns.whatWeDoTitle')}
            </h2>
          </div>
          <ul className="space-y-3 text-gray-700 list-disc list-inside">
            <li>{t('overOns.whatWeDo1')}</li>
            <li>{t('overOns.whatWeDo2')}</li>
            <li>{t('overOns.whatWeDo3')}</li>
            <li>{t('overOns.whatWeDo4')}</li>
          </ul>
        </section>

        {/* Bereikbaarheid: voor wie naar waar */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('overOns.reachabilityTitle')}
            </h2>
          </div>
          <p className="text-gray-700 mb-6">
            {t('overOns.reachabilityIntro')}
          </p>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-emerald-50 border-b border-emerald-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {t('overOns.tableFor')}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {t('overOns.tableEmail')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {EMAILS.map(({ key, email }) => (
                  <tr
                    key={key}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-700">
                      {t(`overOns.emailFor.${key}`)}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${email}`}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        {email}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {t('overOns.reachabilityNote')}
          </p>
        </section>

        {/* Team & samenwerking */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('overOns.teamTitle')}
            </h2>
          </div>
          <p className="text-gray-700">
            {t('overOns.teamText')}
          </p>
        </section>

        <div className="pt-8 border-t border-gray-200">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Mail className="w-5 h-5" />
            {t('overOns.contactCta')}
          </Link>
        </div>
      </div>
    </main>
  );
}
