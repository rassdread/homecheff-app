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
  Eye
} from 'lucide-react';
import Link from 'next/link';

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
    { id: 'overview', label: 'Overzicht', icon: TrendingUp },
    { id: 'transactions', label: 'Transacties', icon: DollarSign },
    { id: 'payouts', label: 'Uitbetalingen', icon: ArrowUpRight },
    { id: 'refunds', label: 'Refunds', icon: ArrowDownRight },
    { id: 'stripe', label: 'Stripe Connect', icon: CreditCard }
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

  const handleRequestPayout = async () => {
    if (!data || data.pendingPayout < 1000) { // Minimum €10
      setPayoutError('Minimum payout amount is €10.00');
      return;
    }

    if (!confirm(`Weet je zeker dat je €${(data.pendingPayout / 100).toFixed(2)} wilt uitbetaald krijgen?`)) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100);
  };

  if (loading) {
    return <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Totale Verdiensten</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalEarnings)}</p>
          <p className="text-sm text-gray-500 mt-2">Bruto omzet</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Platform Kosten</h3>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.platformFee)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {data.platformFeePercentage ? `${data.platformFeePercentage}%` : '12%'} HomeCheff platform fee
            {data.platformFeePercentage && data.platformFeePercentage < 12 && (
              <span className="ml-2 text-emerald-600 font-medium">(Met abonnement)</span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Netto Verdiensten</h3>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(data.netEarnings)}</p>
          <p className="text-sm text-gray-500 mt-2">Jouw uitbetaling</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wachtend op Uitbetaling</h3>
          <p className="text-4xl font-bold text-blue-600 mb-4">{formatCurrency(data.pendingPayout)}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <Clock className="w-4 h-4 inline mr-1" />
              {data.pendingPayout > 0 
                ? 'Klik op "Aanvragen" om de uitbetaling te verwerken'
                : 'Geen uitbetalingen in behandeling'}
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
            {data.pendingPayout >= 1000 && data.stripeConnected && (
              <button
                onClick={handleRequestPayout}
                disabled={requestingPayout}
                className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                  requestingPayout
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {requestingPayout ? (
                  <>
                    <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                    Verwerken...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 inline mr-2" />
                    Uitbetaling Aanvragen
                  </>
                )}
              </button>
            )}
            {data.pendingPayout > 0 && data.pendingPayout < 1000 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-yellow-800">
                  <strong>Minimum bedrag:</strong> Je moet minimaal €10,00 hebben om een uitbetaling aan te vragen. Je hebt nu €{(data.pendingPayout / 100).toFixed(2)}.
                </p>
              </div>
            )}
            {data.pendingPayout > 0 && !data.stripeConnected && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-orange-800">
                  <strong>⚠️ Stripe Account niet gekoppeld</strong><br />
                  Om uitbetalingen te ontvangen moet je eerst je Stripe account koppelen. Ga naar de "Stripe Connect" tab.
                </p>
              </div>
            )}
            {data.pendingPayout > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-blue-800">
                  <strong>Hoe werkt het?</strong><br />
                  • Betalingen worden automatisch verwerkt na succesvolle bestelling<br />
                  • Je kunt ook handmatig een uitbetaling aanvragen (minimaal €10,00)<br />
                  • Stripe verwerkt de uitbetaling naar je gekoppelde bankrekening binnen 2-5 werkdagen<br />
                  • Je ontvangt een e-mail wanneer de uitbetaling is voltooid<br />
                  • Bekijk de "Uitbetalingen" tab voor een overzicht van alle betalingen
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Laatste Uitbetaling</h3>
          <p className="text-4xl font-bold text-green-600 mb-2">
            {formatCurrency(data.lastPayout)}
          </p>
          <p className="text-sm text-gray-600 mb-3">
            {data.lastPayoutDate 
              ? new Date(data.lastPayoutDate).toLocaleDateString('nl-NL', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Nog niet uitbetaald'}
          </p>
          {!data.stripeConnected && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
              <p className="text-xs text-orange-800">
                <strong>⚠️ Stripe Account niet gekoppeld</strong><br />
                Om uitbetalingen te ontvangen moet je eerst je Stripe account koppelen. Ga naar de "Stripe Connect" tab.
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
  transactions,
  loading,
  filters,
  setFilters,
  formatCurrency,
  formatDate
}: {
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
        <h3 className="text-lg font-semibold">Transacties</h3>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Koper</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bruto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Platform Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Netto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{tx.productTitle || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    {tx.buyer?.name || tx.buyer?.email || 'Onbekend'}
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
  payouts,
  loading,
  filters,
  setFilters,
  formatCurrency,
  formatDate
}: {
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
  
  // Determine if payout is manual request (IDs starting with payout_ and containing multiple timestamps)
  const isManualPayout = (payout: Payout) => {
    return payout.id.includes('_') && payout.id.split('_').length >= 3;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Totaal Uitbetaald</h4>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayouts)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Voltooid</h4>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{completedPayouts}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">In Behandeling</h4>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{pendingPayouts}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Hoe werken uitbetalingen?
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div>
            <strong>🤖 Automatische Uitbetaling:</strong>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Verwerkt <strong>direct</strong> na een succesvolle bestelling</li>
              <li>Geen actie vereist van jou</li>
              <li>Ideaal voor dagelijkse verkopen</li>
            </ul>
          </div>
          <div>
            <strong>👤 Handmatige Aanvraag:</strong>
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li>Je kunt <strong>zelf een uitbetaling aanvragen</strong> (minimaal €10,00)</li>
              <li>Groepeert alle openstaande transacties</li>
              <li>Handig voor bulk-uitbetalingen</li>
            </ul>
          </div>
          <div className="pt-2 border-t border-blue-300">
            <p>⏱️ <strong>Verwerkingstijd:</strong> Stripe verwerkt uitbetalingen naar je bankrekening binnen <strong>2-5 werkdagen</strong></p>
            <p>📧 <strong>Notificaties:</strong> Je ontvangt een e-mailbevestiging wanneer de uitbetaling is voltooid</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">Uitbetalingen Geschiedenis</h3>
          <p className="text-sm text-gray-600">{payouts.length} uitbetaling{payouts.length !== 1 ? 'en' : ''}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="Van datum"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="Tot datum"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Koper</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Nog geen uitbetalingen</p>
                      <p className="text-xs mt-1 text-gray-400">Uitbetalingen verschijnen hier zodra ze zijn verwerkt</p>
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
                              Handmatig
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Automatisch
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payout.transaction.productTitle || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payout.transaction.buyer?.name || payout.transaction.buyer?.email || 'Onbekend'}
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
                              Uitbetaald
                            </>
                          ) : payout.providerRef?.startsWith('failed') ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              Mislukt
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              In behandeling
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
  refunds,
  loading,
  filters,
  setFilters,
  formatCurrency,
  formatDate
}: {
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
          <h3 className="text-lg font-semibold">Refunds</h3>
          <p className="text-sm text-gray-600">Totaal: {formatCurrency(totalRefunds)}</p>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Koper</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bedrag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{refund.transaction.productTitle || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    {refund.transaction.buyer?.name || refund.transaction.buyer?.email || 'Onbekend'}
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
  stripeStatus,
  loading,
  onRefresh
}: {
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
    return <div className="text-center py-12 text-gray-600">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Stripe Connect Status</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Ververs
        </button>
      </div>

      {stripeStatus.connected ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500 rounded-full">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">✅ Stripe Verbonden</h3>
              <p className="text-gray-700 mb-4">
                Je account is gekoppeld en uitbetalingen zijn ingeschakeld
              </p>
              {stripeStatus.details && (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Account ID:</span> {stripeStatus.accountId}</p>
                  <p><span className="font-medium">Email:</span> {stripeStatus.details.email}</p>
                  <p><span className="font-medium">Land:</span> {stripeStatus.details.country}</p>
                  <p><span className="font-medium">Type:</span> {stripeStatus.details.type}</p>
                  <p>
                    <span className="font-medium">Uitbetalingen:</span>{' '}
                    {stripeStatus.details.payoutsEnabled ? (
                      <span className="text-green-600">Ingeschakeld</span>
                    ) : (
                      <span className="text-orange-600">Nog niet ingeschakeld</span>
                    )}
                  </p>
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <Link href="/seller/stripe/refresh">
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Eye className="w-4 h-4 inline mr-2" />
                    Bekijk in Stripe Dashboard
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stripe Account Niet Gekoppeld</h3>
              <p className="text-gray-700 mb-4">
                Om uitbetalingen te ontvangen moet je eerst je Stripe account koppelen
              </p>
              <Link href="/seller/stripe/onboard">
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Stripe Account Koppelen
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




