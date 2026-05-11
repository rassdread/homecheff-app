'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { ArrowRight, BarChart3, CheckCircle2, ChevronDown, Link2, QrCode, Sparkles } from 'lucide-react';
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

const FAQ_COUNT = 13;

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToSignup = useCallback(() => {
    signupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const faqItems = useMemo(() => {
    return Array.from({ length: FAQ_COUNT }, (_, i) => ({
      q: t(`affiliate.growth.faq${i + 1}Q`),
      a: t(`affiliate.growth.faq${i + 1}A`),
    }));
  }, [t]);

  const flowTitles = [t('affiliate.step1'), t('affiliate.step2'), t('affiliate.step3'), t('affiliate.step4')];

  const canSubmit =
    session?.user &&
    acceptPrivacyPolicy &&
    acceptTerms &&
    acceptAffiliateAgreement &&
    !isMainAffiliate;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-10">
      <div className="mx-auto max-w-3xl px-4 pb-6 pt-1 sm:px-5">
        <AppBackBar
          fallbackUrl="/werken-bij"
          label={t('navigation.back')}
          className="-mx-0.5 mb-3 rounded-xl border border-slate-200/80 bg-white/90 px-1.5 py-0.5 shadow-sm"
        />

        {/* Hero — scan in seconds */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/80 px-4 py-7 shadow-sm sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-200/25 blur-2xl" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800/90">
            {t('affiliate.growth.heroEyebrow')}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t('affiliate.growth.heroTitle')}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-snug text-slate-700 sm:text-[15px] sm:leading-relaxed">
            {t('affiliate.growth.heroSubtitle')}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
              {t('affiliate.growth.pilotNote')}
            </span>
            <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
              {t('affiliate.growth.statUser')}
            </span>
            <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
              {t('affiliate.growth.statBoth')}
            </span>
            <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
              {t('affiliate.growth.statBiz')}
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            {isMainAffiliate ? (
              <>
                <Link
                  href="/affiliate/dashboard"
                  className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:flex-none"
                >
                  {t('affiliate.growth.ctaDashboard')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/affiliate/promo-codes"
                  className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
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
                    className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:max-w-xs"
                  >
                    {t('affiliate.growth.ctaPrimary')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <Link
                    href="/register?returnUrl=/affiliate"
                    className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:max-w-xs"
                  >
                    {t('affiliate.growth.ctaStartFree')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
                {session?.user ? (
                  <Link
                    href="/affiliate/dashboard"
                    prefetch={false}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    {t('affiliate.growth.ctaSecondary')}
                  </Link>
                ) : null}
                <Link
                  href="/affiliate/passive-income-calculator"
                  className="inline-flex min-h-[44px] items-center justify-center text-sm font-medium text-emerald-800 underline-offset-2 hover:underline sm:px-2"
                >
                  {t('affiliate.calculatePotential')} →
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Earnings model — merged (was recurring + part of commission story) */}
        <section className="mt-7 sm:mt-8" aria-labelledby="aff-model">
          <h2 id="aff-model" className="text-lg font-bold text-slate-900 sm:text-xl">
            {t('affiliate.growth.sectionModelTitle')}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-snug text-slate-700 shadow-sm">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>{t('affiliate.growth.modelBullet1')}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>{t('affiliate.growth.modelBullet2')}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>{t('affiliate.growth.modelBullet3')}</span>
              </li>
            </ul>
            <div className="flex flex-col justify-between gap-2 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                  {t('affiliate.growth.modelExampleHint')}
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">€1,750{t('affiliate.perMonth')}</p>
                <p className="text-xs text-slate-600">{t('affiliate.whatYouEarnSubline')}</p>
              </div>
              <div className="border-t border-emerald-100/80 pt-2">
                <p className="text-xs font-medium text-slate-700">{t('affiliate.whatItCosts')}</p>
                <p className="text-xl font-bold text-slate-900">€0</p>
              </div>
            </div>
          </div>
        </section>

        {/* Flow — titles only */}
        <section className="mt-7 sm:mt-8" aria-labelledby="aff-flow">
          <h2 id="aff-flow" className="text-lg font-bold text-slate-900 sm:text-xl">
            {t('affiliate.growth.sectionFlowTitle')}
          </h2>
          <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {flowTitles.map((title, i) => (
              <li
                key={i}
                className="flex min-h-[4.5rem] flex-col justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-center shadow-sm"
              >
                <span className="text-[10px] font-bold text-emerald-700">{i + 1}</span>
                <span className="mt-0.5 text-[11px] font-semibold leading-tight text-slate-900 sm:text-xs">{title}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Dashboard & tools — merged */}
        <section className="mt-7 sm:mt-8" aria-labelledby="aff-dash">
          <h2 id="aff-dash" className="text-lg font-bold text-slate-900 sm:text-xl">
            {t('affiliate.growth.dashboardBandTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">{t('affiliate.growth.dashboardBandBody')}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { Icon: Link2, t: t('affiliate.growth.toolLinkTitle') },
              { Icon: QrCode, t: t('affiliate.growth.toolQrTitle') },
              { Icon: Sparkles, t: t('affiliate.growth.toolPromoTitle') },
              { Icon: BarChart3, t: t('affiliate.growth.toolStatsTitle') },
            ].map(({ Icon, t: label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                <span className="text-[11px] font-medium leading-tight text-slate-800">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/affiliate/dashboard"
              className="inline-flex min-h-[40px] items-center rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {t('affiliate.growth.ctaDashboard')}
            </Link>
            <Link
              href="/faq"
              className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              {t('affiliate.growth.linkFaq')}
            </Link>
          </div>
        </section>

        {/* Optional deep dive — keeps SEO-relevant facts for readers who expand */}
        <details className="group mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden />
              {t('affiliate.growth.commissionDetailsLabel')}
            </span>
          </summary>
          <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4 text-sm text-slate-700">
            <div>
              <h3 className="font-bold text-blue-950">{t('affiliate.usersCommission')}</h3>
              <p className="mt-1 text-xs text-slate-600">{t('affiliate.usersCommissionDesc')}</p>
              <ul className="mt-2 space-y-1 text-xs">
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
            <div>
              <h3 className="font-bold text-emerald-950">{t('affiliate.businessCommission')}</h3>
              <p className="mt-1 text-xs text-slate-600">{t('affiliate.businessCommissionDesc')}</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>{t('affiliate.basicExample')}</li>
                <li>{t('affiliate.proExample')}</li>
                <li>{t('affiliate.premiumExample')}</li>
                <li>{t('affiliate.homecheffAlways50')}</li>
                <li>{t('affiliate.canGiveDiscount')}</li>
              </ul>
            </div>
            <p className="text-xs text-slate-600">
              <strong className="text-emerald-900">{t('affiliate.twelveTwelveProgram')}:</strong>{' '}
              {t('affiliate.twelveTwelveFullDescription')}
            </p>
          </div>
        </details>

        {/* Signup / account — before FAQ for faster conversion */}
        <div ref={signupRef} id="affiliate-signup" className="scroll-mt-20 mt-7 sm:mt-8">
          {!session?.user ? null : isMainAffiliate ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" aria-hidden />
              <h2 className="mt-2 text-base font-bold text-slate-900">{t('affiliate.growth.alreadyPartnerTitle')}</h2>
              <p className="mt-1 text-xs text-slate-600">{t('affiliate.growth.alreadyPartnerBody')}</p>
              <Link
                href="/affiliate/dashboard"
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                {t('affiliate.growth.ctaDashboard')}
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              {userData ? (
                <p className="mb-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{t('affiliate.existingAccountTitle')}</span>{' '}
                  {userData.name || userData.email}
                  {userData.username ? ` (@${userData.username})` : ''}
                </p>
              ) : null}
              <h2 className="text-base font-bold text-slate-900">{t('affiliate.requiredAcceptances')}</h2>
              <div className="mt-3 space-y-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={acceptPrivacyPolicy}
                    onChange={(e) => setAcceptPrivacyPolicy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-medium">{t('affiliate.acceptPrivacy')}</span>{' '}
                    <Link href="/privacy" target="_blank" className="text-emerald-700 underline">
                      {t('affiliate.readPrivacy')}
                    </Link>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-medium">{t('affiliate.acceptTerms')}</span>{' '}
                    <Link href="/terms" target="_blank" className="text-emerald-700 underline">
                      {t('affiliate.readTerms')}
                    </Link>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={acceptAffiliateAgreement}
                    onChange={(e) => setAcceptAffiliateAgreement(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-medium">{t('affiliate.acceptAffiliate')}</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-slate-500 line-clamp-4">
                      {t('affiliate.acceptAffiliateDesc')}
                    </span>
                  </span>
                </label>
              </div>

              <details className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80">
                <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium text-slate-700">
                  {t('affiliate.contractTerms')} · {t('affiliate.taxInfo.title')}
                </summary>
                <div className="space-y-2 border-t border-slate-100 px-3 py-2 text-[11px] text-slate-600">
                  <p>
                    <strong>{t('affiliate.twelveTwelveProgram')}:</strong> {t('affiliate.twelveTwelveDescription')}
                  </p>
                  <p>{t('affiliate.contractRenewalDesc')}</p>
                  <p className="text-slate-500">{t('affiliate.taxInfo.importantDesc')}</p>
                </div>
              </details>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={isSigningUp || !canSubmit}
                  className="inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSigningUp ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                      {t('affiliate.signingUp')}
                    </span>
                  ) : (
                    t('affiliate.signupButton')
                  )}
                </button>
                {!canSubmit ? (
                  <p className="mt-2 text-[11px] text-amber-800">{t('affiliate.acceptAllRequired')}</p>
                ) : null}
                <p className="mt-2 text-[10px] text-slate-500">
                  {t('affiliate.free')} · {t('affiliate.noObligations')} · {t('affiliate.directActive')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FAQ */}
        <section className="mt-7 sm:mt-8" aria-labelledby="aff-faq">
          <h2 id="aff-faq" className="text-lg font-bold text-slate-900 sm:text-xl">
            {t('affiliate.growth.faqTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-600">{t('affiliate.growth.faqSubtitle')}</p>
          <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
            {faqItems.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    className="flex w-full min-h-[44px] items-center justify-between gap-3 px-3 py-2.5 text-left text-xs font-semibold text-slate-900 sm:text-sm"
                    onClick={() => setOpenFaq(open ? null : idx)}
                    aria-expanded={open}
                  >
                    <span className="pr-2">{item.q}</span>
                    <span className="shrink-0 text-slate-400" aria-hidden>
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open ? (
                    <div className="border-t border-slate-100 px-3 pb-2.5 pt-0 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            <Link href="/faq" className="font-medium text-emerald-700 hover:underline">
              {t('affiliate.growth.faqMoreLink')}
            </Link>
          </p>
        </section>

        {/* Guests: slim login CTA after FAQ */}
        {!session?.user ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-900">{t('affiliate.accountRequired.title')}</p>
            <p className="mt-1 text-xs text-slate-600">{t('affiliate.accountRequired.description')}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href="/register?returnUrl=/affiliate"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                {t('affiliate.accountRequired.createAccount')}
              </Link>
              <Link
                href="/login?callbackUrl=/affiliate"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                {t('affiliate.accountRequired.login')}
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* Sticky mobile CTA */}
      {session?.user && !isMainAffiliate ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden">
          <button
            type="button"
            onClick={scrollToSignup}
            className="flex w-full min-h-[46px] items-center justify-center rounded-xl bg-emerald-700 text-sm font-semibold text-white"
          >
            {t('affiliate.growth.stickyCta')}
          </button>
        </div>
      ) : !session?.user ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden">
          <Link
            href="/register?returnUrl=/affiliate"
            className="flex w-full min-h-[46px] items-center justify-center rounded-xl bg-emerald-700 text-sm font-semibold text-white"
          >
            {t('affiliate.growth.ctaStartFree')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
