'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Ban,
  Activity,
  ChevronDown,
  ChevronRight,
  Building2,
  ShoppingBag,
  UserCheck,
  PieChart,
  Link as LinkIcon,
  QrCode,
  Download,
  Printer,
  Copy,
  Share2,
  Save,
  X,
  Edit
} from 'lucide-react';
import QRCodeSVG from 'react-qr-code';
import QRCode from 'qrcode';
import { useTranslation } from '@/hooks/useTranslation';

interface Affiliate {
  id: string;
  userId: string;
  status: string;
  parentAffiliateId: string | null;
  parentAffiliate: {
    id: string;
    name: string;
    email: string;
  } | null;
  childAffiliates: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    createdAt: string;
  };
  stats: {
    referralLinks: number;
    promoCodes: number;
    attributions: number;
    commissions: number;
    payouts: number;
  };
  referralLink: {
    id: string;
    code: string;
    createdAt: string;
  } | null;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
  createdAt: string;
}

interface AffiliateIncome {
  affiliateId: string;
  affiliate: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  };
  childAffiliates?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  parentAffiliate?: {
    id: string;
    name: string;
    email: string;
  } | null;
  totalIncome: number;
  subscriptionIncome: number;
  transactionIncome: number;
  refundAmount: number;
  paidOut: number;
  pending: number;
  available: number;
  monthlyIncome: Record<string, number>;
  commissionCount: number;
  subscriptionCount: number;
  transactionCount: number;
  // Detailed breakdown
  directSubscriptionIncome: number;
  subSubscriptionIncome: number;
  parentSubscriptionIncome: number;
  directTransactionIncome: number;
  subTransactionIncome: number;
  parentTransactionIncome: number;
  // Counts
  directSubscriptionCount: number;
  subSubscriptionCount: number;
  parentSubscriptionCount: number;
  directTransactionCount: number;
  subTransactionCount: number;
  parentTransactionCount: number;
}

interface TopPerformer {
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  totalIncome: number;
  subscriptionIncome: number;
  transactionIncome: number;
  paidOut: number;
  pending: number;
  available: number;
  commissionCount: number;
}

interface AffiliateData {
  affiliates: Affiliate[];
  statistics: {
    totalAffiliates: number;
    activeAffiliates: number;
    suspendedAffiliates: number;
    totalCommissions: number;
    totalPayouts: number;
    pendingCommissions: number;
    availableCommissions: number;
    paidCommissions: number;
    commissionCounts: {
      pending: number;
      available: number;
      paid: number;
    };
    payoutCounts: {
      created: number;
      sent: number;
      failed: number;
    };
  };
  recentPayouts: Array<{
    id: string;
    affiliateId: string;
    affiliateName: string;
    affiliateEmail: string;
    amountCents: number;
    status: string;
    stripeTransferId: string | null;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
  }>;
  recentCommissions: Array<{
    id: string;
    affiliateId: string;
    affiliateName: string;
    affiliateEmail: string;
    amountCents: number;
    status: string;
    eventType: string;
    eventId: string;
    createdAt: string;
  }>;
  affiliateIncomes?: AffiliateIncome[];
  topPerformers?: TopPerformer[];
}

