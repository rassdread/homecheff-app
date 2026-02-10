'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DollarSign,
  Users,
  TrendingUp,
  Gift,
  Copy,
  CheckCircle,
  ExternalLink,
  Settings,
  BarChart3,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

interface DashboardData {
  affiliate: {
    id: string;
    status: string;
    stripeConnectAccountId: string | null;
    stripeConnectOnboardingCompleted: boolean;
    createdAt: string;
    isSubAffiliate?: boolean;
  };
  earnings: {
    pendingCents: number;
    availableCents: number;
    paidCents: number;
    totalCents: number;
    userCommissionsCents: number; // Commissies van gebruikers (koper/verkoper)
    businessCommissionsCents: number; // Commissies van bedrijven
    parentCommissionsCents?: number; // Commissies van sub-affiliates (als parent)
  };
  stats: {
    totalReferrals: number;
    businessReferrals: number;
    activePromoCodes: number;
    downlineCount: number;
  };
  upline: {
    id: string;
    name: string;
    email: string;
  } | null;
  subAffiliates?: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
    customUserCommissionPct?: number | null;
    customBusinessCommissionPct?: number | null;
    customParentUserCommissionPct?: number | null;
    customParentBusinessCommissionPct?: number | null;
  }>;
  recentPayouts: Array<{
    id: string;
    amountCents: number;
    status: string;
    createdAt: string;
    periodStart: string;
    periodEnd: string;
  }>;
}

