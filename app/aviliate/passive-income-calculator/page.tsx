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
            💰 Passief Inkomen Calculator
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Bouw Je Passieve Inkomen Op
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ontdek hoe je met slechts 2 abonnementen per maand een blijvend passief inkomen opbouwt
          </p>
        </div>

        {/* Key Insight */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-3">Het Geheim: 12 Maanden Revenue Share</h2>
              <p className="text-lg mb-4">
                Zelfs als je op dag 364 iemand aanbrengt, krijg je nog steeds 12 maanden lang commissie. 
                Ook als je geen affiliate meer bent, blijven je inkomsten doorlopen zolang de revenue share window actief is!
              </p>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="font-semibold">✨ Passief inkomen = Inkomsten die blijven doorlopen, zelfs als je stopt met werken</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bereken Je Potentieel</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abonnementen per maand
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
                Gemiddelde prijs per abonnement (€/maand)
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
                Particuliere verkopers per maand
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={sellersPerMonth}
                onChange={(e) => setSellersPerMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Particuliere verkopers die je aanbrengt</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transacties per verkoper per maand
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={transactionsPerSellerPerMonth}
                onChange={(e) => setTransactionsPerSellerPerMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Gemiddeld aantal transacties per verkoper</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transacties per bedrijf per maand
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={businessTransactionsPerMonth}
                onChange={(e) => setBusinessTransactionsPerMonth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Gemiddeld aantal transacties per bedrijf (naast abonnement!)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gemiddelde transactie waarde (€)
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
                Periode (maanden)
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
              <strong>Transactie commissie:</strong> Je verdient 25% van de HomeCheff platform fee per transactie.
            </p>
            <div className="bg-yellow-50 rounded p-3 mb-3 border border-yellow-200">
              <p className="text-xs font-semibold text-gray-800 mb-1">✨ Belangrijk: Ook van Kopers!</p>
              <p className="text-xs text-gray-700">
                Als je een <strong>koper</strong> aanbrengt (die niets verkoopt), krijg je ook 25% commissie op elke transactie die deze koper doet! 
                Als zowel koper als verkoper zijn aangebracht, krijg je 50% (25% + 25%).
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded p-2">
                <strong>Kopers:</strong> 12% fee → €100 transactie = €12 fee → <strong>€3 commissie</strong>
              </div>
              <div className="bg-white rounded p-2">
                <strong>Particuliere verkopers:</strong> 12% fee → €100 transactie = €12 fee → <strong>€3 commissie</strong>
              </div>
              <div className="bg-white rounded p-2">
                <strong>Bedrijven (Pro):</strong> 4% fee → €100 transactie = €4 fee → <strong>€1 commissie</strong> (naast abonnement!)
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Totaal Abonnementen</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{totalSubscriptions}</p>
              <p className="text-sm text-gray-600 mt-1">Over {months} maanden</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Maandelijks Inkomen</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">€{totalMonthlyRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                Na {months} maanden (passief!)
                {monthlyBreakdown.length > 0 && (
                  <span className="block mt-1 text-xs">
                    (€{monthlyBreakdown[monthlyBreakdown.length - 1].subscriptionRevenue.toFixed(2)} subscriptions + 
                    €{monthlyBreakdown[monthlyBreakdown.length - 1].businessTransactionRevenue.toFixed(2)} van bedrijven + 
                    €{monthlyBreakdown[monthlyBreakdown.length - 1].sellerTransactionRevenue.toFixed(2)} van verkopers)
                  </span>
                )}
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Totaal Verdiend</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">€{totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">Cumulatief</p>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Maandelijkse Groei</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Maand</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Nieuwe</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actief</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Subscriptions</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Bedrijven</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Verkopers</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Totaal</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cumulatief</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((item) => (
                  <tr key={item.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">Maand {item.month}</td>
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
          <h2 className="text-3xl font-bold mb-6">🎯 Het Echte Passieve Inkomen</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Jaar 1</h3>
              <p className="text-4xl font-bold mb-2">€{totalRevenue.toFixed(2)}</p>
              <p className="text-sm opacity-90">Totaal verdiend in eerste jaar</p>
              <p className="text-xs opacity-75 mt-2">
                Subscriptions: €{monthlyBreakdown.reduce((sum, item) => sum + item.subscriptionRevenue, 0).toFixed(2)}<br/>
                Van bedrijven: €{monthlyBreakdown.reduce((sum, item) => sum + item.businessTransactionRevenue, 0).toFixed(2)}<br/>
                Van verkopers: €{monthlyBreakdown.reduce((sum, item) => sum + item.sellerTransactionRevenue, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Jaar 2 (Passief!)</h3>
              <p className="text-4xl font-bold mb-2">€{year2Revenue.toFixed(2)}</p>
              <p className="text-sm opacity-90">Zonder nieuwe referrals!</p>
              <p className="text-xs opacity-75 mt-2">
                Subscriptions: €{(month12PlusSubscriptionRevenue * 12).toFixed(2)}<br/>
                Van bedrijven: €{(month12PlusBusinessTransactionRevenue * 12).toFixed(2)}<br/>
                Van verkopers: €{(month12PlusSellerTransactionRevenue * 12).toFixed(2)}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3">Jaar 3 (Nog steeds passief!)</h3>
              <p className="text-4xl font-bold mb-2">€{year3Revenue.toFixed(2)}</p>
              <p className="text-sm opacity-90">Inkomsten blijven doorlopen</p>
              <p className="text-xs opacity-75 mt-2">
                €{month12PlusTotalRevenue.toFixed(2)}/maand blijvend<br/>
                (€{month12PlusSubscriptionRevenue.toFixed(2)} + €{month12PlusTotalTransactionRevenue.toFixed(2)})
              </p>
            </div>
          </div>
          <div className="mt-6 bg-white/20 rounded-lg p-4">
            <p className="text-lg">
              💡 <strong>Belangrijk:</strong> Na 12 maanden stoppen de inkomsten per referral, 
              maar omdat je elke maand nieuwe referrals toevoegt, bouw je een blijvend passief inkomen op!
            </p>
          </div>
        </div>

        {/* Real Example: 2 per month */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Praktijkvoorbeeld: 2 Abonnementen per Maand</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-emerald-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Scenario: €99/maand gemiddeld abonnement</h3>
              <div className="space-y-2 text-gray-700">
                <p>• <strong>Maand 1:</strong> 2 nieuwe → €99/maand passief inkomen</p>
                <p>• <strong>Maand 2:</strong> 2 nieuwe → €198/maand passief inkomen (4 actief)</p>
                <p>• <strong>Maand 3:</strong> 2 nieuwe → €297/maand passief inkomen (6 actief)</p>
                <p>• <strong>Maand 12:</strong> 2 nieuwe → €1,188/maand passief inkomen (24 actief)</p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">💰 Totaal Verdiend in Jaar 1:</h3>
              <p className="text-4xl font-bold text-emerald-600 mb-2">€{totalRevenue.toFixed(2)}</p>
              <div className="text-gray-600 space-y-1 text-sm">
                <p>Subscriptions: €{monthlyBreakdown.reduce((sum, item) => sum + item.subscriptionRevenue, 0).toFixed(2)}</p>
                <p>Van bedrijven: €{monthlyBreakdown.reduce((sum, item) => sum + item.businessTransactionRevenue, 0).toFixed(2)} (naast abonnement!)</p>
                <p>Van verkopers: €{monthlyBreakdown.reduce((sum, item) => sum + item.sellerTransactionRevenue, 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🚀 Passief Inkomen in Jaar 2:</h3>
              <p className="text-4xl font-bold text-blue-600 mb-2">€{month12PlusTotalRevenue.toFixed(2)}/maand</p>
              <div className="text-gray-600 space-y-1 text-sm">
                <p>Subscriptions: €{month12PlusSubscriptionRevenue.toFixed(2)}/maand</p>
                <p>Van bedrijven: €{month12PlusBusinessTransactionRevenue.toFixed(2)}/maand</p>
                <p>Van verkopers: €{month12PlusSellerTransactionRevenue.toFixed(2)}/maand</p>
                <p className="font-semibold mt-2">Zonder nieuwe referrals! (€{year2Revenue.toFixed(2)} per jaar)</p>
              </div>
            </div>
          </div>
        </div>

        {/* The Guarantee */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-4">🛡️ De Garantie: Passief Inkomen Blijft Doorlopen</h2>
          <div className="bg-white/20 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Zelfs op dag 364...</h3>
                <p className="text-lg">
                  Als je op dag 364 van je affiliate programma iemand aanbrengt, krijg je nog steeds 12 maanden lang commissie. 
                  <strong> Ook als je daarna geen affiliate meer bent, blijven je inkomsten doorlopen!</strong>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Revenue Share Window = 12 Maanden</h3>
                <p className="text-lg">
                  Elke referral heeft zijn eigen 12-maanden revenue share window. 
                  Zolang die window actief is, krijg je commissie — ongeacht je affiliate status!
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
              <h2 className="text-4xl font-bold mb-4">Een Aanbod Dat Je Niet Kunt Weigeren</h2>
              <p className="text-2xl opacity-90">💰 100% Gratis • Geen Verborgen Kosten • Direct Starten</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">Wat Je Krijgt:</h3>
                <ul className="space-y-3 text-lg">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>50% van elke subscription fee (12 maanden lang)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>25% per gebruiker (50% als je beide aanbrengt)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>Eigen promo codes met volledige controle</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>Automatische wekelijkse uitbetalingen</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <span>Passief inkomen dat blijft doorlopen</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">Wat Het Kost:</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-6xl font-bold mb-2">€0</p>
                    <p className="text-xl opacity-90">Geen aanmeldkosten</p>
                  </div>
                  <div className="text-center">
                    <p className="text-6xl font-bold mb-2">€0</p>
                    <p className="text-xl opacity-90">Geen maandelijkse kosten</p>
                  </div>
                  <div className="text-center">
                    <p className="text-6xl font-bold mb-2">€0</p>
                    <p className="text-xl opacity-90">Geen verborgen kosten</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/30 rounded-xl p-6 backdrop-blur-sm text-center">
              <p className="text-2xl font-bold mb-4">📊 Met Slechts 2 Abonnementen per Maand:</p>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-4xl font-bold">€1,188</p>
                  <p className="text-lg opacity-90">per maand (jaar 2+)</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">€14,256</p>
                  <p className="text-lg opacity-90">per jaar (passief!)</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">€0</p>
                  <p className="text-lg opacity-90">investeringen nodig</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Klaar om te Starten?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Word affiliate en begin vandaag nog met het opbouwen van je passieve inkomen
          </p>
          <Link
            href="/affiliate"
            className="inline-block bg-gradient-to-r from-emerald-600 to-green-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Word Nu Affiliate — Gratis
          </Link>
        </div>
      </div>
    </div>
  );
}