export default function AffiliateManagement() {
  const { t } = useTranslation();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'affiliates' | 'commissions' | 'payouts' | 'income' | 'links' | 'attributions'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'SUSPENDED'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'main' | 'sub'>('all');
  const [expandedAffiliates, setExpandedAffiliates] = useState<Set<string>>(new Set());
  const [editingReferralCode, setEditingReferralCode] = useState<{
    affiliateId: string;
    referralLinkId: string;
    currentCode: string;
    newCode: string;
  } | null>(null);
  const [updatingCode, setUpdatingCode] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Attributions tab state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>('');
  const [attributionType, setAttributionType] = useState<'USER_SIGNUP' | 'BUSINESS_SIGNUP'>('USER_SIGNUP');
  const [linkingUser, setLinkingUser] = useState(false);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [loadingAttributions, setLoadingAttributions] = useState(false);
  
  // QR Code state for affiliate signup link
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeUrlLarge, setQrCodeUrlLarge] = useState<string>('');
  const [qrCodeUrlSvg, setQrCodeUrlSvg] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get affiliate signup link (public link - no token needed for main affiliate signup)
  const getAffiliateSignupLink = () => {
    if (typeof window === 'undefined') return '';
    // Use current origin (will be production URL when deployed)
    // Note: In browser, process.env.NEXT_PUBLIC_BASE_URL is replaced at build time
    // For production, make sure NEXT_PUBLIC_BASE_URL is set in environment variables
    const baseUrl = window.location.origin;
    return `${baseUrl}/affiliate`;
  };

  // Generate QR codes for affiliate signup link
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab === 'links') {
      // Use current origin for QR code (will be production URL when deployed)
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/affiliate`;
      console.log('Generating admin QR code for affiliate signup link:', link);
      if (link) {
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
    }
  }, [activeTab]);

  const downloadQRCode = async (size: 'standard' | 'large' = 'standard', format: 'png' | 'svg' = 'png') => {
    setDownloading(true);
    try {
      let url = '';
      let filename = '';
      
      if (format === 'svg' && qrCodeUrlSvg) {
        url = qrCodeUrlSvg;
        filename = `homecheff-affiliate-signup-qr.svg`;
      } else if (size === 'large' && qrCodeUrlLarge) {
        url = qrCodeUrlLarge;
        filename = `homecheff-affiliate-signup-qr-large.png`;
      } else if (qrCodeUrl) {
        url = qrCodeUrl;
        filename = `homecheff-affiliate-signup-qr.png`;
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
      alert('Fout bij het downloaden van de QR code');
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = () => {
    const link = getAffiliateSignupLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmbedCode = () => {
    if (!qrCodeUrl) return;
    const embedCode = `<img src="${qrCodeUrl}" alt="HomeCheff Affiliate Signup QR Code" width="200" height="200" />`;
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
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>HomeCheff Affiliate Signup QR Code</title>
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
              max-width: 100%;
              height: auto;
            }
            p {
              margin-top: 20px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>HomeCheff Affiliate Signup QR Code</h1>
          <img src="${qrCodeUrl}" alt="QR Code" />
          <p>Scan deze QR code om je aan te melden als affiliate</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/affiliates');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditingReferralCode = (affiliate: Affiliate) => {
    if (!affiliate.referralLink) {
      alert(t('admin.noReferralLink'));
      return;
    }
    setEditingReferralCode({
      affiliateId: affiliate.id,
      referralLinkId: affiliate.referralLink.id,
      currentCode: affiliate.referralLink.code,
      newCode: affiliate.referralLink.code,
    });
  };

  const cancelEditingReferralCode = () => {
    setEditingReferralCode(null);
  };

  const updateReferralCode = async () => {
    if (!editingReferralCode) return;

    const newCode = editingReferralCode.newCode.trim().toUpperCase();
    
    // Validate code format
    if (!/^[A-Z0-9]{8,50}$/.test(newCode)) {
      alert('Code moet 8-50 karakters zijn, alleen hoofdletters en cijfers');
      return;
    }

    if (newCode === editingReferralCode.currentCode) {
      cancelEditingReferralCode();
      return;
    }

    setUpdatingCode(true);
    try {
      const res = await fetch('/api/admin/affiliates/referral-link', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralLinkId: editingReferralCode.referralLinkId,
          newCode: newCode,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t('admin.referralCodeUpdateError'));
      }

      // Refresh data
      await fetchData();
      setEditingReferralCode(null);
      alert(t('admin.referralCodeUpdated'));
    } catch (error: any) {
      console.error('Error updating referral code:', error);
      alert(error.message || t('admin.referralCodeUpdateError'));
    } finally {
      setUpdatingCode(false);
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!confirm(`Weet je zeker dat je de status wilt wijzigen naar ${newStatus === 'ACTIVE' ? 'ACTIEF' : 'GESCHORST'}?`)) {
      return;
    }

    setUpdatingStatus(affiliateId);
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fout bij het wijzigen van de status');
      }

      // Refresh data
      await fetchData();
      alert(`Status succesvol gewijzigd naar ${newStatus === 'ACTIVE' ? 'ACTIEF' : 'GESCHORST'}`);
    } catch (error: any) {
      console.error('Error updating affiliate status:', error);
      alert(error.message || 'Fout bij het wijzigen van de status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Search users function
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Handle linking user to affiliate
  const handleLinkUserToAffiliate = async () => {
    if (!selectedUser || !selectedAffiliateId) {
      alert('Selecteer eerst een gebruiker en affiliate');
      return;
    }

    if (!confirm(`Weet je zeker dat je ${selectedUser.name || selectedUser.email} wilt koppelen aan de geselecteerde affiliate?`)) {
      return;
    }

    setLinkingUser(true);
    try {
      const res = await fetch('/api/admin/affiliates/attributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          affiliateId: selectedAffiliateId,
          type: attributionType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fout bij het koppelen');
      }

      alert('Gebruiker succesvol gekoppeld aan affiliate!');
      
      // Reset form
      setSelectedUser(null);
      setUserSearchQuery('');
      setSelectedAffiliateId('');
      setAttributionType('USER_SIGNUP');
      
      // Refresh attributions
      await fetchAttributions();
      
      // Refresh affiliate data
      await fetchData();
    } catch (error: any) {
      console.error('Error linking user to affiliate:', error);
      alert(error.message || 'Fout bij het koppelen van gebruiker aan affiliate');
    } finally {
      setLinkingUser(false);
    }
  };

  // Fetch attributions
  const fetchAttributions = async () => {
    setLoadingAttributions(true);
    try {
      const res = await fetch('/api/admin/affiliates/attributions');
      if (res.ok) {
        const data = await res.json();
        setAttributions(data.attributions || []);
      }
    } catch (error) {
      console.error('Error fetching attributions:', error);
    } finally {
      setLoadingAttributions(false);
    }
  };

  // Fetch attributions when tab is active
  useEffect(() => {
    if (activeTab === 'attributions') {
      fetchAttributions();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('admin.active')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        {t('admin.suspended')}
      </span>
    );
  };

  const getCommissionStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      PENDING: (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          In afwachting
        </span>
      ),
      AVAILABLE: (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Beschikbaar
        </span>
      ),
      PAID: (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Betaald
        </span>
      ),
      REVERSED: (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Teruggedraaid
        </span>
      ),
    };
    return badges[status] || <span className="text-xs text-gray-500">{status}</span>;
  };

  const getPayoutStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      CREATED: (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Aangemaakt
        </span>
      ),
      SENT: (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verzonden
        </span>
      ),
      FAILED: (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Mislukt
        </span>
      ),
    };
    return badges[status] || <span className="text-xs text-gray-500">{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">{t('admin.noDataAvailable')}</p>
      </div>
    );
  }

  const filteredAffiliates = data.affiliates.filter((aff) => {
    const matchesSearch =
      aff.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aff.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aff.user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || aff.status === statusFilter;
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'sub' && aff.parentAffiliateId !== null) ||
      (typeFilter === 'main' && aff.parentAffiliateId === null);
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: t('admin.overview'), icon: Eye, shortLabel: 'Overzicht' },
              { id: 'affiliates', label: t('admin.affiliates'), icon: Users, shortLabel: 'Affiliates' },
              { id: 'income', label: t('admin.income'), icon: DollarSign, shortLabel: 'Inkomen' },
              { id: 'commissions', label: t('admin.commissions'), icon: Activity, shortLabel: 'Commissies' },
              { id: 'payouts', label: t('admin.payouts'), icon: TrendingUp, shortLabel: 'Uitbetalingen' },
              { id: 'links', label: t('admin.promotionLinks'), icon: LinkIcon, shortLabel: 'Links' },
              { id: 'attributions', label: 'Koppelingen', icon: UserCheck, shortLabel: 'Koppelingen' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 sm:bg-transparent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('admin.totalAffiliates')}</p>
                  <p className="text-2xl font-bold text-gray-900">{data.statistics.totalAffiliates}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="text-green-600">{data.statistics.activeAffiliates} {t('admin.active')}</span>
                <span className="text-gray-400">•</span>
                <span className="text-red-600">{data.statistics.suspendedAffiliates} {t('admin.suspended')}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('admin.totalCommissions')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.statistics.totalCommissions)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="text-yellow-600">
                  {formatCurrency(data.statistics.pendingCommissions)} pending
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-blue-600">
                  {formatCurrency(data.statistics.availableCommissions)} beschikbaar
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('admin.totalPayouts')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.statistics.totalPayouts)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="text-green-600">
                  {data.statistics.payoutCounts.sent} verzonden
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-red-600">
                  {data.statistics.payoutCounts.failed} mislukt
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Netto Kosten</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(data.statistics.totalPayouts)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ArrowDownRight className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Totale uitbetalingen aan affiliates
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{t('admin.recentCommissions')}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {data.recentCommissions.slice(0, 5).map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{commission.affiliateName}</p>
                        <p className="text-xs text-gray-500">{commission.affiliateEmail}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {commission.eventType} • {formatDate(commission.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(commission.amountCents)}
                        </p>
                        {getCommissionStatusBadge(commission.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{t('admin.recentPayouts')}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {data.recentPayouts.slice(0, 5).map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{payout.affiliateName}</p>
                        <p className="text-xs text-gray-500">{payout.affiliateEmail}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payout.amountCents)}
                        </p>
                        {getPayoutStatusBadge(payout.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('admin.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">Alle Types</option>
                  <option value="main">Hoofd Affiliates</option>
                  <option value="sub">Sub-Affiliates</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">{t('admin.allStatuses')}</option>
                  <option value="ACTIVE">{t('admin.active')}</option>
                  <option value="SUSPENDED">{t('admin.suspended')}</option>
                </select>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('admin.refresh')}
                </button>
              </div>
            </div>
          </div>

          {/* Affiliates List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affiliate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistieken
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.referralCode')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.parentSub')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.createdAt')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAffiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{affiliate.user.name}</p>
                            {affiliate.parentAffiliateId && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                Sub
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{affiliate.user.email}</p>
                          {affiliate.user.username && (
                            <p className="text-xs text-gray-400">@{affiliate.user.username}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(affiliate.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <p>{t('admin.referrals')}: {affiliate.stats.attributions}</p>
                          <p>{t('admin.commissionsLabel')}: {affiliate.stats.commissions}</p>
                          <p>{t('admin.payoutsLabel')}: {affiliate.stats.payouts}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingReferralCode?.affiliateId === affiliate.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingReferralCode.newCode}
                              onChange={(e) =>
                                setEditingReferralCode({
                                  ...editingReferralCode,
                                  newCode: e.target.value.toUpperCase(),
                                })
                              }
                              className="px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono uppercase max-w-[200px]"
                              placeholder="REF12345678"
                              maxLength={50}
                            />
                            <button
                              onClick={updateReferralCode}
                              disabled={updatingCode}
                              className="p-1 text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                              title={t('admin.save')}
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditingReferralCode}
                              disabled={updatingCode}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                              title={t('admin.cancel')}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : affiliate.referralLink ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-gray-900">
                              {affiliate.referralLink.code}
                            </span>
                            <button
                              onClick={() => startEditingReferralCode(affiliate)}
                              className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                              title="Wijzig referral code"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {affiliate.parentAffiliate ? (
                          <div className="text-sm">
                            <p className="text-gray-900 font-medium">Parent:</p>
                            <p className="text-gray-700">{affiliate.parentAffiliate.name}</p>
                            <p className="text-xs text-gray-500">{affiliate.parentAffiliate.email}</p>
                          </div>
                        ) : affiliate.childAffiliates.length > 0 ? (
                          <div className="text-sm">
                            <p className="text-gray-900 font-medium">Sub-affiliates:</p>
                            <p className="text-emerald-600 font-semibold">{affiliate.childAffiliates.length}</p>
                            {affiliate.childAffiliates.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {affiliate.childAffiliates.slice(0, 2).map((child) => (
                                  <p key={child.id} className="text-xs text-gray-500 truncate max-w-[150px]">
                                    • {child.name}
                                  </p>
                                ))}
                                {affiliate.childAffiliates.length > 2 && (
                                  <p className="text-xs text-gray-400">
                                    +{affiliate.childAffiliates.length - 2} meer
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(affiliate.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {affiliate.status === 'ACTIVE' ? (
                            <button
                              onClick={() => updateAffiliateStatus(affiliate.id, 'SUSPENDED')}
                              disabled={updatingStatus === affiliate.id}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              title="Schors affiliate"
                            >
                              <Ban className="w-3 h-3" />
                              {updatingStatus === affiliate.id ? '...' : 'Schors'}
                            </button>
                          ) : (
                            <button
                              onClick={() => updateAffiliateStatus(affiliate.id, 'ACTIVE')}
                              disabled={updatingStatus === affiliate.id}
                              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              title="Activeer affiliate"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {updatingStatus === affiliate.id ? '...' : 'Activeer'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Income Tab */}
      {activeTab === 'income' && (
        <div className="space-y-6">
          {/* Top Performers */}
          {data.topPerformers && data.topPerformers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Top 10 Performers
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Totaal Inkomen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Abonnementen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transacties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uitbetaald
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschikbaar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.topPerformers.map((performer, index) => (
                      <tr key={performer.affiliateId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {performer.affiliateName}
                            </p>
                            <p className="text-sm text-gray-500">{performer.affiliateEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-emerald-600">
                            {formatCurrency(performer.totalIncome)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">
                            {formatCurrency(performer.subscriptionIncome)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">
                            {formatCurrency(performer.transactionIncome)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(performer.paidOut)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-yellow-600">
                            {formatCurrency(performer.pending)}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-blue-600">
                            {formatCurrency(performer.available)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Complete Income Overview */}
          {data.affiliateIncomes && data.affiliateIncomes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Volledig Inkomsten Overzicht
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Zoek affiliate..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      onClick={fetchData}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Ververs
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Totaal Inkomen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Abonnementen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transacties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Terugbetalingen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uitbetaald
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschikbaar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commissies
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.affiliateIncomes
                      .filter((income) => {
                        const matchesSearch =
                          income.affiliate.name
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          income.affiliate.email
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          income.affiliate.username
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase());
                        return matchesSearch;
                      })
                      .sort((a, b) => b.totalIncome - a.totalIncome)
                      .map((income) => (
                        <tr key={income.affiliateId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {income.affiliate.name}
                              </p>
                              <p className="text-sm text-gray-500">{income.affiliate.email}</p>
                              {income.affiliate.username && (
                                <p className="text-xs text-gray-400">
                                  @{income.affiliate.username}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-emerald-600">
                              {formatCurrency(income.totalIncome)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(income.subscriptionIncome)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {income.subscriptionCount} commissies
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(income.transactionIncome)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {income.transactionCount} commissies
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {income.refundAmount > 0 ? (
                              <p className="text-sm font-semibold text-red-600">
                                -{formatCurrency(income.refundAmount)}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400">-</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(income.paidOut)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-yellow-600">
                              {formatCurrency(income.pending)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-blue-600">
                              {formatCurrency(income.available)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-900">{income.commissionCount}</p>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Affiliates with Sub-Affiliates - Hierarchical View */}
          {data.affiliateIncomes && data.affiliateIncomes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    Affiliates & Sub-Affiliates Overzicht
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Zoek affiliate..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {data.affiliateIncomes
                  .filter((income) => !income.parentAffiliate) // Only show main affiliates (no parents)
                  .filter((income) => {
                    const matchesSearch =
                      income.affiliate.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      income.affiliate.email
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      income.affiliate.username
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase());
                    return matchesSearch;
                  })
                  .sort((a, b) => b.totalIncome - a.totalIncome)
                  .map((mainIncome) => {
                    const isExpanded = expandedAffiliates.has(mainIncome.affiliateId);
                    const subIncomes = data.affiliateIncomes?.filter(
                      (sub) => sub.parentAffiliate?.id === mainIncome.affiliateId
                    ) || [];
                    const totalWithSubs = mainIncome.totalIncome + subIncomes.reduce(
                      (sum, sub) => sum + sub.totalIncome,
                      0
                    );

                    return (
                      <div key={mainIncome.affiliateId} className="hover:bg-gray-50 transition-colors">
                        {/* Main Affiliate */}
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedAffiliates);
                                    if (isExpanded) {
                                      newExpanded.delete(mainIncome.affiliateId);
                                    } else {
                                      newExpanded.add(mainIncome.affiliateId);
                                    }
                                    setExpandedAffiliates(newExpanded);
                                  }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-5 h-5" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5" />
                                  )}
                                </button>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="w-5 h-5 text-emerald-600" />
                                    <p className="text-lg font-semibold text-gray-900">
                                      {mainIncome.affiliate.name}
                                    </p>
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                      Hoofd Affiliate
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {mainIncome.affiliate.email}
                                  </p>
                                  {mainIncome.affiliate.username && (
                                    <p className="text-xs text-gray-400">
                                      @{mainIncome.affiliate.username}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Income Breakdown Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                {/* Direct Subscriptions */}
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    <p className="text-xs font-medium text-blue-700">
                                      Direct Abonnementen
                                    </p>
                                  </div>
                                  <p className="text-xl font-bold text-blue-900">
                                    {formatCurrency(mainIncome.directSubscriptionIncome || 0)}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    {mainIncome.directSubscriptionCount || 0} commissies
                                  </p>
                                </div>

                                {/* Direct Transactions */}
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                                    <p className="text-xs font-medium text-purple-700">
                                      Direct Transacties
                                    </p>
                                  </div>
                                  <p className="text-xl font-bold text-purple-900">
                                    {formatCurrency(mainIncome.directTransactionIncome || 0)}
                                  </p>
                                  <p className="text-xs text-purple-600 mt-1">
                                    {mainIncome.directTransactionCount || 0} commissies
                                  </p>
                                </div>

                                {/* Parent Commissions (from sub-affiliates) */}
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-orange-600" />
                                    <p className="text-xs font-medium text-orange-700">
                                      Van Sub-Affiliates
                                    </p>
                                  </div>
                                  <p className="text-xl font-bold text-orange-900">
                                    {formatCurrency(
                                      (mainIncome.parentSubscriptionIncome || 0) +
                                      (mainIncome.parentTransactionIncome || 0)
                                    )}
                                  </p>
                                  <p className="text-xs text-orange-600 mt-1">
                                    {((mainIncome.parentSubscriptionCount || 0) +
                                      (mainIncome.parentTransactionCount || 0))} commissies
                                  </p>
                                </div>

                                {/* Total Income */}
                                <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-300">
                                  <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    <p className="text-xs font-medium text-emerald-700">
                                      Totaal Inkomen
                                    </p>
                                  </div>
                                  <p className="text-2xl font-bold text-emerald-900">
                                    {formatCurrency(mainIncome.totalIncome)}
                                  </p>
                                  {subIncomes.length > 0 && (
                                    <p className="text-xs text-emerald-600 mt-1">
                                      + {subIncomes.length} sub-affiliates
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Status & Payout Info */}
                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                  <p className="text-xs text-green-700 font-medium mb-1">
                                    Uitbetaald
                                  </p>
                                  <p className="text-lg font-bold text-green-900">
                                    {formatCurrency(mainIncome.paidOut)}
                                  </p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                  <p className="text-xs text-yellow-700 font-medium mb-1">
                                    Pending
                                  </p>
                                  <p className="text-lg font-bold text-yellow-900">
                                    {formatCurrency(mainIncome.pending)}
                                  </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <p className="text-xs text-blue-700 font-medium mb-1">
                                    Beschikbaar
                                  </p>
                                  <p className="text-lg font-bold text-blue-900">
                                    {formatCurrency(mainIncome.available)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sub-Affiliates (Expandable) */}
                        {isExpanded && subIncomes.length > 0 && (
                          <div className="bg-gray-50 border-t border-gray-200">
                            <div className="p-4 pl-12">
                              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Sub-Affiliates ({subIncomes.length})
                              </p>
                              <div className="space-y-3">
                                {subIncomes.map((subIncome) => (
                                  <div
                                    key={subIncome.affiliateId}
                                    className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <User className="w-4 h-4 text-gray-500" />
                                          <p className="text-sm font-semibold text-gray-900">
                                            {subIncome.affiliate.name}
                                          </p>
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                            Sub-Affiliate
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          {subIncome.affiliate.email}
                                        </p>

                                        {/* Sub-Affiliate Income Breakdown */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                          <div className="bg-blue-50 rounded p-2 border border-blue-100">
                                            <p className="text-xs text-blue-700 font-medium">
                                              Abonnementen
                                            </p>
                                            <p className="text-sm font-bold text-blue-900">
                                              {formatCurrency(
                                                (subIncome.subSubscriptionIncome || 0) +
                                                (subIncome.directSubscriptionIncome || 0)
                                              )}
                                            </p>
                                          </div>
                                          <div className="bg-purple-50 rounded p-2 border border-purple-100">
                                            <p className="text-xs text-purple-700 font-medium">
                                              Transacties
                                            </p>
                                            <p className="text-sm font-bold text-purple-900">
                                              {formatCurrency(
                                                (subIncome.subTransactionIncome || 0) +
                                                (subIncome.directTransactionIncome || 0)
                                              )}
                                            </p>
                                          </div>
                                          <div className="bg-emerald-50 rounded p-2 border border-emerald-100">
                                            <p className="text-xs text-emerald-700 font-medium">
                                              Totaal
                                            </p>
                                            <p className="text-sm font-bold text-emerald-900">
                                              {formatCurrency(subIncome.totalIncome)}
                                            </p>
                                          </div>
                                          <div className="bg-green-50 rounded p-2 border border-green-100">
                                            <p className="text-xs text-green-700 font-medium">
                                              Uitbetaald
                                            </p>
                                            <p className="text-sm font-bold text-green-900">
                                              {formatCurrency(subIncome.paidOut)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-semibold text-gray-700">
                                    Totaal (Hoofd + Sub-Affiliates)
                                  </p>
                                  <p className="text-lg font-bold text-emerald-600">
                                    {formatCurrency(totalWithSubs)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Complete Income Summary */}
          {data.affiliateIncomes && data.affiliateIncomes.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <PieChart className="w-6 h-6" />
                Totaal Inkomsten Overzicht
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                  <p className="text-sm opacity-90 mb-2">Direct Abonnementen</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      data.affiliateIncomes.reduce(
                        (sum, inc) => sum + (inc.directSubscriptionIncome || 0),
                        0
                      )
                    )}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {data.affiliateIncomes.reduce(
                      (sum, inc) => sum + (inc.directSubscriptionCount || 0),
                      0
                    )}{' '}
                    commissies
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                  <p className="text-sm opacity-90 mb-2">Direct Transacties</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      data.affiliateIncomes.reduce(
                        (sum, inc) => sum + (inc.directTransactionIncome || 0),
                        0
                      )
                    )}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {data.affiliateIncomes.reduce(
                      (sum, inc) => sum + (inc.directTransactionCount || 0),
                      0
                    )}{' '}
                    commissies
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                  <p className="text-sm opacity-90 mb-2">Sub-Affiliate Inkomsten</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      data.affiliateIncomes.reduce(
                        (sum, inc) =>
                          sum +
                          (inc.subSubscriptionIncome || 0) +
                          (inc.subTransactionIncome || 0),
                        0
                      )
                    )}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    Van sub-affiliates
                  </p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 border-2 border-white/50">
                  <p className="text-sm opacity-90 mb-2">Parent Commissies</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      data.affiliateIncomes.reduce(
                        (sum, inc) =>
                          sum +
                          (inc.parentSubscriptionIncome || 0) +
                          (inc.parentTransactionIncome || 0),
                        0
                      )
                    )}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    Van sub-affiliates
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/30">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Totaal Alle Inkomsten</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(
                      data.affiliateIncomes.reduce((sum, inc) => sum + inc.totalIncome, 0)
                    )}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm opacity-90">
                  <p>Totaal Uitbetaald</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(
                      data.affiliateIncomes.reduce((sum, inc) => sum + inc.paidOut, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Income Trends */}
          {data.affiliateIncomes && data.affiliateIncomes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Maandelijkse Inkomsten Trends (Laatste 12 Maanden)
              </h3>
              <div className="space-y-4">
                {data.affiliateIncomes
                  .filter((income) => income.totalIncome > 0)
                  .sort((a, b) => b.totalIncome - a.totalIncome)
                  .slice(0, 5)
                  .map((income) => {
                    const months = Object.keys(income.monthlyIncome)
                      .sort()
                      .reverse()
                      .slice(0, 12);
                    const maxIncome = Math.max(
                      ...Object.values(income.monthlyIncome),
                      1
                    );

                    return (
                      <div key={income.affiliateId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {income.affiliate.name}
                            </p>
                            <p className="text-xs text-gray-500">{income.affiliate.email}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-600">
                            Totaal: {formatCurrency(income.totalIncome)}
                          </p>
                        </div>
                        <div className="flex items-end gap-1 h-32">
                          {months.map((month) => {
                            const amount = income.monthlyIncome[month] || 0;
                            const height = (amount / maxIncome) * 100;
                            return (
                              <div
                                key={month}
                                className="flex-1 flex flex-col items-center gap-1"
                              >
                                <div
                                  className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                                  style={{ height: `${height}%` }}
                                  title={`${month}: ${formatCurrency(amount)}`}
                                />
                                <p className="text-xs text-gray-400 transform -rotate-45 origin-top-left whitespace-nowrap">
                                  {month.split('-')[1]}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Alle Commissies</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bedrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{commission.affiliateName}</p>
                        <p className="text-sm text-gray-500">{commission.affiliateEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {commission.eventType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className={`text-sm font-semibold ${
                        commission.amountCents >= 0 ? 'text-gray-900' : 'text-red-600'
                      }`}>
                        {formatCurrency(commission.amountCents)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCommissionStatusBadge(commission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(commission.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Alle Uitbetalingen</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bedrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stripe Transfer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payout.affiliateName}</p>
                        <p className="text-sm text-gray-500">{payout.affiliateEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payout.amountCents)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPayoutStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.stripeTransferId ? (
                        <a
                          href={`https://dashboard.stripe.com/transfers/${payout.stripeTransferId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline"
                        >
                          {payout.stripeTransferId.substring(0, 20)}...
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payout.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Links & QR Code Tab */}
      {activeTab === 'links' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-emerald-600" />
              Affiliate Signup Link & QR Code
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Gebruik deze link en QR code om mensen rechtstreeks naar de affiliate signup pagina te sturen. 
              Ze kunnen zich dan aanmelden als affiliate.
            </p>

            {/* Link Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate Signup Link
              </label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-sm break-all min-w-0">
                  {getAffiliateSignupLink()}
                </div>
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Gekopieerd
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Kopieer Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="border-t pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* QR Code Display */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex-shrink-0">
                  {typeof window !== 'undefined' && (
                    <QRCodeSVG
                      value={getAffiliateSignupLink()}
                      size={200}
                      level="H"
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  )}
                </div>

                {/* QR Code Info & Actions */}
                <div className="flex-1">
                  <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    QR Code voor Affiliate Signup
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Download of deel deze QR code voor flyers, posters, websites, etc.
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <button
                      onClick={() => downloadQRCode('standard', 'png')}
                      disabled={downloading || !qrCodeUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {downloading ? 'Downloaden...' : 'Download PNG'}
                    </button>
                    <button
                      onClick={() => downloadQRCode('large', 'png')}
                      disabled={downloading || !qrCodeUrlLarge}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Download Groot PNG
                    </button>
                    <button
                      onClick={() => downloadQRCode('standard', 'svg')}
                      disabled={downloading || !qrCodeUrlSvg}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Download SVG
                    </button>
                    <button
                      onClick={printQRCode}
                      disabled={!qrCodeUrl}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Printer className="w-4 h-4" />
                      Printen
                    </button>
                  </div>

                  {/* More Options */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Meer opties
                    </summary>
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={copyImageUrl}
                        disabled={!qrCodeUrl}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Kopieer Afbeelding URL
                      </button>
                      <button
                        onClick={copyEmbedCode}
                        disabled={!qrCodeUrl}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        Kopieer Embed Code
                      </button>
                    </div>
                  </details>
                  
                  <p className="text-xs text-gray-500 mt-4">
                    Tip: Gebruik de grote PNG voor print materiaal en SVG voor websites.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attributions Tab */}
      {activeTab === 'attributions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-emerald-600" />
              Gebruiker koppelen aan Affiliate
            </h2>

            {/* User Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek gebruiker (email, naam of gebruikersnaam)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setUserSearchQuery(query);
                    if (query.length >= 2) {
                      searchUsers(query);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  placeholder="Typ om te zoeken..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setUserSearchQuery(user.email);
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{user.name || user.email}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.username && (
                        <div className="text-xs text-gray-400">@{user.username}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{selectedUser.name || selectedUser.email}</div>
                      <div className="text-sm text-gray-600">{selectedUser.email}</div>
                      {selectedUser.username && (
                        <div className="text-xs text-gray-500">@{selectedUser.username}</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setUserSearchQuery('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Affiliate Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecteer Affiliate
              </label>
              <select
                value={selectedAffiliateId}
                onChange={(e) => setSelectedAffiliateId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">-- Selecteer affiliate --</option>
                {data?.affiliates
                  .filter((aff) => aff.status === 'ACTIVE')
                  .map((aff) => (
                    <option key={aff.id} value={aff.id}>
                      {aff.user.name} ({aff.user.email})
                      {aff.parentAffiliateId ? ' [Sub]' : ' [Main]'}
                    </option>
                  ))}
              </select>
            </div>

            {/* Attribution Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type koppeling
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="USER_SIGNUP"
                    checked={attributionType === 'USER_SIGNUP'}
                    onChange={(e) => setAttributionType(e.target.value as any)}
                    className="mr-2"
                  />
                  <span>Gebruiker Aanmelding</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="BUSINESS_SIGNUP"
                    checked={attributionType === 'BUSINESS_SIGNUP'}
                    onChange={(e) => setAttributionType(e.target.value as any)}
                    className="mr-2"
                  />
                  <span>Bedrijf Aanmelding</span>
                </label>
              </div>
            </div>

            {/* Link Button */}
            <button
              onClick={handleLinkUserToAffiliate}
              disabled={!selectedUser || !selectedAffiliateId || linkingUser}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {linkingUser ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Koppelen...
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  Koppel Gebruiker aan Affiliate
                </>
              )}
            </button>
          </div>

          {/* Existing Attributions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-600" />
              Bestaande Koppelingen
            </h2>

            {loadingAttributions ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Laden...</p>
              </div>
            ) : attributions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen koppelingen gevonden</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gebruiker</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bron</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aangemaakt</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Geldig tot</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attributions.map((attr) => (
                      <tr key={attr.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{attr.user.name || attr.user.email}</div>
                          <div className="text-sm text-gray-500">{attr.user.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{attr.affiliate.user.name || attr.affiliate.user.email}</div>
                          <div className="text-sm text-gray-500">{attr.affiliate.user.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            attr.type === 'USER_SIGNUP' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {attr.type === 'USER_SIGNUP' ? 'Gebruiker' : 'Bedrijf'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            attr.source === 'MANUAL' 
                              ? 'bg-orange-100 text-orange-800' 
                              : attr.source === 'REF_LINK'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {attr.source === 'MANUAL' ? 'Handmatig' : attr.source === 'REF_LINK' ? 'Referral Link' : 'Promo Code'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(attr.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(attr.endsAt)}
                          {new Date(attr.endsAt) > new Date() ? (
                            <span className="ml-2 text-green-600">✓ Actief</span>
                          ) : (
                            <span className="ml-2 text-red-600">✗ Verlopen</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={fetchAttributions}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Vernieuwen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