export default function AffiliateDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check for welcome parameter
    if (searchParams?.get('welcome') === 'true') {
      setShowWelcome(true);
      // Remove parameter from URL
      router.replace('/affiliate/dashboard');
      // Hide welcome after 5 seconds
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchDashboardData();
    fetchReferralCode();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/affiliate/dashboard');
      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralCode = async () => {
    try {
      const response = await fetch('/api/affiliate/referral-link');
      if (response.ok) {
        const { code } = await response.json();
        setReferralCode(code);
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
    }
  };

  const copyReferralLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('affiliate.dashboard.loading')}</p>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-red-600">{t('affiliate.dashboard.failedToLoad')}</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('affiliate.dashboard.title')}</h1>
                <p className="text-gray-600">{t('affiliate.dashboard.manageAccount')}</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/affiliate/promo-codes"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Gift className="w-4 h-4" />
                  <span>{t('affiliate.dashboard.promoCodes')}</span>
                </Link>
                {!data.affiliate.stripeConnectOnboardingCompleted && (
                  <Link
                    href="/affiliate/stripe-connect"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    {t('affiliate.dashboard.stripeConnectSetup')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        {showWelcome && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl shadow-lg animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-lg">{t('affiliate.dashboard.welcome')}</h3>
                    <p className="text-sm opacity-95">{t('affiliate.dashboard.welcomeDesc')}</p>
                  </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex gap-8 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('affiliate.dashboard.overview')}
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`py-2 px-1 border-b-2 font-medium ${
                activeTab === 'earnings'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('affiliate.dashboard.earnings')}
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`py-2 px-1 border-b-2 font-medium ${
                activeTab === 'referrals'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('affiliate.dashboard.referrals')}
            </button>
            {!data?.affiliate?.isSubAffiliate && (
              <button
                onClick={() => setActiveTab('sub-affiliates')}
                className={`py-2 px-1 border-b-2 font-medium ${
                  activeTab === 'sub-affiliates'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('affiliate.dashboard.subAffiliates')}
              </button>
            )}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('affiliate.dashboard.pending')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.earnings.pendingCents)}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('affiliate.dashboard.available')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.earnings.availableCents)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('affiliate.dashboard.paid')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(data.earnings.paidCents)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('affiliate.dashboard.totalReferrals')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data.stats.totalReferrals}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Link */}
            {referralCode && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-sm">
                    {window.location.origin}/?ref={referralCode}
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* User vs Business Commissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Gebruikers Commissies
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(data.earnings.userCommissionsCents)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  25% per gebruiker (50% als je beide aanbrengt)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Van transacties van gebruikers die je hebt aangebracht
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Bedrijven Commissies
                </h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(data.earnings.businessCommissionsCents)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  50% van abonnementsfee
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Van bedrijven die je hebt aangebracht
                </p>
              </div>
            </div>

            {/* Upline Info */}
            {data.upline && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Upline</h3>
                <p className="text-gray-600">
                  {data.upline.name} ({data.upline.email})
                </p>
              </div>
            )}

            {/* Downline Count */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Downline</h3>
              <p className="text-3xl font-bold text-gray-900">{data.stats.downlineCount}</p>
              <p className="text-sm text-gray-600 mt-2">Affiliates you referred</p>
            </div>

            {/* Belasting Informatie */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                Belasting Informatie
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Belangrijk:</strong> Je bent zelf verantwoordelijk voor het correct afdragen van belasting over je affiliate inkomsten.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Alle commissies worden uitbetaald <strong>exclusief BTW</strong></li>
                  <li>Je moet <strong>inkomstenbelasting</strong> afdragen over je affiliate inkomsten</li>
                  <li>Als je een bedrijf hebt, moet je mogelijk <strong>BTW</strong> afdragen</li>
                  <li>Alle uitbetalingen worden geregistreerd voor je belastingaangifte</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  Raadpleeg een belastingadviseur voor jouw specifieke situatie. HomeCheff geeft geen belastingadvies.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payouts</h3>
              {data.recentPayouts.length > 0 ? (
                <div className="space-y-4">
                  {data.recentPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(payout.amountCents)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(payout.periodStart).toLocaleDateString()} -{' '}
                          {new Date(payout.periodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          payout.status === 'SENT'
                            ? 'bg-green-100 text-green-800'
                            : payout.status === 'CREATED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payout.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No payouts yet</p>
              )}
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalReferrals}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Business Referrals</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.businessReferrals}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Affiliates Tab */}
        {activeTab === 'sub-affiliates' && !data?.affiliate?.isSubAffiliate && (
          <SubAffiliatesTab data={data} />
        )}
      </div>
    </div>
  );
}

// Sub-Affiliate Card Component
type SubAffiliate = NonNullable<DashboardData['subAffiliates']>[number];
function SubAffiliateCard({ sub }: { sub: SubAffiliate }) {
  const { t } = useTranslation();
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [customUserCommissionPct, setCustomUserCommissionPct] = useState<number | null>(
    sub.customUserCommissionPct ?? null
  );
  const [customBusinessCommissionPct, setCustomBusinessCommissionPct] = useState<number | null>(
    sub.customBusinessCommissionPct ?? null
  );
  const [customParentUserCommissionPct, setCustomParentUserCommissionPct] = useState<number | null>(
    sub.customParentUserCommissionPct ?? null
  );
  const [customParentBusinessCommissionPct, setCustomParentBusinessCommissionPct] = useState<number | null>(
    sub.customParentBusinessCommissionPct ?? null
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/affiliate/update-sub-commission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subAffiliateId: sub.id,
          customUserCommissionPct: customUserCommissionPct,
          customBusinessCommissionPct: customBusinessCommissionPct,
          customParentUserCommissionPct: customParentUserCommissionPct,
          customParentBusinessCommissionPct: customParentBusinessCommissionPct,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to update commission percentages');
        return;
      }

      setSuccess('Commissie percentages succesvol bijgewerkt!');
      setShowEdit(false);
      
      // Reload dashboard data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(t('affiliate.dashboard.commissionUpdateError') || 'Er is een fout opgetreden bij het bijwerken van de commissie percentages');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (pct: number | null | undefined) => {
    if (pct === null || pct === undefined) return t('affiliate.dashboard.default');
    return `${(pct * 100).toFixed(1)}%`;
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{sub.name}</p>
          <p className="text-sm text-gray-600">{sub.email}</p>
          <p className="text-xs text-gray-500 mt-1">
            {t('affiliate.dashboard.created')}: {new Date(sub.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              sub.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {sub.status}
          </span>
          <button
            onClick={() => setShowEdit(!showEdit)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showEdit ? t('common.cancel') : t('common.edit')}
          </button>
        </div>
      </div>

      {showEdit && (
        <form onSubmit={handleUpdate} className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('affiliate.dashboard.subTransactionCommission')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={customUserCommissionPct !== null ? customUserCommissionPct * 100 : ''}
                onChange={(e) => setCustomUserCommissionPct(e.target.value ? parseFloat(e.target.value) / 100 : null)}
                placeholder="20 (standaard)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Standaard: 20%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('affiliate.dashboard.subBusinessCommission')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={customBusinessCommissionPct !== null ? customBusinessCommissionPct * 100 : ''}
                onChange={(e) => setCustomBusinessCommissionPct(e.target.value ? parseFloat(e.target.value) / 100 : null)}
                placeholder="40 (standaard)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Standaard: 40%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('affiliate.dashboard.yourTransactionCommission')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={customParentUserCommissionPct !== null ? customParentUserCommissionPct * 100 : ''}
                onChange={(e) => setCustomParentUserCommissionPct(e.target.value ? parseFloat(e.target.value) / 100 : null)}
                placeholder="5 (standaard)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Standaard: 5% per kant</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('affiliate.dashboard.yourBusinessCommission')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={customParentBusinessCommissionPct !== null ? customParentBusinessCommissionPct * 100 : ''}
                onChange={(e) => setCustomParentBusinessCommissionPct(e.target.value ? parseFloat(e.target.value) / 100 : null)}
                placeholder="10 (standaard)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">Standaard: 10%</p>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('affiliate.dashboard.updating') : t('affiliate.dashboard.updateCommissions')}
          </button>
        </form>
      )}

      {!showEdit && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">{t('affiliate.dashboard.subTransactionCommission')}:</span>{' '}
            <span className="font-semibold">{formatPercentage(sub.customUserCommissionPct)}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('affiliate.dashboard.subBusinessCommission')}:</span>{' '}
            <span className="font-semibold">{formatPercentage(sub.customBusinessCommissionPct)}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('affiliate.dashboard.yourTransactionCommission')}:</span>{' '}
            <span className="font-semibold">{formatPercentage(sub.customParentUserCommissionPct)}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('affiliate.dashboard.yourBusinessCommission')}:</span>{' '}
            <span className="font-semibold">{formatPercentage(sub.customParentBusinessCommissionPct)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-Affiliates Management Component
function SubAffiliatesTab({ data }: { data: DashboardData }) {
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatCurrency = (cents: number | undefined) => {
    if (cents === undefined) return '€0.00';
    return `€${(cents / 100).toFixed(2)}`;
  };

  const handleCreateSubAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/affiliate/create-sub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create sub-affiliate');
        return;
      }

      setSuccess('Sub-affiliate succesvol aangemaakt!');
      setEmail('');
      setName('');
      setShowCreateForm(false);
      
      // Reload dashboard data
      window.location.reload();
    } catch (err) {
      setError(t('affiliate.dashboard.subAffiliateCreateError') || 'Er is een fout opgetreden bij het aanmaken van de sub-affiliate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sub-Affiliates</h3>
            <p className="text-sm text-gray-600 mt-1">
              Beheer je sub-affiliates. Je ontvangt 10% commissie op hun abonnementen en 5-10% op hun transacties.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {showCreateForm ? t('common.cancel') : t('affiliate.dashboard.newSubAffiliate')}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSubAffiliate} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-4">
              <div>
                <label htmlFor="sub-email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('affiliate.dashboard.subEmail')}
                </label>
                <input
                  id="sub-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="email@voorbeeld.nl"
                />
              </div>
              <div>
                <label htmlFor="sub-name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('affiliate.dashboard.subName')}
                </label>
                <input
                  id="sub-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Volledige naam"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                  {success}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('affiliate.dashboard.creating') : t('affiliate.dashboard.createSubAffiliate')}
              </button>
            </div>
          </form>
        )}

        {data.subAffiliates && data.subAffiliates.length > 0 ? (
          <div className="space-y-3">
            {data.subAffiliates.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{sub.name}</p>
                  <p className="text-sm text-gray-600">{sub.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('affiliate.dashboard.created')}: {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sub.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">
            {t('affiliate.dashboard.noSubAffiliates')}
          </p>
        )}
      </div>

      {/* Parent Commissions Info */}
      {data.earnings.parentCommissionsCents !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">
            {t('affiliate.dashboard.parentCommissions')}
          </h4>
          <p className="text-2xl font-bold text-blue-600 mb-2">
            {formatCurrency(data.earnings.parentCommissionsCents)}
          </p>
          <p className="text-sm text-blue-700">
            {t('affiliate.dashboard.parentCommissionsDesc')}
            <br />
            • {t('affiliate.dashboard.parentCommissionsList1')}
            <br />
            • {t('affiliate.dashboard.parentCommissionsList2')}
          </p>
        </div>
      )}
    </div>
  );
}


