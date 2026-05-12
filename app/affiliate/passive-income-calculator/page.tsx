'use client';

import { useState } from 'react';
import { TrendingUp, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

const p = 'affiliate.passiveIncomeCalculator';

export default function PassiveIncomeCalculator() {
  const { t } = useTranslation();
  const [months, setMonths] = useState(12);
  const [subscriptionsPerMonth, setSubscriptionsPerMonth] = useState(2);
  const [avgSubscriptionPrice, setAvgSubscriptionPrice] = useState(99);
  const [sellersPerMonth, setSellersPerMonth] = useState(10);
  const [transactionsPerSellerPerMonth, setTransactionsPerSellerPerMonth] = useState(5);
  const [businessTransactionsPerMonth, setBusinessTransactionsPerMonth] = useState(20);
  const [avgTransactionValue, setAvgTransactionValue] = useState(100);

  const sellerTransactionFeePct = 12;
  const businessTransactionFeePct = 4;

  const affiliateCommissionPct = 0.5;
  const transactionCommissionPct = 0.25;

  const totalSubscriptions = subscriptionsPerMonth * months;

  const sellerTransactionFee = (avgTransactionValue * sellerTransactionFeePct) / 100;
  const commissionPerSellerTransaction = sellerTransactionFee * transactionCommissionPct;

  const businessTransactionFee = (avgTransactionValue * businessTransactionFeePct) / 100;
  const commissionPerBusinessTransaction = businessTransactionFee * transactionCommissionPct;

  let cumulativeRevenue = 0;
  let totalMonthlyRevenue = 0;
  const monthlyBreakdown: Array<{
    month: number;
    newSubscriptions: number;
    activeSubscriptions: number;
    activeBusinesses: number;
    activeSellers: number;
    newRevenue: number;
    subscriptionRevenue: number;
    businessTransactionRevenue: number;
    sellerTransactionRevenue: number;
    transactionRevenue: number;
    activeRevenue: number;
    cumulative: number;
  }> = [];

  for (let month = 1; month <= months; month++) {
    const newSubscriptions = subscriptionsPerMonth;
    const newSubscriptionRevenue = newSubscriptions * avgSubscriptionPrice * affiliateCommissionPct;

    const activeSubscriptions = Math.min(month * subscriptionsPerMonth, 12 * subscriptionsPerMonth);
    const activeSubscriptionRevenue = activeSubscriptions * avgSubscriptionPrice * affiliateCommissionPct;

    const activeBusinesses = Math.min(month * subscriptionsPerMonth, 12 * subscriptionsPerMonth);
    const monthlyBusinessTransactionRevenue =
      activeBusinesses * businessTransactionsPerMonth * commissionPerBusinessTransaction;

    const activeSellers = Math.min(month * sellersPerMonth, 12 * sellersPerMonth);
    const monthlySellerTransactionRevenue =
      activeSellers * transactionsPerSellerPerMonth * commissionPerSellerTransaction;

    const totalTransactionRevenue = monthlyBusinessTransactionRevenue + monthlySellerTransactionRevenue;

    const newMonthlyRevenue = newSubscriptionRevenue;

    const totalMonthlyRevenueThisMonth = activeSubscriptionRevenue + totalTransactionRevenue;

    cumulativeRevenue += newMonthlyRevenue;

    totalMonthlyRevenue = totalMonthlyRevenueThisMonth;

    monthlyBreakdown.push({
      month,
      newSubscriptions,
      activeSubscriptions,
      activeBusinesses,
      activeSellers,
      newRevenue: newMonthlyRevenue,
      subscriptionRevenue: activeSubscriptionRevenue,
      businessTransactionRevenue: monthlyBusinessTransactionRevenue,
      sellerTransactionRevenue: monthlySellerTransactionRevenue,
      transactionRevenue: totalTransactionRevenue,
      activeRevenue: totalMonthlyRevenueThisMonth,
      cumulative: cumulativeRevenue,
    });
  }

  const totalRevenue = monthlyBreakdown.reduce((sum, item) => sum + item.activeRevenue, 0);

  const month12PlusSubscriptionRevenue = 12 * subscriptionsPerMonth * avgSubscriptionPrice * affiliateCommissionPct;
  const month12PlusBusinessTransactionRevenue =
    12 * subscriptionsPerMonth * businessTransactionsPerMonth * commissionPerBusinessTransaction;
  const month12PlusSellerTransactionRevenue =
    12 * sellersPerMonth * transactionsPerSellerPerMonth * commissionPerSellerTransaction;
  const month12PlusTotalTransactionRevenue =
    month12PlusBusinessTransactionRevenue + month12PlusSellerTransactionRevenue;
  const month12PlusTotalRevenue = month12PlusSubscriptionRevenue + month12PlusTotalTransactionRevenue;
  const year2Revenue = month12PlusTotalRevenue * 12;

  const end = monthlyBreakdown[monthlyBreakdown.length - 1];

  const timeline = [
    { title: `${p}.timelineY1Title`, body: `${p}.timelineY1Body` },
    { title: `${p}.timelineY2Title`, body: `${p}.timelineY2Body` },
    { title: `${p}.timelineY35Title`, body: `${p}.timelineY35Body` },
    { title: `${p}.timelineY710Title`, body: `${p}.timelineY710Body` },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8 sm:mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-emerald-800/90 mb-2">{t(`${p}.title`)}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">{t(`${p}.subtitle`)}</h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">{t(`${p}.description`)}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3 mb-8" aria-label={t(`${p}.storyAriaLabel`)}>
          <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-2">
              {t(`${p}.narrativeStandardTitle`)}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{t(`${p}.narrativeStandardBody`)}</p>
          </article>
          <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-2">
              {t(`${p}.narrativePartnershipTitle`)}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{t(`${p}.narrativePartnershipBody`)}</p>
          </article>
          <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm md:col-span-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-2">
              {t(`${p}.narrativeFutureVisionTitle`)}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{t(`${p}.narrativeFutureVisionBody`)}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t(`${p}.calculatePotential`)}</h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t(`${p}.subscriptionsPerMonth`)}
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={subscriptionsPerMonth}
                onChange={(e) => setSubscriptionsPerMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t(`${p}.avgPricePerSubscription`)}
              </label>
              <input
                type="number"
                min={39}
                max={199}
                value={avgSubscriptionPrice}
                onChange={(e) => setAvgSubscriptionPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t(`${p}.sellersPerMonth`)}</label>
              <input
                type="number"
                min={0}
                max={50}
                value={sellersPerMonth}
                onChange={(e) => setSellersPerMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">{t(`${p}.sellersPerMonthDesc`)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t(`${p}.transactionsPerSeller`)}
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={transactionsPerSellerPerMonth}
                onChange={(e) => setTransactionsPerSellerPerMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">{t(`${p}.transactionsPerSellerDesc`)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t(`${p}.transactionsPerBusiness`)}
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={businessTransactionsPerMonth}
                onChange={(e) => setBusinessTransactionsPerMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">{t(`${p}.transactionsPerBusinessDesc`)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t(`${p}.avgTransactionValue`)}
              </label>
              <input
                type="number"
                min={10}
                max={500}
                value={avgTransactionValue}
                onChange={(e) => setAvgTransactionValue(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t(`${p}.periodMonths`)}</label>
              <input
                type="number"
                min={1}
                max={36}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full max-w-xs px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          <details className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3 group mb-6">
            <summary className="cursor-pointer text-sm font-medium text-slate-800 list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
              <span>{t(`${p}.commissionDetailsToggle`)}</span>
              <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed border-t border-slate-200/80 pt-3">
              {t(`${p}.commissionDetailsBody`)}
            </p>
          </details>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-semibold text-slate-900">{t(`${p}.totalSubscriptions`)}</h3>
              </div>
              <p className="text-2xl font-bold text-emerald-800">{totalSubscriptions}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {t(`${p}.overMonths`).replace('{months}', String(months))}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">{t(`${p}.monthlyIncome`)}</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900">€{totalMonthlyRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {t(`${p}.afterMonths`).replace('{months}', String(months))}
              </p>
              {end && (
                <p className="text-[11px] text-slate-500 mt-2 leading-snug">
                  €{end.subscriptionRevenue.toFixed(2)} {t(`${p}.subscriptions`).toLowerCase()} · €
                  {end.businessTransactionRevenue.toFixed(2)} {t(`${p}.fromBusinesses`).toLowerCase()} · €
                  {end.sellerTransactionRevenue.toFixed(2)} {t(`${p}.fromSellers`).toLowerCase()}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-violet-700" />
                <h3 className="text-sm font-semibold text-slate-900">{t(`${p}.totalEarned`)}</h3>
              </div>
              <p className="text-2xl font-bold text-violet-900">€{totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-600 mt-0.5">{t(`${p}.cumulative`)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/80 to-white p-5 sm:p-6 mb-8">
          <h2 className="text-base font-semibold text-slate-900 mb-3">{t(`${p}.snapshotTitle`)}</h2>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>
              {t(`${p}.snapshotCumulative`)
                .replace('{months}', String(months))
                .replace('{total}', totalRevenue.toFixed(2))}
            </li>
            <li>
              {t(`${p}.snapshotEndMonth`)
                .replace('{months}', String(months))
                .replace('{monthly}', totalMonthlyRevenue.toFixed(2))}
            </li>
            <li>
              {t(`${p}.snapshotRunRate`)
                .replace('{year}', year2Revenue.toFixed(2))
                .replace('{monthly}', month12PlusTotalRevenue.toFixed(2))}
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">{t(`${p}.snapshotModelNote`)}</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{t(`${p}.narrativeFutureTitle`)}</h2>
          <p className="text-sm text-slate-600 mb-6">{t(`${p}.narrativeFutureIntro`)}</p>
          <ol className="space-y-5 border-l-2 border-emerald-200 pl-5 ml-0.5">
            {timeline.map((row) => (
              <li key={row.title} className="relative">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{t(row.title)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(row.body)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
            {t(`${p}.narrativeFutureDisclaimer`)}
          </p>
        </section>

        <details className="rounded-2xl border border-slate-200 bg-white shadow-sm mb-8 overflow-hidden group">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-800 flex items-center justify-between list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50/80">
            <span>{t(`${p}.monthlyDetailsToggle`)}</span>
            <span className="text-slate-400 text-xs transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="px-4 pb-4 overflow-x-auto border-t border-slate-100">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2 font-medium">{t(`${p}.month`)}</th>
                  <th className="py-2 px-2 text-right font-medium">{t(`${p}.new`)}</th>
                  <th className="py-2 px-2 text-right font-medium">{t(`${p}.active`)}</th>
                  <th className="py-2 px-2 text-right font-medium">{t(`${p}.subscriptions`)}</th>
                  <th className="py-2 px-2 text-right font-medium">{t(`${p}.businesses`)}</th>
                  <th className="py-2 px-2 text-right font-medium">{t(`${p}.sellers`)}</th>
                  <th className="py-2 px-2 text-right font-medium">{t(`${p}.total`)}</th>
                  <th className="py-2 pl-2 text-right font-medium">{t(`${p}.cumulative`)}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((item) => (
                  <tr key={item.month} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-2 pr-2 font-medium text-slate-900">
                      {t(`${p}.monthLabel`).replace('{month}', String(item.month))}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600">{item.newSubscriptions}</td>
                    <td className="py-2 px-2 text-right text-slate-600">{item.activeSubscriptions}</td>
                    <td className="py-2 px-2 text-right text-slate-600">€{item.subscriptionRevenue.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-slate-600">€{item.businessTransactionRevenue.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-slate-600">€{item.sellerTransactionRevenue.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-medium text-emerald-800">€{item.activeRevenue.toFixed(2)}</td>
                    <td className="py-2 pl-2 text-right font-semibold text-violet-900">€{item.cumulative.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <footer className="text-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{t(`${p}.ctaSlimTitle`)}</h2>
          <p className="text-sm sm:text-base text-slate-600 mb-1">{t(`${p}.ctaSlimSubtitle`)}</p>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6 leading-relaxed">{t(`${p}.legalFootnote`)}</p>
          <Link
            href="/affiliate"
            className="inline-block rounded-xl bg-emerald-700 text-white px-8 py-3.5 text-sm font-semibold hover:bg-emerald-800 transition-colors shadow-md shadow-emerald-900/10"
          >
            {t(`${p}.becomeAffiliate`)}
          </Link>
          <p className="text-sm text-slate-500 mt-4 max-w-md mx-auto">{t(`${p}.readyToStartDesc`)}</p>
        </footer>
      </div>
    </div>
  );
}
