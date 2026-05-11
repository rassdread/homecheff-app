'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Globe2,
  Link2,
  QrCode,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import AppBackBar from '@/components/navigation/AppBackBar';

type UserCard = {
  name?: string;
  email?: string;
  username?: string;
  hasSellerProfile?: boolean;
  hasDeliveryProfile?: boolean;
};

type Props = {
  session: Session | null;
  isMainAffiliate: boolean;
  userData: UserCard | null;
  acceptPrivacyPolicy: boolean;
  setAcceptPrivacyPolicy: (v: boolean) => void;
  acceptTerms: boolean;
  setAcceptTerms: (v: boolean) => void;
  acceptAffiliateAgreement: boolean;
  setAcceptAffiliateAgreement: (v: boolean) => void;
  handleSignup: () => void;
  isSigningUp: boolean;
};

const FAQ_COUNT = 11;

export default function AffiliateGrowthLanding({
  session,
  isMainAffiliate,
  userData,
  acceptPrivacyPolicy,
  setAcceptPrivacyPolicy,
  acceptTerms,
  setAcceptTerms,
  acceptAffiliateAgreement,
  setAcceptAffiliateAgreement,
  handleSignup,
  isSigningUp,
}: Props) {
  const { t } = useTranslation();
  const signupRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scrollToSignup = useCallback(() => {
    signupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const faqItems = useMemo(() => {
    return Array.from({ length: FAQ_COUNT }, (_, i) => ({
      q: t(`affiliate.growth.faq${i + 1}Q`),
      a: t(`affiliate.growth.faq${i + 1}A`),
    }));
  }, [t]);

  const audiences = [
    t('affiliate.growth.audience1'),
    t('affiliate.growth.audience2'),
    t('affiliate.growth.audience3'),
    t('affiliate.growth.audience4'),
    t('affiliate.growth.audience5'),
    t('affiliate.growth.audience6'),
    t('affiliate.growth.audience7'),
    t('affiliate.growth.audience8'),
  ];

  const steps = [
    { title: t('affiliate.step1'), body: t('affiliate.step1Desc') },
    { title: t('affiliate.step2'), body: t('affiliate.step2Desc') },
    { title: t('affiliate.step3'), body: t('affiliate.step3Desc') },
    { title: t('affiliate.step4'), body: t('affiliate.step4Desc') },
  ];

  const canSubmit =
    session?.user &&
    acceptPrivacyPolicy &&
    acceptTerms &&
    acceptAffiliateAgreement &&
    !isMainAffiliate;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 sm:pb-12">
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-2 sm:px-6 lg:px-8">
        <AppBackBar
          fallbackUrl="/werken-bij"
          label={t('navigation.back')}
          className="-mx-1 mb-4 rounded-2xl border border-slate-200/80 bg-white/90 px-2 shadow-sm"
        />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-5 py-10 shadow-sm sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/90">
            {t('affiliate.growth.heroEyebrow')}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-tight">
            {t('affiliate.growth.heroTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg">
            {t('affiliate.growth.heroSubtitle')}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{t('affiliate.growth.heroTrust')}</p>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/80">{t('affiliate.growth.pilotNote')}</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {isMainAffiliate ? (
              <>
                <Link
                  href="/affiliate/dashboard"
                  className="inline-flex min-h-[48px] min-w-[min(100%,200px)] items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-emerald-800"
                >
                  {t('affiliate.growth.ctaDashboard')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/affiliate/promo-codes"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  {t('affiliate.growth.ctaPromoCodes')}
                </Link>
              </>
            ) : (
              <>
                {session?.user ? (
                  <button
                    type="button"
                    onClick={scrollToSignup}
                    className="inline-flex min-h-[48px] min-w-[min(100%,200px)] items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-800"
                  >
                    {t('affiliate.growth.ctaPrimary')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <Link
                    href="/register?returnUrl=/affiliate"
                    className="inline-flex min-h-[48px] min-w-[min(100%,200px)] items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-800"
                  >
                    {t('affiliate.growth.ctaStartFree')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
                <Link
                  href="/affiliate/dashboard"
                  prefetch={false}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-slate-300 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition hover:bg-white"
                >
                  {t('affiliate.growth.ctaSecondary')}
                </Link>
                <Link
                  href="/affiliate/passive-income-calculator"
                  className="inline-flex min-h-[48px] items-center justify-center text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
                >
                  {t('affiliate.calculatePotential')} →
                </Link>
              </>
            )}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-12" aria-labelledby="aff-how">
          <h2 id="aff-how" className="text-2xl font-bold text-slate-900">
            {t('affiliate.growth.howTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{t('affiliate.growth.howSubtitle')}</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-900">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Recurring commission */}
        <section className="mt-14" aria-labelledby="aff-recurring">
          <h2 id="aff-recurring" className="text-2xl font-bold text-slate-900">
            {t('affiliate.growth.recurringTitle')}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {t('affiliate.growth.recurringIntro')}
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
              <Wallet className="h-8 w-8 text-blue-700" aria-hidden />
              <h3 className="mt-4 font-semibold text-slate-900">{t('affiliate.growth.recurringCard1Title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{t('affiliate.growth.recurringCard1Body')}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm">
              <BarChart3 className="h-8 w-8 text-emerald-800" aria-hidden />
              <h3 className="mt-4 font-semibold text-slate-900">{t('affiliate.growth.recurringCard2Title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{t('affiliate.growth.recurringCard2Body')}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6 shadow-sm">
              <Globe2 className="h-8 w-8 text-amber-900" aria-hidden />
              <h3 className="mt-4 font-semibold text-slate-900">{t('affiliate.growth.recurringCard3Title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{t('affiliate.growth.recurringCard3Body')}</p>
            </div>
          </div>
          <p className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {t('affiliate.growth.recurringLegal')}
          </p>
        </section>

        {/* Example scenarios */}
        <section className="mt-14" aria-labelledby="aff-examples">
          <h2 id="aff-examples" className="text-2xl font-bold text-slate-900">
            {t('affiliate.growth.examplesTitle')}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Sparkles className="h-6 w-6 text-violet-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-slate-900">{t('affiliate.growth.example1Title')}</h3>
              <p className="mt-2 text-sm text-slate-600">{t('affiliate.growth.example1Body')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Users className="h-6 w-6 text-teal-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-slate-900">{t('affiliate.growth.example2Title')}</h3>
              <p className="mt-2 text-sm text-slate-600">{t('affiliate.growth.example2Body')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Link2 className="h-6 w-6 text-orange-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-slate-900">{t('affiliate.growth.example3Title')}</h3>
              <p className="mt-2 text-sm text-slate-600">{t('affiliate.growth.example3Body')}</p>
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section className="mt-14" aria-labelledby="aff-audiences">
          <h2 id="aff-audiences" className="text-2xl font-bold text-slate-900">
            {t('affiliate.growth.audiencesTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{t('affiliate.growth.audiencesSubtitle')}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {audiences.map((label) => (
              <li
                key={label}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-800 shadow-sm sm:text-sm"
              >
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* Promo tools */}
        <section className="mt-14" aria-labelledby="aff-tools">
          <h2 id="aff-tools" className="text-2xl font-bold text-slate-900">
            {t('affiliate.growth.toolsTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('affiliate.growth.toolsSubtitle')}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Link2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden />
              <div>
                <h3 className="font-semibold text-slate-900">{t('affiliate.growth.toolLinkTitle')}</h3>
                <p className="mt-1 text-sm text-slate-600">{t('affiliate.growth.toolLinkBody')}</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <QrCode className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden />
              <div>
                <h3 className="font-semibold text-slate-900">{t('affiliate.growth.toolQrTitle')}</h3>
                <p className="mt-1 text-sm text-slate-600">{t('affiliate.growth.toolQrBody')}</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden />
              <div>
                <h3 className="font-semibold text-slate-900">{t('affiliate.growth.toolPromoTitle')}</h3>
                <p className="mt-1 text-sm text-slate-600">{t('affiliate.growth.toolPromoBody')}</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <BarChart3 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden />
              <div>
                <h3 className="font-semibold text-slate-900">{t('affiliate.growth.toolStatsTitle')}</h3>
                <p className="mt-1 text-sm text-slate-600">{t('affiliate.growth.toolStatsBody')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard preview */}
        <section className="mt-14 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-10 text-slate-100 shadow-lg">
          <h2 className="text-2xl font-bold text-white">{t('affiliate.growth.dashboardPreviewTitle')}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{t('affiliate.growth.dashboardPreviewBody')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/affiliate/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              {t('affiliate.growth.ctaDashboard')}
            </Link>
            <Link
              href="/faq"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {t('affiliate.growth.linkFaq')}
            </Link>
          </div>
        </section>

        {/* Commission detail (existing copy) */}
        <section className="mt-14" aria-labelledby="aff-commission-detail">
          <h2 id="aff-commission-detail" className="text-2xl font-bold text-slate-900">
            {t('affiliate.howEarnCommission')}
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
              <h3 className="text-lg font-bold text-blue-950">{t('affiliate.usersCommission')}</h3>
              <p className="mt-2 text-sm text-slate-700">{t('affiliate.usersCommissionDesc')}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>
                  <strong>{t('affiliate.buyerBringing')}</strong> {t('affiliate.buyerBringingDesc')}
                </li>
                <li>
                  <strong>{t('affiliate.sellerBringing')}</strong> {t('affiliate.sellerBringingDesc')}
                </li>
                <li>
                  <strong>{t('affiliate.bothBringing')}</strong> {t('affiliate.bothBringingDesc')}
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
              <h3 className="text-lg font-bold text-emerald-950">{t('affiliate.businessCommission')}</h3>
              <p className="mt-2 text-sm text-slate-700">{t('affiliate.businessCommissionDesc')}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>{t('affiliate.basicExample')}</li>
                <li>{t('affiliate.proExample')}</li>
                <li>{t('affiliate.premiumExample')}</li>
                <li className="border-t border-emerald-200/60 pt-2">{t('affiliate.homecheffAlways50')}</li>
                <li>{t('affiliate.canGiveDiscount')}</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-slate-800">
            <strong className="text-blue-900">{t('affiliate.everyoneWorthMoney')}:</strong> {t('affiliate.everyoneWorthMoneyDesc')}
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-slate-800">
            <strong className="text-emerald-900">{t('affiliate.twelveTwelveProgram')}:</strong> {t('affiliate.twelveTwelveFullDescription')}
          </div>
        </section>

        {/* Passive income highlight */}
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">💰 {t('affiliate.passiveIncomeTitle')}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                {t('affiliate.whatYouEarnBadge')}
              </span>
              <p className="mt-2 text-3xl font-bold text-emerald-700">€1,750{t('affiliate.perMonth')}</p>
              <p className="mt-2 text-sm text-slate-600">{t('affiliate.whatYouEarnSubline')}</p>
              <p className="mt-2 text-xs text-slate-500">{t('affiliate.year2Plus')} {t('affiliate.realistic')}</p>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">{t('affiliate.whatItCosts')}</p>
              <p className="mt-2 text-4xl font-bold text-emerald-600">€0</p>
              <p className="mt-1 text-sm text-slate-600">
                {t('affiliate.signupCost')} · {t('affiliate.monthlyCosts')}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            <strong>{t('affiliate.example')}:</strong> {t('affiliate.realisticDesc')}{' '}
            {t('affiliate.exampleCalculation', { subscriptions: '€1,400', transactions: '€350', total: '€1,750' })}.
          </p>
        </section>

        {/* Sharing strip */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">📱 {t('affiliate.easySharing.title')}</h2>
          <p className="mt-2 text-sm text-slate-600">{t('affiliate.easySharing.automatic')}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['🍳', t('affiliate.easySharing.recipes')],
              ['🛒', t('affiliate.easySharing.products')],
              ['🌱', t('affiliate.easySharing.garden')],
              ['🎨', t('affiliate.easySharing.designs')],
            ].map(([emoji, label]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 p-3 text-center text-xs font-medium text-slate-800">
                <div className="text-2xl" aria-hidden>
                  {emoji}
                </div>
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14" aria-labelledby="aff-faq">
          <h2 id="aff-faq" className="text-2xl font-bold text-slate-900">
            {t('affiliate.growth.faqTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t('affiliate.growth.faqSubtitle')}</p>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {faqItems.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    className="flex w-full min-h-[48px] items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-slate-900 sm:px-5 sm:text-base"
                    onClick={() => setOpenFaq(open ? null : idx)}
                    aria-expanded={open}
                  >
                    {item.q}
                    <span className="text-slate-400" aria-hidden>
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-slate-100 px-4 pb-4 pt-0 text-sm leading-relaxed text-slate-600 sm:px-5">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            <Link href="/faq" className="font-medium text-emerald-700 hover:underline">
              {t('affiliate.growth.faqMoreLink')}
            </Link>
          </p>
        </section>

        {/* Account card */}
        {userData ? (
          <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50/80 p-5">
            <h3 className="text-sm font-semibold text-slate-900">{t('affiliate.existingAccountTitle')}</h3>
            <p className="mt-1 text-xs text-slate-600">
              {t('affiliate.existingAccountDesc')} <strong>{userData.name || userData.email}</strong>
              {userData.username ? ` (@${userData.username})` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {userData.hasSellerProfile ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-900">✓ {t('affiliate.sellerRole')}</span>
              ) : null}
              {userData.hasDeliveryProfile ? (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-900">✓ {t('affiliate.deliveryRole')}</span>
              ) : null}
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-900">+ {t('affiliate.affiliateRole')}</span>
            </div>
          </div>
        ) : null}

        {/* Signup block */}
        <div ref={signupRef} id="affiliate-signup" className="scroll-mt-24">
          {!session?.user ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{t('affiliate.accountRequired.title')}</h2>
              <p className="mt-2 text-sm text-slate-600">{t('affiliate.accountRequired.description')}</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/register?returnUrl=/affiliate"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  {t('affiliate.accountRequired.createAccount')}
                </Link>
                <Link
                  href="/login?callbackUrl=/affiliate"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-emerald-700 px-6 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {t('affiliate.accountRequired.login')}
                </Link>
              </div>
            </div>
          ) : isMainAffiliate ? (
            <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" aria-hidden />
              <h2 className="mt-4 text-xl font-bold text-slate-900">{t('affiliate.growth.alreadyPartnerTitle')}</h2>
              <p className="mt-2 text-sm text-slate-600">{t('affiliate.growth.alreadyPartnerBody')}</p>
              <Link
                href="/affiliate/dashboard"
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-700 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                {t('affiliate.growth.ctaDashboard')}
              </Link>
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">{t('affiliate.requiredAcceptances')}</h2>
              <div className="mt-6 space-y-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptPrivacyPolicy}
                    onChange={(e) => setAcceptPrivacyPolicy(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">{t('affiliate.acceptPrivacy')}</span>{' '}
                    <Link href="/privacy" target="_blank" className="text-emerald-700 underline">
                      {t('affiliate.readPrivacy')}
                    </Link>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">{t('affiliate.acceptTerms')}</span>{' '}
                    <Link href="/terms" target="_blank" className="text-emerald-700 underline">
                      {t('affiliate.readTerms')}
                    </Link>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={acceptAffiliateAgreement}
                    onChange={(e) => setAcceptAffiliateAgreement(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium">{t('affiliate.acceptAffiliate')}</span>
                    <span className="mt-1 block text-xs text-slate-500">{t('affiliate.acceptAffiliateDesc')}</span>
                  </span>
                </label>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-xs text-slate-600">
                <p>
                  <strong>{t('affiliate.twelveTwelveProgram')} — {t('affiliate.guaranteed12Months')}:</strong>{' '}
                  {t('affiliate.twelveTwelveDescription')}. {t('affiliate.guaranteed12MonthsDesc')}
                </p>
                <p className="font-medium text-emerald-800">✨ {t('affiliate.twelveMonthsExtendedForSome')}</p>
                <p>
                  <strong>{t('affiliate.contractRenewal')}:</strong> {t('affiliate.contractRenewalDesc')}
                </p>
                <p className="italic">{t('affiliate.contractTermsDesc')}</p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-900">⚠️ {t('affiliate.taxInfo.title')}</h3>
                <p className="mt-2 text-xs text-slate-600">{t('affiliate.taxInfo.importantDesc')}</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
                  <li>{t('affiliate.taxInfo.point1')}</li>
                  <li>{t('affiliate.taxInfo.point2')}</li>
                  <li>{t('affiliate.taxInfo.point3')}</li>
                  <li>{t('affiliate.taxInfo.point4')}</li>
                  <li>{t('affiliate.taxInfo.point5')}</li>
                </ul>
              </div>

              <div className="mt-8 text-center">
                <h2 className="text-lg font-bold text-slate-900">{t('affiliate.readyToStart')}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {userData ? t('affiliate.readyToStartDesc') : t('affiliate.readyToStartDescNew')}
                </p>
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={isSigningUp || !canSubmit}
                  className="mt-6 inline-flex min-h-[52px] min-w-[min(100%,280px)] items-center justify-center rounded-2xl bg-emerald-700 px-10 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSigningUp ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent" />
                      {t('affiliate.signingUp')}
                    </span>
                  ) : (
                    t('affiliate.signupButton')
                  )}
                </button>
                {!canSubmit && session?.user && !isMainAffiliate ? (
                  <p className="mt-3 text-xs text-amber-800">{t('affiliate.acceptAllRequired')}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {t('affiliate.free')}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {t('affiliate.noObligations')}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {t('affiliate.directActive')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky mobile CTA */}
      {session?.user && !isMainAffiliate ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
          <button
            type="button"
            onClick={scrollToSignup}
            className="flex w-full min-h-[48px] items-center justify-center rounded-2xl bg-emerald-700 text-sm font-semibold text-white"
          >
            {t('affiliate.growth.stickyCta')}
          </button>
        </div>
      ) : !session?.user ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
          <Link
            href="/register?returnUrl=/affiliate"
            className="flex w-full min-h-[48px] items-center justify-center rounded-2xl bg-emerald-700 text-sm font-semibold text-white"
          >
            {t('affiliate.growth.ctaStartFree')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
