'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DollarSign,
  Users,
  Truck,
  TrendingUp,
  Download,
  FileText,
  CheckCircle,
  Clock,
  Wallet,
  Package,
  Gift,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

interface CombinedEarnings {
  seller?: {
    totalEarnings: number;
    pendingPayout: number;
    availablePayout: number;
    paidPayout: number;
    platformFee: number;
    netEarnings: number;
    totalOrders: number;
  };
  delivery?: {
    totalEarnings: number;
    paidPayout?: number;
    totalDeliveries: number;
    completedDeliveries: number;
  };
  affiliate?: {
    totalEarnings: number;
    pendingCents: number;
    availableCents: number;
    paidCents: number;
    totalReferrals: number;
  };
}

interface Totals {
  totalEarnings: number;
  totalAvailable: number;
  totalPaid: number;
}

interface Roles {
  isSeller: boolean;
  isDelivery: boolean;
  isAffiliate: boolean;
}

function VerdienstenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t('earningsPage.title')} | HomeCheff`;
  }, [language, t]);
  const [earnings, setEarnings] = useState<CombinedEarnings | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [roles, setRoles] = useState<Roles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const payoutSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCombinedEarnings();
  }, []);

  // Na "Uitbetaling aanvragen" (link met ?uitbetaling=1): scroll naar keuze-uitbetaling
  useEffect(() => {
    if (loading || error || !earnings) return;
    if (searchParams?.get('uitbetaling') === '1' && payoutSectionRef.current) {
      payoutSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, error, earnings, searchParams]);

  const fetchCombinedEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/earnings/combined');
      if (response.ok) {
        const data = await response.json();
        setEarnings(data.earnings);
        setTotals(data.totals);
        setRoles(data.roles);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || t('earningsPage.loadError'));
      }
    } catch (err) {
      console.error('Error fetching combined earnings:', err);
      setError(t('earningsPage.loadErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    const locale = language === 'en' ? 'en-GB' : 'nl-NL';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/earnings/export?format=${format}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verdiensten-overzicht-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Fout bij exporteren van verdiensten');
      }
    } catch (error) {
      console.error('Error exporting earnings:', error);
      alert('Fout bij exporteren van verdiensten');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verdiensten laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCombinedEarnings}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (!earnings || !totals || !roles) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">{t('earningsPage.noEarningsFound')}</p>
      </div>
    );
  }

  const hasAnyRole = roles.isSeller || roles.isDelivery || roles.isAffiliate;

  if (!hasAnyRole) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('earningsPage.noActiveRoles')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('earningsPage.noRolesDescription')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/sell"
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {t('earningsPage.becomeSeller')}
              </Link>
              <Link
                href="/delivery/signup"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('earningsPage.becomeDeliverer')}
              </Link>
              <Link
                href="/affiliate"
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {t('earningsPage.becomeAffiliate')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('earningsPage.title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {t('earningsPage.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('earningsPage.exportCsv')}</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{t('earningsPage.exportPdf')}</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro: deze pagina = keuze wat en hoeveel uitbetalen */}
        <div className="mb-8 p-4 sm:p-6 bg-white rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('earningsPage.requestPayoutSection')}</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            {t('earningsPage.requestPayoutIntro')}
          </p>
        </div>

        {/* Total Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-sm border-2 border-emerald-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">{t('earningsPage.totalEarned')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-2">
                  {formatCurrency(totals.totalEarnings)}
                </p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">{t('earningsPage.available')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">
                  {formatCurrency(totals.totalAvailable)}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl shadow-sm border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('earningsPage.paidOut')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(totals.totalPaid)}
                </p>
              </div>
              <div className="p-3 bg-gray-500 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific Earnings */}
        <div className="space-y-6">
          {/* Seller Earnings */}
          {roles.isSeller && earnings.seller && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('earningsPage.seller')}</h2>
                    <p className="text-sm text-gray-600">{t('earningsPage.ordersCount', { count: earnings.seller.totalOrders })}</p>
                  </div>
                </div>
                <Link
                  href="/verkoper/dashboard"
                  className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {t('earningsPage.dashboard')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.grossRevenue')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(earnings.seller.totalEarnings)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.platformFee')}</p>
                  <p className="text-lg font-semibold text-orange-600">
                    -{formatCurrency(earnings.seller.platformFee)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.netEarned')}</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {formatCurrency(earnings.seller.netEarnings)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.available')}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(earnings.seller.availablePayout)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Earnings */}
          {roles.isDelivery && earnings.delivery && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('earningsPage.deliverer')}</h2>
                    <p className="text-sm text-gray-600">
                      {t('earningsPage.deliveriesCompleted', { completed: earnings.delivery.completedDeliveries, total: earnings.delivery.totalDeliveries })}
                    </p>
                  </div>
                </div>
                <Link
                  href="/delivery/dashboard"
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {t('earningsPage.dashboard')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.totalEarnedLabel')}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(earnings.delivery.totalEarnings)}
                  </p>
                </div>
                {typeof earnings.delivery.paidPayout === 'number' && (
                  <div>
                    <p className="text-sm text-gray-600">{t('earningsPage.officiallyPaidOut')}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(earnings.delivery.paidPayout)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.deliveries')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {earnings.delivery.totalDeliveries}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.completed')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {earnings.delivery.completedDeliveries}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Affiliate Earnings */}
          {roles.isAffiliate && earnings.affiliate && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Gift className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('earningsPage.affiliate')}</h2>
                    <p className="text-sm text-gray-600">{t('earningsPage.referralsCount', { count: earnings.affiliate.totalReferrals })}</p>
                  </div>
                </div>
                <Link
                  href="/affiliate/dashboard"
                  className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {t('earningsPage.dashboard')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.totalEarnedLabel')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(earnings.affiliate.totalEarnings)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.pending')}</p>
                  <p className="text-lg font-semibold text-yellow-600">
                    {formatCurrency(earnings.affiliate.pendingCents)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.available')}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(earnings.affiliate.availableCents)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('earningsPage.paidOut')}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(earnings.affiliate.paidCents)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Combined Payout Section: bepal wat en hoeveel je wilt uitbetalen */}
        {(totals.totalAvailable > 0) && (
          <div ref={payoutSectionRef} className="mt-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-sm border-2 border-emerald-200 p-6 scroll-mt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {t('earningsPage.determinePayoutTitle')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('earningsPage.determinePayoutDesc', { amount: formatCurrency(totals.totalAvailable) })}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1">
                  {formatCurrency(totals.totalAvailable)}
                </p>
                <p className="text-sm text-gray-600">
                  {t('earningsPage.totalAvailableForPayout')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {roles.isSeller && earnings.seller && earnings.seller.availablePayout > 0 && (
                  <Link
                    href="/verkoper/revenue"
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-center font-medium"
                  >
                    {t('earningsPage.payoutSeller', { amount: formatCurrency(earnings.seller.availablePayout) })}
                  </Link>
                )}
                {roles.isAffiliate && earnings.affiliate && earnings.affiliate.availableCents > 0 && (
                  <Link
                    href="/affiliate/dashboard"
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center font-medium"
                  >
                    {t('earningsPage.payoutAffiliate', { amount: formatCurrency(earnings.affiliate.availableCents) })}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerdienstenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Laden...</p>
      </div>
    }>
      <VerdienstenContent />
    </Suspense>
  );
}
