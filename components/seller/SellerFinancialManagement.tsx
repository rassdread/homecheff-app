'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  User,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

interface Transaction {
  id: string;
  amountCents: number;
  platformFee: number;
  netAmount: number;
  status: string;
  provider: string | null;
  providerRef: string | null;
  createdAt: string;
  buyer: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  productTitle: string | null;
  payouts: Array<{
    id: string;
    amountCents: number;
    createdAt: string;
    providerRef: string | null;
  }>;
  refunds: Array<{
    id: string;
    amountCents: number;
    createdAt: string;
    providerRef: string | null;
  }>;
}

interface Payout {
  id: string;
  amountCents: number;
  createdAt: string;
  providerRef: string | null;
  transaction: {
    id: string;
    amountCents: number;
    productTitle: string | null;
    buyer: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
}

interface Refund {
  id: string;
  amountCents: number;
  createdAt: string;
  providerRef: string | null;
  transaction: {
    id: string;
    amountCents: number;
    productTitle: string | null;
    buyer: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
}

interface StripeStatus {
  connected: boolean;
  accountId: string | null;
  details: {
    email: string;
    country: string;
    type: string;
    businessType: string | null;
    payoutsEnabled: boolean;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
  } | null;
  payoutsEnabled: boolean;
}

export default function SellerFinancialManagement() {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });

  const subTabs = [
    { id: 'overview', label: t('seller.revenueTabOverview'), icon: TrendingUp },
    { id: 'transactions', label: t('seller.revenueTabTransactions'), icon: DollarSign },
    { id: 'payouts', label: t('seller.revenueTabPayouts'), icon: ArrowUpRight },
    { id: 'refunds', label: t('seller.revenueTabRefunds'), icon: ArrowDownRight },
    { id: 'stripe', label: t('seller.revenueTabStripe'), icon: CreditCard }
  ];

