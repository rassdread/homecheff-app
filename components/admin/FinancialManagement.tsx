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
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import AdminFinancialOverview from './AdminFinancialOverview';

// Financial Reports Component
function FinancialReports() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const exportFinancialReport = async (format: 'csv' | 'json') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });

      const response = await fetch(`/api/admin/financial?${params}`);
      if (response.ok) {
        const data = await response.json();

        if (format === 'csv') {
          // Create CSV
          const headers = ['Maand', 'Orders', 'Product Omzet', 'Abonnementen', 'Uitbetalingen', 'HomeCheff Fee'];
          const rows = data.monthlyStats.map((month: any) => [
            month.month,
            month.orders,
            (month.revenue / 100).toFixed(2),
            ((month.subscriptionRevenue || 0) / 100).toFixed(2),
            (month.payouts / 100).toFixed(2),
            ((month.homecheffFee || month.platformFee) / 100).toFixed(2)
          ]);

          const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `financial_report_${dateRange.from}_${dateRange.to}.csv`;
          a.click();
        } else {
          // Create JSON
          const json = JSON.stringify(data, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `financial_report_${dateRange.from}_${dateRange.to}.json`;
          a.click();
        }
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Download className="w-5 h-5" />
        Financial Reports & Exports
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Van datum</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tot datum</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportFinancialReport('csv')}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Exporteren...' : 'Export CSV'}
          </button>
          <button
            onClick={() => exportFinancialReport('json')}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Exporteren...' : 'Export JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Transaction {
  id: string;
  amountCents: number;
  platformFeeBps: number;
  status: string;
  provider: string | null;
  providerRef: string | null;
  createdAt: string;
  User: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
  Payout: Array<{
    id: string;
    amountCents: number;
    createdAt: string;
    User: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  Refund: Array<{
    id: string;
    amountCents: number;
    createdAt: string;
  }>;
}

interface Payout {
  id: string;
  amountCents: number;
  createdAt: string;
  providerRef: string | null;
  User: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
  Transaction: {
    id: string;
    amountCents: number;
    status: string;
  };
}

interface Refund {
  id: string;
  amountCents: number;
  createdAt: string;
  providerRef: string | null;
  Transaction: {
    id: string;
    amountCents: number;
    status: string;
    User: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}

interface Subscription {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
  subscription: {
    id: string;
    name: string;
    priceCents: number;
    feeBps: number;
  };
  validUntil: string | null;
  isActive: boolean;
}

export default function FinancialManagement() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const subTabs = [
    { id: 'overview', label: 'Overzicht', icon: TrendingUp },
    { id: 'transactions', label: 'Transacties', icon: DollarSign },
    { id: 'payouts', label: 'Uitbetalingen', icon: ArrowUpRight },
    { id: 'refunds', label: 'Refunds', icon: ArrowDownRight },
    { id: 'subscriptions', label: 'Abonnementen', icon: CreditCard }
  ];

  useEffect(() => {
    if (activeSubTab !== 'overview') {
      fetchData();
    }
  }, [activeSubTab, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);

      switch (activeSubTab) {
        case 'transactions':
          const txResponse = await fetch(`/api/admin/transactions?${params}`);
          if (txResponse.ok) {
            const txData = await txResponse.json();
            setTransactions(txData.transactions || []);
          }
          break;
        case 'payouts':
          const poResponse = await fetch(`/api/admin/payouts?${params}`);
          if (poResponse.ok) {
            const poData = await poResponse.json();
            setPayouts(poData.payouts || []);
          }
          break;
        case 'refunds':
          const rfResponse = await fetch(`/api/admin/refunds?${params}`);
          if (rfResponse.ok) {
            const rfData = await rfResponse.json();
            setRefunds(rfData.refunds || []);
          }
          break;
        case 'subscriptions':
          const subResponse = await fetch(`/api/admin/subscriptions?${params}`);
          if (subResponse.ok) {
            const subData = await subResponse.json();
            setSubscriptions(subData.subscriptions || []);
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
          <nav className="flex space-x-8 px-6">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
            <div className="space-y-6">
              <AdminFinancialOverview />
              <FinancialReports />
            </div>
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

          {activeSubTab === 'subscriptions' && (
            <SubscriptionsTab
              subscriptions={subscriptions}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
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
            className="px-3 py-2 border rounded-lg"
            placeholder="Van datum"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border rounded-lg"
            placeholder="Tot datum"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Verkoper</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bedrag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Platform Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => {
                const platformFee = Math.round((tx.amountCents * tx.platformFeeBps) / 10000);
                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{tx.id.substring(0, 8)}</td>
                    <td className="px-4 py-3 text-sm">
                      {tx.User.name || tx.User.email}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(tx.amountCents)}</td>
                    <td className="px-4 py-3 text-sm text-orange-600">{formatCurrency(platformFee)}</td>
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
                );
              })}
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Uitbetalingen</h3>
          <p className="text-sm text-gray-600">Totaal: {formatCurrency(totalPayouts)}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border rounded-lg"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ontvanger</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bedrag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Transaction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {payout.User.name || payout.User.email}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    {formatCurrency(payout.amountCents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {payout.Transaction.id.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(payout.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="px-3 py-2 border rounded-lg"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Transaction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Koper</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bedrag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {refund.Transaction.id.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {refund.Transaction.User.name || refund.Transaction.User.email}
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

// Subscriptions Tab Component
function SubscriptionsTab({
  subscriptions,
  loading,
  filters,
  setFilters,
  formatCurrency,
  formatDate
}: {
  subscriptions: Subscription[];
  loading: boolean;
  filters: any;
  setFilters: any;
  formatCurrency: (cents: number) => string;
  formatDate: (date: string) => string;
}) {
  const activeSubs = subscriptions.filter(s => s.isActive).length;
  const expiredSubs = subscriptions.filter(s => !s.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Abonnementen</h3>
          <p className="text-sm text-gray-600">
            Actief: {activeSubs} | Verlopen: {expiredSubs}
          </p>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Gebruiker</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prijs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Geldig Tot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {sub.user.name || sub.user.email}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{sub.subscription.name}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(sub.subscription.priceCents)}</td>
                  <td className="px-4 py-3 text-sm text-orange-600">
                    {(sub.subscription.feeBps / 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sub.validUntil ? formatDate(sub.validUntil) : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sub.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sub.isActive ? 'Actief' : 'Verlopen'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

