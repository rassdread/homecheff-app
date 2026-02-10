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
  Download,
  Printer,
  QrCode,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import QRCodeSVG from 'react-qr-code';
import QRCode from 'qrcode';
import { 
  SUB_AFFILIATE_USER_COMMISSION_PCT, 
  SUB_AFFILIATE_BUSINESS_COMMISSION_PCT,
  PARENT_AFFILIATE_USER_COMMISSION_PCT,
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT
} from '@/lib/affiliate-config';

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
  referrals?: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    username: string | null;
    type: string;
    source: string;
    createdAt: string;
    startsAt: string;
    endsAt: string;
  }>;
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
  const [referralLink, setReferralLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeUrlLarge, setQrCodeUrlLarge] = useState<string>('');
  const [qrCodeUrlSvg, setQrCodeUrlSvg] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [showQRCodeOptions, setShowQRCodeOptions] = useState(false);

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
  }, []);

  // Fetch referral code separately if not in dashboard data
  useEffect(() => {
    if (!referralCode && data) {
      fetchReferralCode();
    }
  }, [data, referralCode]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/affiliate/dashboard');
      if (response.ok) {
        const data = await response.json();
        setData(data);
        // Set referral code from dashboard data if available
        if (data.referralCode) {
          setReferralCode(data.referralCode);
        } else {
          // If no referral code in dashboard data, fetch separately (fallback)
          fetchReferralCode();
        }
        // Set referral link from dashboard data if available (has correct production URL)
        if (data.referralLink) {
          setReferralLink(data.referralLink);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralCode = async () => {
    // Only fetch if not already set from dashboard data
    if (referralCode) return;
    
    try {
      const response = await fetch('/api/affiliate/referral-link');
      if (response.ok) {
        const data = await response.json();
        if (data.code) {
          setReferralCode(data.code);
        }
        // Use the link from API if available (has correct production URL)
        if (data.link) {
          setReferralLink(data.link);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error fetching referral code:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching referral code:', error);
    }
  };

  const getReferralLink = () => {
    // Prefer the link from API (has correct production URL)
    if (referralLink) return referralLink;
    
    // Fallback to generating link locally with friendly URL
    // Use current language to generate correct link
    if (typeof window === 'undefined' || !referralCode) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    // Check both pathname and localStorage for language
    const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('homecheff-language') : null;
    const isEnglish = currentPath.startsWith('/en/') || currentPath === '/en' || storedLanguage === 'en';
    const langPrefix = isEnglish ? '/en' : '';
    return `${baseUrl}${langPrefix}/welkom/${referralCode}`;
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR codes in different sizes and formats
  useEffect(() => {
    if (referralCode && typeof window !== 'undefined') {
      // Use the link from API if available (has correct production URL), otherwise generate locally with friendly URL
      // Use current language to generate correct link
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('homecheff-language') : null;
      const isEnglish = currentPath.startsWith('/en/') || currentPath === '/en' || storedLanguage === 'en';
      const langPrefix = isEnglish ? '/en' : '';
      const link = referralLink || (typeof window !== 'undefined' ? `${window.location.origin}${langPrefix}/welkom/${referralCode}` : '');
      console.log('Generating QR code for link:', link, 'referralCode:', referralCode, 'referralLink:', referralLink);
      if (link && referralCode) {
        // Standard size (512x512) for general use
        QRCode.toDataURL(link, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
          .then((url) => {
            setQrCodeUrl(url);
          })
          .catch((err) => {
            console.error('Error generating QR code:', err);
          });

        // Large size (1024x1024) for print/posters
        QRCode.toDataURL(link, {
          width: 1024,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
          .then((url) => {
            setQrCodeUrlLarge(url);
          })
          .catch((err) => {
            console.error('Error generating large QR code:', err);
          });

        // SVG format for web/vector use
        QRCode.toString(link, {
          type: 'svg',
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
          .then((svg) => {
            const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);
            setQrCodeUrlSvg(svgUrl);
          })
          .catch((err) => {
            console.error('Error generating SVG QR code:', err);
          });
      }
    } else {
      console.log('QR code generation skipped:', { referralCode, hasWindow: typeof window !== 'undefined' });
    }
  }, [referralCode, referralLink]); // Note: language changes will trigger re-fetch via referralLink update

  const downloadQRCode = async (size: 'standard' | 'large' = 'standard', format: 'png' | 'svg' = 'png') => {
    if (!referralCode) return;
    setDownloading(true);
    try {
      let url = '';
      let filename = '';
      
      if (format === 'svg' && qrCodeUrlSvg) {
        url = qrCodeUrlSvg;
        filename = `homecheff-affiliate-qr-${referralCode}.svg`;
      } else if (size === 'large' && qrCodeUrlLarge) {
        url = qrCodeUrlLarge;
        filename = `homecheff-affiliate-qr-${referralCode}-large.png`;
      } else if (qrCodeUrl) {
        url = qrCodeUrl;
        filename = `homecheff-affiliate-qr-${referralCode}.png`;
      } else {
        throw new Error('QR code not ready');
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert(t('affiliate.dashboard.qrCodeDownloadError'));
    } finally {
      setDownloading(false);
    }
  };

  const copyEmbedCode = () => {
    if (!qrCodeUrl || !referralCode) return;
    const embedCode = `<img src="${qrCodeUrl}" alt="HomeCheff Affiliate QR Code" width="200" height="200" />`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyImageUrl = () => {
    if (!qrCodeUrl) return;
    navigator.clipboard.writeText(qrCodeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printQRCode = () => {
    if (!qrCodeUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const title = t('affiliate.dashboard.qrCodePrintTitle');
    const desc = t('affiliate.dashboard.qrCodePrintDesc');
    const link = getReferralLink();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            h1 {
              margin-bottom: 20px;
              color: #333;
            }
            img {
              max-width: 400px;
              height: auto;
              border: 2px solid #333;
            }
            p {
              margin-top: 20px;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                margin: 0;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <img src="${qrCodeUrl}" alt="QR Code" />
          <p>${link}</p>
          <p>${desc}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('affiliate.dashboard.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600">{t('affiliate.dashboard.manageAccount')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/affiliate/promo-codes"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">{t('affiliate.dashboard.promoCodes')}</span>
                <span className="sm:hidden">Promo's</span>
              </Link>
              {!data.affiliate.stripeConnectOnboardingCompleted && (
                <Link
                  href="/affiliate/stripe-connect"
                  className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  <span className="hidden sm:inline">{t('affiliate.dashboard.stripeConnectSetup')}</span>
                  <span className="sm:hidden">Stripe</span>
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
          <nav className="flex gap-2 sm:gap-4 md:gap-8 border-b overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide overflow-y-hidden">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('affiliate.dashboard.overview')}
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
                activeTab === 'earnings'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('affiliate.dashboard.earnings')}
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
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
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
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

            {/* Referral Link & QR Code */}
            {referralCode ? (
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 rounded-xl shadow-lg border-2 border-emerald-300 p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-full mb-4 shadow-lg">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('affiliate.dashboard.welcomeTitle')}
                  </h3>
                  <p className="text-lg text-gray-700 mb-1">
                    {t('affiliate.dashboard.welcomeMessage')}
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600">{data.stats.totalReferrals}</div>
                      <div className="text-sm text-gray-600">{t('affiliate.dashboard.referrals')}</div>
                    </div>
                    <div className="w-px h-12 bg-emerald-300"></div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600">{formatCurrency(data.earnings.totalCents)}</div>
                      <div className="text-sm text-gray-600">{t('affiliate.dashboard.totalEarned')}</div>
                    </div>
                  </div>
                </div>
                
                {/* Link Section */}
                <div className="mb-6">
                  <div className="bg-white rounded-xl p-5 border-2 border-emerald-200 shadow-md">
                    <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                      {t('affiliate.dashboard.shareYourLink')}
                    </p>
                    {/* Easy sharing hint */}
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-xs text-emerald-800 text-center leading-relaxed">
                        <strong>💡 Tip:</strong> Je affiliate link wordt automatisch meegestuurd wanneer je recepten, producten, kweekprojecten of designs deelt via de share-knop op de site!
                      </p>
                    </div>
                    {/* Link container - stacked on mobile, side-by-side on larger screens */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-emerald-50 rounded-lg p-3 sm:p-4 border border-emerald-200 min-w-0 overflow-hidden">
                        <div className="flex items-start sm:items-center gap-2 min-w-0">
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                          <span className="font-mono text-xs sm:text-sm break-all text-emerald-900 font-medium leading-relaxed overflow-wrap-anywhere word-break-break-all">
                            {getReferralLink() || (referralCode ? `/?ref=${referralCode}` : '')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg font-semibold text-sm sm:text-base"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            {t('affiliate.dashboard.copied')}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                            {t('affiliate.dashboard.copyLink')}
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 text-center flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" />
                      {t('affiliate.dashboard.shareHint')}
                    </p>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="border-t pt-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* QR Code Display */}
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex-shrink-0">
                      {referralCode && typeof window !== 'undefined' ? (
                        <QRCodeSVG
                          value={getReferralLink()}
                          size={200}
                          level="H"
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                        />
                      ) : (
                        <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400 text-sm">
                          {loading ? t('common.loading') : t('affiliate.dashboard.qrCodeGenerating')}
                        </div>
                      )}
                    </div>

                    {/* QR Code Info & Actions */}
                    <div className="flex-1">
                      <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-emerald-600" />
                        {t('affiliate.dashboard.qrCodeTitle')}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('affiliate.dashboard.qrCodeDesc')}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => downloadQRCode('standard', 'png')}
                          disabled={downloading || !qrCodeUrl}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                          {downloading ? t('affiliate.dashboard.downloading') : t('affiliate.dashboard.downloadQR')}
                        </button>
                        <button
                          onClick={printQRCode}
                          disabled={!qrCodeUrl}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Printer className="w-4 h-4" />
                          {t('affiliate.dashboard.printQR')}
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-4">
                        {t('affiliate.dashboard.qrCodeHint')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* User vs Business Commissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  {t('affiliate.dashboard.userCommissions')}
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(data.earnings.userCommissionsCents)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {data?.affiliate?.isSubAffiliate 
                    ? t('affiliate.dashboard.userCommissionsDescSub')
                    : t('affiliate.dashboard.userCommissionsDesc')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('affiliate.dashboard.userCommissionsSource')}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  {t('affiliate.dashboard.businessCommissions')}
                </h3>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(data.earnings.businessCommissionsCents)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {data?.affiliate?.isSubAffiliate
                    ? t('affiliate.dashboard.businessCommissionsDescSub')
                    : t('affiliate.dashboard.businessCommissionsDesc')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('affiliate.dashboard.businessCommissionsSource')}
                </p>
              </div>
            </div>

            {/* Upline Info */}
            {data.upline && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('affiliate.dashboard.yourUpline')}</h3>
                <p className="text-gray-600">
                  {data.upline.name} ({data.upline.email})
                </p>
              </div>
            )}

            {/* Downline Count */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('affiliate.dashboard.yourDownline')}</h3>
              <p className="text-3xl font-bold text-gray-900">{data.stats.downlineCount}</p>
              <p className="text-sm text-gray-600 mt-2">{t('affiliate.dashboard.downlineDesc')}</p>
            </div>

            {/* Belasting Informatie */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                {t('affiliate.taxInfo.title')}
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>{t('affiliate.taxInfo.important')}</strong> {t('affiliate.taxInfo.importantDescShort')}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>{t('affiliate.taxInfo.point6')}</li>
                  <li>{t('affiliate.taxInfo.point7')}</li>
                  <li>{t('affiliate.taxInfo.point8')}</li>
                  <li>{t('affiliate.taxInfo.point9')}</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  {t('affiliate.taxInfo.footer')}
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
                <p className="text-gray-600">{t('affiliate.dashboard.noPayouts')}</p>
              )}
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('affiliate.dashboard.referralStats')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('affiliate.dashboard.totalReferrals')}</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalReferrals}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('affiliate.dashboard.businessReferrals')}</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.businessReferrals}</p>
                </div>
              </div>
            </div>

            {/* Referrals List */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('affiliate.dashboard.referralsList') || 'Jouw Referrals'}
                </h3>
                <p className="text-sm text-gray-600">
                  {data.referrals?.length || 0} {data.referrals?.length === 1 ? 'referral' : 'referrals'}
                </p>
              </div>
              
              {data.referrals && data.referrals.length > 0 ? (
                <div className="space-y-3">
                  {data.referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {referral.name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {referral.email}
                            </p>
                            {referral.username && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                @{referral.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 sm:ml-4 flex-shrink-0">
                        <div className="text-left sm:text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              referral.type === 'BUSINESS_SIGNUP'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {referral.type === 'BUSINESS_SIGNUP' ? 'Bedrijf' : 'Gebruiker'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                            {new Date(referral.createdAt).toLocaleDateString('nl-NL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <Link
                          href={`/user/${referral.username || referral.userId}`}
                          className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          <span className="hidden sm:inline">Bekijk Profiel</span>
                          <span className="sm:hidden">Profiel</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">
                    {t('affiliate.dashboard.noReferrals') || 'Nog geen referrals'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Deel je referral link om mensen aan te brengen!
                  </p>
                </div>
              )}
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
function SubAffiliateCard({ sub, onDelete }: { sub: SubAffiliate; onDelete: (id: string) => void }) {
  const { t } = useTranslation();
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        setError(result.error || t('affiliate.dashboard.commissionUpdateError'));
        return;
      }

      setSuccess(t('affiliate.dashboard.commissionsUpdated'));
      setShowEdit(false);
      
      // Reload dashboard data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(t('affiliate.dashboard.commissionUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (pct: number | null | undefined, defaultPct: number) => {
    if (pct === null || pct === undefined) return `${(defaultPct * 100).toFixed(0)}% ${t('affiliate.dashboard.default')}`;
    return `${(pct * 100).toFixed(1)}%`;
  };

  const handleDelete = async () => {
    if (!confirm(t('affiliate.dashboard.deleteSubAffiliateConfirm', { name: sub.name, email: sub.email }))) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/affiliate/delete-sub?subAffiliateId=${sub.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || t('affiliate.dashboard.deleteSubAffiliateError'));
        return;
      }

      // Call parent callback to refresh list
      onDelete(sub.id);
    } catch (err) {
      setError(t('affiliate.dashboard.deleteSubAffiliateError'));
    } finally {
      setDeleting(false);
    }
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
        <div className="flex items-center gap-2">
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
            {showEdit ? t('affiliate.dashboard.cancel') : t('affiliate.dashboard.edit')}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Verwijder sub-affiliate"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? '...' : 'Verwijder'}
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
                placeholder={`${(SUB_AFFILIATE_USER_COMMISSION_PCT * 100).toFixed(0)} (${t('affiliate.dashboard.default')})`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.dashboard.default')}: {(SUB_AFFILIATE_USER_COMMISSION_PCT * 100).toFixed(0)}%</p>
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
                placeholder={`${(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT * 100).toFixed(0)} (${t('affiliate.dashboard.default')})`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.dashboard.default')}: {(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT * 100).toFixed(0)}%</p>
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
                placeholder={`${(PARENT_AFFILIATE_USER_COMMISSION_PCT * 100).toFixed(0)} (${t('affiliate.dashboard.default')})`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.dashboard.default')}: {(PARENT_AFFILIATE_USER_COMMISSION_PCT * 100).toFixed(0)}% {t('affiliate.dashboard.perSide')}</p>
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
                placeholder={`${(PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT * 100).toFixed(0)} (${t('affiliate.dashboard.default')})`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.dashboard.default')}: {(PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT * 100).toFixed(0)}%</p>
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
            <span className="font-semibold">{formatPercentage(sub.customUserCommissionPct, SUB_AFFILIATE_USER_COMMISSION_PCT)}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('affiliate.dashboard.subBusinessCommission')}:</span>{' '}
            <span className="font-semibold">{formatPercentage(sub.customBusinessCommissionPct, SUB_AFFILIATE_BUSINESS_COMMISSION_PCT)}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('affiliate.dashboard.yourTransactionCommission')}:</span>{' '}
            <span className="font-semibold">{formatPercentage(sub.customParentUserCommissionPct, PARENT_AFFILIATE_USER_COMMISSION_PCT)}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('affiliate.dashboard.yourBusinessCommission')}:</span>{' '}
            <span className="font-semibold">{formatPercentage(sub.customParentBusinessCommissionPct, PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT)}</span>
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
        setError(result.error || t('affiliate.dashboard.subAffiliateCreateError'));
        return;
      }

      // If invite was created, show invite link
      if (result.invite && result.invite.inviteLink) {
        setSuccess(`${t('affiliate.dashboard.subAffiliateInviteCreated')}\n\n${t('affiliate.dashboard.inviteLink')}: ${result.invite.inviteLink}`);
        // Copy invite link to clipboard
        navigator.clipboard.writeText(result.invite.inviteLink);
        setEmail('');
        setName('');
        setShowCreateForm(false);
        // Don't reload, show the link instead
        return;
      }

      // If sub-affiliate was created directly (user already exists)
      setSuccess(t('affiliate.dashboard.subAffiliateCreated'));
      setEmail('');
      setName('');
      setShowCreateForm(false);
      
      // Reload dashboard data
      window.location.reload();
    } catch (err) {
      setError(t('affiliate.dashboard.subAffiliateCreateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('affiliate.dashboard.subAffiliatesTitle')}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('affiliate.dashboard.subAffiliatesDesc')}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {showCreateForm ? t('affiliate.dashboard.cancel') : t('affiliate.dashboard.newSubAffiliate')}
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
                  placeholder={t('affiliate.dashboard.emailPlaceholder')}
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
                  placeholder={t('affiliate.dashboard.fullName')}
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
              <SubAffiliateCard 
                key={sub.id} 
                sub={sub} 
                onDelete={(id) => {
                  // Reload dashboard data after deletion
                  window.location.reload();
                }}
              />
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