  useEffect(() => {
    if (activeSubTab === 'stripe') {
      fetchStripeStatus();
    } else if (activeSubTab !== 'overview') {
      fetchData();
    }
  }, [activeSubTab, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      switch (activeSubTab) {
        case 'transactions':
          const txResponse = await fetch(`/api/seller/transactions?${params}`);
          if (txResponse.ok) {
            const txData = await txResponse.json();
            setTransactions(txData.transactions || []);
          }
          break;
        case 'payouts':
          const poResponse = await fetch(`/api/seller/payouts?${params}`);
          if (poResponse.ok) {
            const poData = await poResponse.json();
            setPayouts(poData.payouts || []);
          }
          break;
        case 'refunds':
          const rfResponse = await fetch(`/api/seller/refunds?${params}`);
          if (rfResponse.ok) {
            const rfData = await rfResponse.json();
            setRefunds(rfData.refunds || []);
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch('/api/seller/stripe/status');
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      }
    } catch (error) {
      console.error('Error fetching Stripe status:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeSubTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab === 'overview' && (
            <SellerFinancialOverview />
          )}

          {activeSubTab === 'transactions' && (
            <TransactionsTab
              t={t}
              transactions={transactions}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeSubTab === 'payouts' && (
            <PayoutsTab
              t={t}
              payouts={payouts}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeSubTab === 'refunds' && (
            <RefundsTab
              t={t}
              refunds={refunds}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}

          {activeSubTab === 'stripe' && (
            <StripeTab
              t={t}
              stripeStatus={stripeStatus}
              loading={loading}
              onRefresh={fetchStripeStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Seller Financial Overview Component
function SellerFinancialOverview() {
  const { t, language } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    fetch('/api/seller/earnings')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const requestableCents = data?.requestableAmountCents ?? data?.pendingPayout ?? 0;
  const canRequest = !!(data?.canRequestPayout);
  const stripeAvailableCents = data?.stripeBalanceAvailableCents ?? 0;
  const canRequestBankPayout = !canRequest && data?.stripeConnected && stripeAvailableCents >= 1000;

  const handleRequestPayout = async () => {
    if (!data || !canRequest) {
      setPayoutError(t('seller.min10AndStripe') || 'Min. €10 requestable and Stripe connected.');
      return;
    }

    if (!confirm(t('seller.confirmPayout', { amount: (requestableCents / 100).toFixed(2) }))) {
      return;
    }

    setRequestingPayout(true);
    setPayoutError(null);
    setPayoutSuccess(null);

    try {
      const response = await fetch('/api/seller/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        setPayoutError(result.error || 'Failed to request payout');
        setRequestingPayout(false);
        return;
      }

      setPayoutSuccess(result.message || 'Payout requested successfully!');
      // Reload data to show updated payout status
      setTimeout(() => {
        loadData();
        setPayoutSuccess(null);
      }, 2000);
    } catch (error) {
      setPayoutError('An error occurred while requesting payout');
      console.error(error);
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleRequestBankPayout = async () => {
    if (!canRequestBankPayout) return;
    if (!confirm(t('seller.confirmBankPayout', { amount: (stripeAvailableCents / 100).toFixed(2) }))) return;
    setRequestingPayout(true);
    setPayoutError(null);
    setPayoutSuccess(null);
    try {
      const res = await fetch('/api/seller/payouts/request-bank', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        setPayoutError(result.error || 'Uitbetaling mislukt');
        setRequestingPayout(false);
        return;
      }
      setPayoutSuccess(result.message || 'Uitbetaling aangevraagd.');
      setTimeout(() => { loadData(); setPayoutSuccess(null); }, 2000);
    } catch (e) {
      setPayoutError(t('seller.payoutError') || 'Er is een fout opgetreden');
      console.error(e);
    } finally {
      setRequestingPayout(false);
    }
  };

  const locale = language === 'en' ? 'en-GB' : 'nl-NL';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" /></div>
        <div id="uitbetaling-aanvragen" className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6 scroll-mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('seller.waitingForPayout')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('seller.loadingData')}</p>
          <button disabled className="w-full mt-4 px-4 py-3 rounded-lg font-medium bg-gray-200 text-gray-500 cursor-not-allowed">
            <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" /> {t('seller.processing')}
          </button>
        </div>
      </div>
    );
  }

  const safeData = data || {};
  const displayPending = safeData.pendingPayout ?? 0;
  const displayCanRequest = !!(safeData.canRequestPayout);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">{t('seller.totalEarnings')}</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(safeData.totalEarnings ?? 0)}</p>
          <p className="text-sm text-gray-500 mt-2">{t('seller.grossTurnover')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">{t('seller.platformCosts')}</h3>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(safeData.platformFee ?? 0)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {safeData.platformFeePercentage ? `${safeData.platformFeePercentage}%` : '12%'} {t('seller.homecheffFee')}
            {safeData.platformFeePercentage && safeData.platformFeePercentage < 12 && (
              <span className="ml-2 text-emerald-600 font-medium">({t('seller.withSubscription')})</span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">
              {safeData.delivery != null ? t('seller.combinedNetEarnings') : t('seller.netEarnings')}
            </h3>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {formatCurrency(safeData.delivery != null ? (safeData.combinedNetCents ?? safeData.netEarnings ?? 0) : (safeData.netEarnings ?? 0))}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {safeData.delivery != null ? t('seller.verkoopEnBezorging') : t('seller.yourPayout')}
          </p>
          <p className="text-sm font-medium text-blue-600 mt-2">
            {t('seller.availableToRequest')}: {formatCurrency(requestableCents)}
            {safeData.delivery != null && (safeData.sellerRequestableCents ?? 0) + (safeData.deliveryRequestableCents ?? 0) > 0 && (
              <span className="block text-xs font-normal text-gray-600 mt-1">
                {t('seller.availableBreakdown')}
                {formatCurrency(safeData.sellerRequestableCents ?? 0)} {t('seller.verkoop')}, {formatCurrency(safeData.deliveryRequestableCents ?? 0)} {t('seller.bezorging')}.
              </span>
            )}
          </p>
          {(safeData.amountInEscrowCents > 0 || safeData.payoutBlockedReason === 'all_in_escrow') && (
            <>
              <p className="text-xs text-amber-700 mt-1">{t('seller.netIncludesEscrow')}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t('seller.escrowReleaseHint')}</p>
            </>
          )}
          {requestableCents === 0 && (safeData.amountInEscrowCents ?? 0) === 0 && (safeData.netEarnings ?? 0) > 0 && (
            <p className="text-xs text-gray-600 mt-1">{t('seller.netAlreadyTransferred')}</p>
          )}
          {safeData.delivery != null && (safeData.deliveryRequestableCents ?? 0) > 0 && (
            <p className="text-xs text-gray-600 mt-1">{t('seller.deliveryIncludedInPayout')}</p>
          )}
        </div>
      </div>

      {/* Direct zichtbare actie: Uitbetaling aanvragen (zodat je niet hoeft te scrollen) */}
      <div id="uitbetaling-aanvragen" className="scroll-mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('seller.payoutToBank')}</h3>
            <p className="text-emerald-50 text-sm mt-1">
              {canRequest
                ? t('seller.availableClickBelow', { amount: (requestableCents / 100).toFixed(2) })
                : canRequestBankPayout
                  ? t('seller.stripeBalancePayoutHint', { amount: (stripeAvailableCents / 100).toFixed(2) })
                  : (safeData.amountInEscrowCents ?? 0) > 0 || safeData.payoutBlockedReason === 'all_in_escrow'
                    ? t('seller.availableNowZero')
                    : ((safeData.netEarnings ?? 0) > 0 && requestableCents === 0)
                      ? t('seller.netAlreadyTransferred')
                      : t('seller.min10AndStripe')}
            </p>
            {safeData.delivery != null && (safeData.deliveryRequestableCents ?? 0) > 0 && (
              <p className="text-emerald-100 text-xs mt-1">{t('seller.payoutBannerCombined')}</p>
            )}
          </div>
          {(canRequest || canRequestBankPayout) && (
            <button
              onClick={canRequest ? handleRequestPayout : handleRequestBankPayout}
              disabled={requestingPayout}
              className="flex-shrink-0 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50"
            >
              {requestingPayout ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t('seller.processing')}
                </>
              ) : canRequest ? (
                <>
                  <ArrowUpRight className="w-5 h-5" />
                  {t('seller.requestPayout')}
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-5 h-5" />
                  {t('seller.requestBankPayout')}
                </>
              )}
            </button>
          )}
        </div>
        {payoutError && (
          <div className="mt-3 bg-red-500/20 border border-red-300 rounded-lg p-3">
            <p className="text-sm text-white">{payoutError}</p>
          </div>
        )}
        {payoutSuccess && (
          <div className="mt-3 bg-white/20 rounded-lg p-3">
            <p className="text-sm text-white">{payoutSuccess}</p>
          </div>
        )}
      </div>

      {/* Bezorgbetalingen (als gebruiker ook bezorger is) */}
      {safeData.delivery != null && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('seller.deliveryEarnings')}</h3>
            </div>
            <Link
              href="/delivery/dashboard"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              {t('seller.goToDeliveryDashboard')}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-gray-600 mb-4">{t('seller.deliveryPayoutIncluded')}</p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(safeData.delivery.totalEarningsCents ?? 0)}</p>
              <p className="text-xs text-gray-500">{t('seller.deliveryTotal')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(safeData.delivery.paidCents ?? 0)}</p>
              <p className="text-xs text-gray-500">{t('seller.deliveryPaidOut')}</p>
            </div>
            {(safeData.deliveryRequestableCents ?? 0) > 0 && (
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(safeData.deliveryRequestableCents ?? 0)}</p>
                <p className="text-xs text-gray-500">{t('seller.deliveryRequestable')}</p>
              </div>
            )}
          </div>
          {(safeData.delivery.totalEarningsCents ?? 0) > 0 && (safeData.deliveryRequestableCents ?? 0) === 0 && (safeData.requestableAmountCents ?? 0) === 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-900">{t('seller.deliveryAlreadyOnStripeExplanation')}</p>
            </div>
          )}
        </div>
      )}

      {/* Saldo op Stripe Connect (zonder in te loggen op Stripe) */}
      {safeData.stripeConnected && (safeData.stripeBalanceAvailableCents != null || safeData.stripeBalancePendingCents != null) && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-indigo-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('seller.stripeBalanceTitle')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('seller.stripeBalanceDescription')}</p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(safeData.stripeBalanceAvailableCents ?? 0)}</p>
              <p className="text-xs text-gray-500">{t('seller.stripeBalanceAvailable')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(safeData.stripeBalancePendingCents ?? 0)}</p>
              <p className="text-xs text-gray-500">{t('seller.stripeBalancePending')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uitbetaling aanvragen – details +zelfde knop voor wie doorgescrold heeft */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('seller.waitingForPayout')}</h3>
          <p className="text-sm text-gray-600 mb-2">{t('seller.viaStripeToBank')}</p>
          {safeData.delivery != null && (requestableCents > 0) && (
            <p className="text-xs text-gray-500 mb-2">{t('seller.waitingPayoutCombinedNote')}</p>
          )}
          <p className="text-4xl font-bold text-blue-600 mb-4">{formatCurrency(safeData.pendingPayout ?? requestableCents)}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <Clock className="w-4 h-4 inline mr-1" />
              {(safeData.pendingPayout ?? requestableCents) > 0 
                ? t('seller.clickRequestPayout')
                : t('seller.noAmountAvailable')}
            </p>
            {payoutError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-red-800">{payoutError}</p>
              </div>
            )}
            {payoutSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-green-800">{payoutSuccess}</p>
              </div>
            )}
            <button
              onClick={canRequest ? handleRequestPayout : canRequestBankPayout ? handleRequestBankPayout : undefined}
              disabled={requestingPayout || !canRequest && !canRequestBankPayout}
              className={`w-full mt-4 px-4 py-3 rounded-lg font-medium transition-colors ${
                requestingPayout || (!canRequest && !canRequestBankPayout)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {requestingPayout ? (
                <>
                  <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                  Verwerken...
                </>
              ) : canRequest ? (
                <>
                  <ArrowUpRight className="w-4 h-4 inline mr-2" />
                  {t('seller.requestPayoutToBank')}
                </>
              ) : canRequestBankPayout ? (
                <>
                  <ArrowUpRight className="w-4 h-4 inline mr-2" />
                  {t('seller.requestBankPayout')}
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 inline mr-2" />
                  {t('seller.requestPayoutStripe')}
                </>
              )}
            </button>
            {!canRequest && !canRequestBankPayout && (
              <div className="text-sm text-gray-700 mt-3 bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="font-medium text-amber-900 mb-1">{t('seller.whyCantPayout')}</p>
                {safeData.payoutBlockedReason === 'no_transactions' && (
                  <p>{t('seller.payoutReasonNoTransactions')}</p>
                )}
                {safeData.payoutBlockedReason === 'all_in_escrow' && (
                  <>
                    <p>{t('seller.payoutReasonAllInEscrow')}</p>
                    <p className="mt-2 text-gray-600">{t('seller.payoutReasonEscrowAdmin')}</p>
                  </>
                )}
                {safeData.payoutBlockedReason === 'already_paid_out' && (
                  <p>{t('seller.payoutReasonAlreadyPaidOut')}</p>
                )}
                {safeData.payoutBlockedReason === 'below_minimum' && (
                  <p>{t('seller.payoutReasonBelowMinimum')}</p>
                )}
                {!safeData.payoutBlockedReason && (
                  <p>{t('seller.payoutReasonDefault')}</p>
                )}
                {safeData.payoutBlockedReason !== 'already_paid_out' && (
                  <p className="mt-2 text-gray-600">{t('seller.payoutReasonStripeNote')}</p>
                )}
              </div>
            )}
            {requestableCents > 0 && requestableCents < 1000 && safeData.stripeConnected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-yellow-800">
                  {t('seller.minimumAmount', { amount: (requestableCents / 100).toFixed(2) })}
                </p>
              </div>
            )}
            {(safeData.pendingPayout ?? 0) > 0 && !safeData.stripeConnected && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-orange-800">
                  <strong>⚠️ {t('seller.stripeNotConnected')}</strong><br />
                  {t('seller.linkStripeTab')}
                </p>
              </div>
            )}
            {((safeData.pendingPayout ?? 0) > 0 || safeData.stripeConnected) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-blue-800">
                  <strong>{t('seller.payoutViaStripeTitle')}</strong><br />
                  • {t('seller.payoutViaStripeBullet1')}<br />
                  • {t('seller.payoutViaStripeBullet2')}<br />
                  • {t('seller.payoutViaStripeBullet3')}<br />
                  • {t('seller.payoutViaStripeBullet4')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('seller.lastPayout')}</h3>
          <p className="text-4xl font-bold text-green-600 mb-2">
            {formatCurrency(safeData.lastPayout ?? 0)}
          </p>
          <p className="text-sm text-gray-600 mb-3">
            {safeData.lastPayoutDate 
              ? new Date(safeData.lastPayoutDate).toLocaleDateString(locale, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })
              : t('seller.notYetPaidOut')}
          </p>
          {!safeData.stripeConnected && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
              <p className="text-xs text-orange-800">
                <strong>⚠️ {t('seller.stripeNotConnected')}</strong><br />
                {t('seller.linkStripeTab')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Transactions Tab Component
function TransactionsTab({
  t,
  transactions,
  loading,
  filters,
  setFilters,
  formatCurrency,
  formatDate
}: {
  t: (key: string) => string;
  transactions: Transaction[];
  loading: boolean;
  filters: any;
  setFilters: any;
  formatCurrency: (cents: number) => string;
  formatDate: (date: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('seller.transactionsTitle')}</h3>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.product')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.buyer')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.gross')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.platformFee')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.net')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{tx.productTitle || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    {tx.buyer?.name || tx.buyer?.email || t('seller.unknownBuyer')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(tx.amountCents)}</td>
                  <td className="px-4 py-3 text-sm text-orange-600">-{formatCurrency(tx.platformFee)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">{formatCurrency(tx.netAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tx.status === 'CAPTURED' ? 'bg-green-100 text-green-800' :
                      tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Payouts Tab Component
function PayoutsTab({
  t,
  payouts,
  loading,
  filters,
  setFilters,
  formatCurrency,
  formatDate
}: {
  t: (key: string) => string;
  payouts: Payout[];
  loading: boolean;
  filters: any;
  setFilters: any;
  formatCurrency: (cents: number) => string;
  formatDate: (date: string) => string;
}) {
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amountCents, 0);
  const completedPayouts = payouts.filter(p => p.providerRef && !p.providerRef.startsWith('failed')).length;
  const pendingPayouts = payouts.filter(p => !p.providerRef || p.providerRef.startsWith('failed')).length;
  const isManualPayout = (payout: Payout) => payout.id.includes('_') && payout.id.split('_').length >= 3;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">{t('seller.totalPaidOut')}</h4>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayouts)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">{t('seller.completed')}</h4>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{completedPayouts}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">{t('seller.inProgress')}</h4>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{pendingPayouts}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {t('seller.howPayoutsWork')}
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div>
            <strong>🤖 {t('seller.autoPayoutTitle')}</strong>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>{t('seller.autoPayout1')}</li>
              <li>{t('seller.autoPayout2')}</li>
              <li>{t('seller.autoPayout3')}</li>
            </ul>
          </div>
          <div>
            <strong>👤 {t('seller.manualPayoutTitle')}</strong>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>{t('seller.manualPayout1')}</li>
              <li>{t('seller.manualPayout2')}</li>
              <li>{t('seller.manualPayout3')}</li>
            </ul>
          </div>
          <div className="pt-2 border-t border-blue-300">
            <p>⏱️ <strong>{t('seller.processingTime')}</strong> {t('seller.processingTimeText')}</p>
            <p>📧 <strong>{t('seller.notifications')}</strong> {t('seller.notificationsText')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">{t('seller.payoutsHistory')}</h3>
          <p className="text-sm text-gray-600">{payouts.length === 1 ? t('seller.payoutsCount').replace('{count}', '1') : t('seller.payoutsCountPlural').replace('{count}', String(payouts.length))}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder={t('seller.fromDate')}
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder={t('seller.toDate')}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('seller.type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('seller.product')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('seller.buyer')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('seller.amount')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('seller.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('seller.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">{t('seller.noPayoutsYet')}</p>
                      <p className="text-xs mt-1 text-gray-400">{t('seller.payoutsAppearHere')}</p>
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isManualPayout(payout)
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isManualPayout(payout) ? (
                            <>
                              <User className="w-3 h-3" />
                              {t('seller.manual')}
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              {t('seller.automatic')}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payout.transaction.productTitle || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payout.transaction.buyer?.name || payout.transaction.buyer?.email || t('seller.unknownBuyer')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatCurrency(payout.amountCents)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          payout.providerRef && !payout.providerRef.startsWith('failed')
                            ? 'bg-green-100 text-green-800'
                            : payout.providerRef?.startsWith('failed')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payout.providerRef && !payout.providerRef.startsWith('failed') ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              {t('seller.paidOut')}
                            </>
                          ) : payout.providerRef?.startsWith('failed') ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              {t('seller.failed')}
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              {t('seller.inProgress')}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(payout.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Refunds Tab Component
function RefundsTab({
  t,
  refunds,
  loading,
  filters,
  setFilters,
  formatCurrency,
  formatDate
}: {
  t: (key: string) => string;
  refunds: Refund[];
  loading: boolean;
  filters: any;
  setFilters: any;
  formatCurrency: (cents: number) => string;
  formatDate: (date: string) => string;
}) {
  const totalRefunds = refunds.reduce((sum, r) => sum + r.amountCents, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('seller.revenueTabRefunds')}</h3>
          <p className="text-sm text-gray-600">{t('seller.refundsTotal')} {formatCurrency(totalRefunds)}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.product')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.buyer')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.amount')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('seller.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{refund.transaction.productTitle || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    {refund.transaction.buyer?.name || refund.transaction.buyer?.email || t('seller.unknownBuyer')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">
                    -{formatCurrency(refund.amountCents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(refund.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Stripe Connect Tab Component
function StripeTab({
  t,
  stripeStatus,
  loading,
  onRefresh
}: {
  t: (key: string) => string;
  stripeStatus: StripeStatus | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  if (!stripeStatus) {
    return <div className="text-center py-12 text-gray-600">{t('seller.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('seller.stripeConnectStatus')}</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          {t('seller.refresh')}
        </button>
      </div>

      {stripeStatus.connected ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500 rounded-full">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">✅ {t('seller.stripeConnected')}</h3>
              <p className="text-gray-700 mb-4">
                {t('seller.stripeConnectedDesc')}
              </p>
              {stripeStatus.details && (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">{t('seller.accountId')}:</span> {stripeStatus.accountId}</p>
                  <p><span className="font-medium">{t('seller.email')}:</span> {stripeStatus.details.email}</p>
                  <p><span className="font-medium">{t('seller.country')}:</span> {stripeStatus.details.country}</p>
                  <p><span className="font-medium">{t('seller.type')}:</span> {stripeStatus.details.type}</p>
                  <p>
                    <span className="font-medium">{t('seller.payoutsEnabled')}</span>{' '}
                    {stripeStatus.details.payoutsEnabled ? (
                      <span className="text-green-600">{t('seller.payoutsEnabledYes')}</span>
                    ) : (
                      <span className="text-orange-600">{t('seller.payoutsEnabledNo')}</span>
                    )}
                  </p>
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <Link href="/seller/stripe/refresh">
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Eye className="w-4 h-4 inline mr-2" />
                    {t('seller.viewInStripeDashboard')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-full">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('seller.stripeNotConnectedTitle')}</h3>
              <p className="text-gray-700 mb-4">
                {t('seller.stripeNotConnectedDesc')}
              </p>
              <Link href="/seller/stripe/onboard">
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  {t('seller.connectStripeAccount')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




