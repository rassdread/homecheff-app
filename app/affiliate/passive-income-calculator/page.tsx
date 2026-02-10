'use client';

import { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, Users, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function PassiveIncomeCalculator() {
  const { t } = useTranslation();
  const [months, setMonths] = useState(12);
  const [subscriptionsPerMonth, setSubscriptionsPerMonth] = useState(2);
  const [avgSubscriptionPrice, setAvgSubscriptionPrice] = useState(99); // €99/maand gemiddeld
  const [sellersPerMonth, setSellersPerMonth] = useState(10); // Particuliere verkopers die je aanbrengt
  const [transactionsPerSellerPerMonth, setTransactionsPerSellerPerMonth] = useState(5); // Transacties per verkoper per maand
  const [businessTransactionsPerMonth, setBusinessTransactionsPerMonth] = useState(20); // Transacties per bedrijf per maand
  const [avgTransactionValue, setAvgTransactionValue] = useState(100); // €100 gemiddelde transactie
  const [sellerTransactionFeePct, setSellerTransactionFeePct] = useState(12); // 12% platform fee (particulier)
  const [businessTransactionFeePct, setBusinessTransactionFeePct] = useState(4); // 4% platform fee (Pro bedrijf)

  // Echte subscription prijzen van HomeCheff
  const subscriptionPrices = {
    basic: 39,   // €39/maand (Basic)
    pro: 99,     // €99/maand (Pro)
    premium: 199 // €199/maand (Premium)
  };

  // Affiliate krijgt 50% van subscription fee
  const affiliateCommissionPct = 0.50;
  
  // Affiliate krijgt 25% van transaction fee
  const transactionCommissionPct = 0.25;

  // Berekenen
  const totalSubscriptions = subscriptionsPerMonth * months;
  
  // Transaction fee berekening
  // Voor particuliere verkopers: 12% fee
  const sellerTransactionFee = (avgTransactionValue * sellerTransactionFeePct) / 100; // Bijv. €100 * 12% = €12
  const commissionPerSellerTransaction = sellerTransactionFee * transactionCommissionPct; // 25% van €12 = €3
  
  // Voor bedrijven: 4% fee (Pro plan)
  const businessTransactionFee = (avgTransactionValue * businessTransactionFeePct) / 100; // Bijv. €100 * 4% = €4
  const commissionPerBusinessTransaction = businessTransactionFee * transactionCommissionPct; // 25% van €4 = €1
  
  // Cumulative revenue (passief inkomen groeit elke maand)
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
    // Nieuwe subscriptions deze maand
    const newSubscriptions = subscriptionsPerMonth;
    const newSubscriptionRevenue = newSubscriptions * avgSubscriptionPrice * affiliateCommissionPct;
    
    // Bestaande subscriptions (van vorige maanden, maximaal 12 maanden actief per subscription)
    const activeSubscriptions = Math.min(month * subscriptionsPerMonth, 12 * subscriptionsPerMonth);
    const activeSubscriptionRevenue = activeSubscriptions * avgSubscriptionPrice * affiliateCommissionPct;
    
    // Transaction fees van bedrijven (actieve bedrijven, maximaal 12 maanden actief)
    const activeBusinesses = Math.min(month * subscriptionsPerMonth, 12 * subscriptionsPerMonth);
    const monthlyBusinessTransactionRevenue = activeBusinesses * businessTransactionsPerMonth * commissionPerBusinessTransaction;
    
    // Transaction fees van particuliere verkopers (actieve verkopers, maximaal 12 maanden actief)
    const activeSellers = Math.min(month * sellersPerMonth, 12 * sellersPerMonth);
    const monthlySellerTransactionRevenue = activeSellers * transactionsPerSellerPerMonth * commissionPerSellerTransaction;
    
    // Totale transactie revenue
    const totalTransactionRevenue = monthlyBusinessTransactionRevenue + monthlySellerTransactionRevenue;
    
    // Nieuwe revenue deze maand
    const newMonthlyRevenue = newSubscriptionRevenue;
    
    // Totale maandelijkse revenue (subscriptions + transacties)
    const totalMonthlyRevenueThisMonth = activeSubscriptionRevenue + totalTransactionRevenue;
    
    // Cumulative = totaal verdiend tot nu toe
    cumulativeRevenue += newMonthlyRevenue;
    
    // Total monthly = wat je deze maand verdient
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
      cumulative: cumulativeRevenue
    });
  }
  
  // Totale revenue = som van alle maandelijkse inkomsten
  const totalRevenue = monthlyBreakdown.reduce((sum, item) => sum + item.activeRevenue, 0);
  
  // Maand 12+ scenario (passief inkomen blijft doorlopen)
  const month12PlusSubscriptionRevenue = 12 * subscriptionsPerMonth * avgSubscriptionPrice * affiliateCommissionPct;
  const month12PlusBusinessTransactionRevenue = 12 * subscriptionsPerMonth * businessTransactionsPerMonth * commissionPerBusinessTransaction;
  const month12PlusSellerTransactionRevenue = 12 * sellersPerMonth * transactionsPerSellerPerMonth * commissionPerSellerTransaction;
  const month12PlusTotalTransactionRevenue = month12PlusBusinessTransactionRevenue + month12PlusSellerTransactionRevenue;
  const month12PlusTotalRevenue = month12PlusSubscriptionRevenue + month12PlusTotalTransactionRevenue;
  const year2Revenue = month12PlusTotalRevenue * 12; // 12 maanden passief inkomen
  const year3Revenue = month12PlusTotalRevenue * 12; // Nog steeds passief (als je doorgaat met nieuwe referrals)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-6">
            💰 {t('affiliate.passiveIncomeCalculator.title')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {t('affiliate.passiveIncomeCalculator.subtitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('affiliate.passiveIncomeCalculator.description')}
          </p>
        </div>

        {/* Key Insight */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-3">{t('affiliate.passiveIncomeCalculator.secretTitle')}</h2>
              <p className="text-lg mb-4">
                {t('affiliate.passiveIncomeCalculator.secretDesc')}
              </p>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="font-semibold">{t('affiliate.passiveIncomeCalculator.passiveIncomeDefinition')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('affiliate.passiveIncomeCalculator.calculatePotential')}</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('affiliate.passiveIncomeCalculator.subscriptionsPerMonth')}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={subscriptionsPerMonth}
                onChange={(e) => setSubscriptionsPerMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('affiliate.passiveIncomeCalculator.avgPricePerSubscription')}
              </label>
              <input
                type="number"
                min="39"
                max="199"
                value={avgSubscriptionPrice}
                onChange={(e) => setAvgSubscriptionPrice(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('affiliate.passiveIncomeCalculator.sellersPerMonth')}
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={sellersPerMonth}
                onChange={(e) => setSellersPerMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.passiveIncomeCalculator.sellersPerMonthDesc')}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('affiliate.passiveIncomeCalculator.transactionsPerSeller')}
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={transactionsPerSellerPerMonth}
                onChange={(e) => setTransactionsPerSellerPerMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.passiveIncomeCalculator.transactionsPerSellerDesc')}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('affiliate.passiveIncomeCalculator.transactionsPerBusiness')}
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={businessTransactionsPerMonth}
                onChange={(e) => setBusinessTransactionsPerMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.passiveIncomeCalculator.transactionsPerBusinessDesc')}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('affiliate.passiveIncomeCalculator.avgTransactionValue')}
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={avgTransactionValue}
                onChange={(e) => setAvgTransactionValue(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('affiliate.passiveIncomeCalculator.periodMonths')}
              </label>
              <input
                type="number"
                min="1"
                max="36"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          {/* Transaction Fee Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <p className="text-sm text-gray-700 mb-2">
              <strong>{t('affiliate.passiveIncomeCalculator.transactionCommission')}</strong> {t('affiliate.passiveIncomeCalculator.transactionCommissionDesc')}
            </p>
            <div className="bg-yellow-50 rounded p-3 mb-3 border border-yellow-200">
              <p className="text-xs font-semibold text-gray-800 mb-1">{t('affiliate.passiveIncomeCalculator.importantBuyers')}</p>
              <p className="text-xs text-gray-700">
                {t('affiliate.passiveIncomeCalculator.importantBuyersDesc')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded p-2">
                <strong>{t('affiliate.passiveIncomeCalculator.buyersExample')}</strong>
              </div>
              <div className="bg-white rounded p-2">
                <strong>{t('affiliate.passiveIncomeCalculator.sellersExample')}</strong>
              </div>
              <div className="bg-white rounded p-2">
                <strong>{t('affiliate.passiveIncomeCalculator.businessesExample')}</strong>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t('affiliate.passiveIncomeCalculator.totalSubscriptions')}</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{totalSubscriptions}</p>
              <p className="text-sm text-gray-600 mt-1">{t('affiliate.passiveIncomeCalculator.overMonths').replace('{months}', months.toString())}</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t('affiliate.passiveIncomeCalculator.monthlyIncome')}</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">€{totalMonthlyRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {t('affiliate.passiveIncomeCalculator.afterMonths').replace('{months}', months.toString())}
                {monthlyBreakdown.length > 0 && (
                  <span className="block mt-1 text-xs">
                    (€{monthlyBreakdown[monthlyBreakdown.length - 1].subscriptionRevenue.toFixed(2)} {t('affiliate.passiveIncomeCalculator.subscriptions').toLowerCase()} + 
                    €{monthlyBreakdown[monthlyBreakdown.length - 1].businessTransactionRevenue.toFixed(2)} {t('affiliate.passiveIncomeCalculator.fromBusinesses').toLowerCase()} + 
                    €{monthlyBreakdown[monthlyBreakdown.length - 1].sellerTransactionRevenue.toFixed(2)} {t('affiliate.passiveIncomeCalculator.fromSellers').toLowerCase()})
                  </span>
                )}
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t('affiliate.passiveIncomeCalculator.totalEarned')}</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">€{totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">{t('affiliate.passiveIncomeCalculator.cumulative')}</p>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('affiliate.passiveIncomeCalculator.monthlyGrowth')}</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('affiliate.passiveIncomeCalculator.month')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('affiliate.passiveIncomeCalculator.new')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('affiliate.passiveIncomeCalculator.active')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('affiliate.passiveIncomeCalculator.subscriptions')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('affiliate.passiveIncomeCalculator.businesses')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('affiliate.passiveIncomeCalculator.sellers')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('affiliate.passiveIncomeCalculator.total')}</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('affiliate.passiveIncomeCalculator.cumulative')}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((item) => (
                  <tr key={item.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{t('affiliate.passiveIncomeCalculator.monthLabel').replace('{month}', item.month.toString())}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{item.newSubscriptions}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{item.activeSubscriptions}</td>
                    <td className="py-3 px-4 text-right text-gray-600">€{item.subscriptionRevenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-blue-600">€{item.businessTransactionRevenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-purple-600">€{item.sellerTransactionRevenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">€{item.activeRevenue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-purple-600">€{item.cumulative.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* The Magic: Year 2+ */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6">{t('affiliate.passiveIncomeCalculator.realPassiveIncome')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">{t('affiliate.passiveIncomeCalculator.year1')}</h3>
              <p className="text-4xl font-bold mb-2">€{totalRevenue.toFixed(2)}</p>
              <p className="text-sm opacity-90">{t('affiliate.passiveIncomeCalculator.year1Desc')}</p>
              <p className="text-xs opacity-75 mt-2">
                {t('affiliate.passiveIncomeCalculator.subscriptions')}: €{monthlyBreakdown.reduce((sum, item) => sum + item.subscriptionRevenue, 0).toFixed(2)}<br/>
                {t('affiliate.passiveIncomeCalculator.fromBusinesses')} €{monthlyBreakdown.reduce((sum, item) => sum + item.businessTransactionRevenue, 0).toFixed(2)}<br/>
                {t('affiliate.passiveIncomeCalculator.fromSellers')} €{monthlyBreakdown.reduce((sum, item) => sum + item.sellerTransactionRevenue, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">{t('affiliate.passiveIncomeCalculator.year2')}</h3>
              <p className="text-4xl font-bold mb-2">€{year2Revenue.toFixed(2)}</p>
              <p className="text-sm opacity-90">{t('affiliate.passiveIncomeCalculator.year2Desc')}</p>
              <p className="text-xs opacity-75 mt-2">
                {t('affiliate.passiveIncomeCalculator.subscriptions')}: €{(month12PlusSubscriptionRevenue * 12).toFixed(2)}<br/>
                {t('affiliate.passiveIncomeCalculator.fromBusinesses')} €{(month12PlusBusinessTransactionRevenue * 12).toFixed(2)}<br/>
                {t('affiliate.passiveIncomeCalculator.fromSellers')} €{(month12PlusSellerTransactionRevenue * 12).toFixed(2)}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">{t('affiliate.passiveIncomeCalculator.year3')}</h3>
              <p className="text-4xl font-bold mb-2">€{year3Revenue.toFixed(2)}</p>
              <p className="text-sm opacity-90">{t('affiliate.passiveIncomeCalculator.year3Desc')}</p>
              <p className="text-xs opacity-75 mt-2">
                €{month12PlusTotalRevenue.toFixed(2)}{t('affiliate.passiveIncomeCalculator.perMonth')} {t('affiliate.passiveIncomeForever')}<br/>
                (€{month12PlusSubscriptionRevenue.toFixed(2)} + €{month12PlusTotalTransactionRevenue.toFixed(2)})
              </p>
            </div>
          </div>
          <div className="mt-6 bg-white/20 rounded-lg p-4">
            <p className="text-lg">
              {t('affiliate.passiveIncomeCalculator.importantNote')} <strong>{t('affiliate.passiveIncomeCalculator.importantNoteDesc')}</strong>
            </p>
          </div>
        </div>

        {/* Real Example: 2 per month */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('affiliate.passiveIncomeCalculator.practicalExample')}</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-emerald-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('affiliate.passiveIncomeCalculator.scenario')}</h3>
              <div className="space-y-2 text-gray-700">
                <p>• <strong>{t('affiliate.passiveIncomeCalculator.month1Example')}</strong></p>
                <p>• <strong>{t('affiliate.passiveIncomeCalculator.month2Example')}</strong></p>
                <p>• <strong>{t('affiliate.passiveIncomeCalculator.month3Example')}</strong></p>
                <p>• <strong>{t('affiliate.passiveIncomeCalculator.month12Example')}</strong></p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('affiliate.passiveIncomeCalculator.totalEarnedYear1')}</h3>
              <p className="text-4xl font-bold text-emerald-600 mb-2">€{totalRevenue.toFixed(2)}</p>
              <div className="text-gray-600 space-y-1 text-sm">
                <p>{t('affiliate.passiveIncomeCalculator.subscriptions')}: €{monthlyBreakdown.reduce((sum, item) => sum + item.subscriptionRevenue, 0).toFixed(2)}</p>
                <p>{t('affiliate.passiveIncomeCalculator.fromBusinesses')} €{monthlyBreakdown.reduce((sum, item) => sum + item.businessTransactionRevenue, 0).toFixed(2)} {t('affiliate.passiveIncomeCalculator.besidesSubscription')}</p>
                <p>{t('affiliate.passiveIncomeCalculator.fromSellers')} €{monthlyBreakdown.reduce((sum, item) => sum + item.sellerTransactionRevenue, 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('affiliate.passiveIncomeCalculator.passiveIncomeYear2')}</h3>
              <p className="text-4xl font-bold text-blue-600 mb-2">€{month12PlusTotalRevenue.toFixed(2)}{t('affiliate.passiveIncomeCalculator.perMonth')}</p>
              <div className="text-gray-600 space-y-1 text-sm">
                <p>{t('affiliate.passiveIncomeCalculator.subscriptions')}: €{month12PlusSubscriptionRevenue.toFixed(2)}{t('affiliate.passiveIncomeCalculator.perMonth')}</p>
                <p>{t('affiliate.passiveIncomeCalculator.fromBusinesses')} €{month12PlusBusinessTransactionRevenue.toFixed(2)}{t('affiliate.passiveIncomeCalculator.perMonth')}</p>
                <p>{t('affiliate.passiveIncomeCalculator.fromSellers')} €{month12PlusSellerTransactionRevenue.toFixed(2)}{t('affiliate.passiveIncomeCalculator.perMonth')}</p>
                <p className="font-semibold mt-2">{t('affiliate.passiveIncomeCalculator.withoutNewReferrals')} (€{year2Revenue.toFixed(2)} {t('affiliate.passiveIncomeCalculator.perYear')})</p>
              </div>
            </div>
          </div>
        </div>

        {/* The Guarantee */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('affiliate.passiveIncomeCalculator.guaranteeTitle')}</h2>
          <div className="bg-white/20 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('affiliate.passiveIncomeCalculator.evenDay364')}</h3>
                <p className="text-lg">
                  {t('affiliate.passiveIncomeCalculator.evenDay364Desc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('affiliate.passiveIncomeCalculator.revenueShareWindow')}</h3>
                <p className="text-lg">
                  {t('affiliate.passiveIncomeCalculator.revenueShareWindowDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Offer You Can't Refuse */}
        <div className="bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 text-white rounded-2xl shadow-2xl p-10 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4">{t('affiliate.passiveIncomeCalculator.offerTitle')}</h2>
              <p className="text-2xl opacity-90">{t('affiliate.passiveIncomeCalculator.offerSubtitle')}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">{t('affiliate.passiveIncomeCalculator.whatYouGet')}</h3>
                <ul className="space-y-3 text-lg">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>{t('affiliate.passiveIncomeCalculator.get1')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>{t('affiliate.passiveIncomeCalculator.get2')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>{t('affiliate.passiveIncomeCalculator.get3')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>{t('affiliate.passiveIncomeCalculator.get4')}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>{t('affiliate.passiveIncomeCalculator.get5')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">{t('affiliate.passiveIncomeCalculator.whatItCosts')}</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-6xl font-bold mb-2">€0</p>
                    <p className="text-xl opacity-90">{t('affiliate.passiveIncomeCalculator.cost1')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-6xl font-bold mb-2">€0</p>
                    <p className="text-xl opacity-90">{t('affiliate.passiveIncomeCalculator.cost2')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-6xl font-bold mb-2">€0</p>
                    <p className="text-xl opacity-90">{t('affiliate.passiveIncomeCalculator.cost3')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/30 rounded-xl p-6 backdrop-blur-sm text-center">
              <p className="text-2xl font-bold mb-4">{t('affiliate.passiveIncomeCalculator.withOnly2')}</p>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-4xl font-bold">€1,188</p>
                  <p className="text-lg opacity-90">{t('affiliate.passiveIncomeCalculator.perMonthYear2')}</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">€14,256</p>
                  <p className="text-lg opacity-90">{t('affiliate.passiveIncomeCalculator.perYearPassive')}</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">€0</p>
                  <p className="text-lg opacity-90">{t('affiliate.passiveIncomeCalculator.investmentsNeeded')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Renewal Information */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-blue-300">
          <h2 className="text-3xl font-bold mb-4 text-center">📋 {t('affiliate.contractRenewal')} & Tarieven</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
              <h3 className="text-xl font-bold mb-3">✅ {t('affiliate.guaranteed12Months')}</h3>
              <p className="text-sm opacity-95 leading-relaxed">
                {t('affiliate.guaranteed12MonthsDesc')}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
              <h3 className="text-xl font-bold mb-3">🔄 {t('affiliate.contractRenewal')}</h3>
              <p className="text-sm opacity-95 leading-relaxed">
                {t('affiliate.contractRenewalDesc')}
              </p>
            </div>
          </div>
          <div className="mt-6 bg-white/10 rounded-lg p-4 border border-white/20">
            <p className="text-sm text-center opacity-95">
              <strong>{t('affiliate.contractTerms')}:</strong> {t('affiliate.contractTermsDesc')}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('affiliate.passiveIncomeCalculator.readyToStart')}</h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('affiliate.passiveIncomeCalculator.readyToStartDesc')}
          </p>
          <Link
            href="/affiliate"
            className="inline-block bg-gradient-to-r from-emerald-600 to-green-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {t('affiliate.passiveIncomeCalculator.becomeAffiliate')}
          </Link>
        </div>
      </div>
    </div>
  );
}

