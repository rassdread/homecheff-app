'use client';

import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Users,
  Heart,
  Target,
  Leaf,
  Building2,
  BookOpen,
  Sparkles,
  MapPin,
  Cpu,
  Bot,
  HandCoins,
  UtensilsCrossed,
  Home,
  Telescope,
} from 'lucide-react';
import Logo from '@/components/Logo';

const EMAILS = [
  { key: 'info', email: 'info@homecheff.eu' },
  { key: 'support', email: 'support@homecheff.eu' },
  { key: 'partners', email: 'partners@homecheff.eu' },
  { key: 'press', email: 'press@homecheff.eu' },
  { key: 'jobs', email: 'jobs@homecheff.eu' },
  { key: 'team', email: 'team@homecheff.eu' },
] as const;

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-8 h-8 text-emerald-600 shrink-0" />
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="prose prose-lg text-gray-700 space-y-4 max-w-none">{children}</div>
    </section>
  );
}

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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('overOns.title')}</h1>
        <p className="text-lg text-gray-600 mb-6">{t('overOns.subtitle')}</p>

        <div className="mb-10 rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
          <p className="text-gray-800 mb-3">{t('overOns.manifestIntro')}</p>
          <Link
            href="/manifest"
            className="inline-flex items-center gap-2 font-medium text-emerald-800 hover:text-emerald-900 underline-offset-2 hover:underline"
          >
            <BookOpen className="w-4 h-4" />
            {t('overOns.manifestCta')}
          </Link>
        </div>

        <Section icon={Heart} title={t('overOns.storyTitle')}>
          <p>{t('overOns.story1')}</p>
          <p>{t('overOns.story2')}</p>
          <p>{t('overOns.story3')}</p>
        </Section>

        <Section icon={Sparkles} title={t('overOns.philosophyTitle')}>
          <p>{t('overOns.philosophy1')}</p>
          <p>{t('overOns.philosophy2')}</p>
        </Section>

        <Section icon={Heart} title={t('overOns.whoWeAreTitle')}>
          <p>{t('overOns.whoWeAre1')}</p>
          <p>{t('overOns.whoWeAre2')}</p>
          <p>{t('overOns.whoWeAre3')}</p>
        </Section>

        <Section icon={Leaf} title={t('overOns.craftTitle')}>
          <p>{t('overOns.craft1')}</p>
          <p>{t('overOns.craft2')}</p>
        </Section>

        <Section icon={MapPin} title={t('overOns.localTitle')}>
          <p>{t('overOns.local1')}</p>
          <p>{t('overOns.local2')}</p>
        </Section>

        <Section icon={Target} title={t('overOns.missionTitle')}>
          <p>{t('overOns.mission1')}</p>
          <p>{t('overOns.mission2')}</p>
        </Section>

        <Section icon={Cpu} title={t('overOns.conscienceTitle')}>
          <p>{t('overOns.conscience1')}</p>
          <p>{t('overOns.conscience2')}</p>
        </Section>

        <Section icon={Bot} title={t('overOns.aiTitle')}>
          <p>{t('overOns.ai1')}</p>
          <p>{t('overOns.ai2')}</p>
        </Section>

        <Section icon={HandCoins} title={t('overOns.entrepreneurshipTitle')}>
          <p>{t('overOns.entrepreneurship1')}</p>
          <p>{t('overOns.entrepreneurship2')}</p>
        </Section>

        <Section icon={UtensilsCrossed} title={t('overOns.foodCategoryTitle')}>
          <p>{t('overOns.foodCategory1')}</p>
        </Section>

        <Section icon={Home} title={t('overOns.villageTitle')}>
          <p>{t('overOns.village1')}</p>
          <p>{t('overOns.village2')}</p>
        </Section>

        <Section icon={Leaf} title={t('overOns.whatWeDoTitle')}>
          <ul className="space-y-3 list-disc list-inside not-prose">
            <li>{t('overOns.whatWeDo1')}</li>
            <li>{t('overOns.whatWeDo2')}</li>
            <li>{t('overOns.whatWeDo3')}</li>
            <li>{t('overOns.whatWeDo4')}</li>
          </ul>
        </Section>

        <Section icon={Telescope} title={t('overOns.futureTitle')}>
          <p>{t('overOns.future1')}</p>
          <p>{t('overOns.future2')}</p>
        </Section>

        <Section icon={Mail} title={t('overOns.reachabilityTitle')}>
          <p>{t('overOns.reachabilityIntro')}</p>
          <div className="not-prose bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-4">
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
                    <td className="px-6 py-4 text-gray-700">{t(`overOns.emailFor.${key}`)}</td>
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
          <p className="text-sm text-gray-500 mt-4">{t('overOns.reachabilityNote')}</p>
        </Section>

        <Section icon={Users} title={t('overOns.teamTitle')}>
          <p>{t('overOns.teamText')}</p>
        </Section>

        <Section icon={Building2} title={t('overOns.companyDetailsTitle')}>
          <div className="not-prose bg-white rounded-xl shadow-md border border-gray-200 p-6 text-gray-700 space-y-2">
            <p className="text-emerald-700 font-medium">{t('overOns.companyUnder')}</p>
            <p className="font-semibold text-gray-900">{t('overOns.companyName')}</p>
            <p>{t('overOns.companyAddress')}</p>
            <p>{t('overOns.kvkNumber')}</p>
            <p>{t('overOns.vatNumber')}</p>
          </div>
        </Section>

        <div className="pt-8 border-t border-gray-200 flex flex-wrap gap-3">
          <Link
            href="/manifest"
            className="inline-flex items-center gap-2 px-6 py-3 border border-emerald-600 text-emerald-800 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            {t('overOns.manifestCta')}
          </Link>
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
