'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import { Gift, Plus, Edit, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PromoCode {
  id: string;
  code: string;
  discountSharePct: number;
  startsAt: string;
  endsAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  status: string;
  createdAt: string;
}

export default function PromoCodesClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('/api/affiliate/promo-codes');
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: PromoCode) => {
    // Different confirmation messages based on whether code has been used
    const confirmMessage = code.redemptionCount > 0
      ? t('affiliate.dashboard.promoCodes.confirmDisable')
      : t('affiliate.dashboard.promoCodes.confirmDelete');
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/affiliate/promo-codes/${code.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        // Show appropriate success message
        if (data.action === 'deleted') {
          alert(t('affiliate.dashboard.promoCodes.deleteSuccess'));
        } else if (data.action === 'disabled') {
          alert(t('affiliate.dashboard.promoCodes.disableSuccess'));
        }
        fetchPromoCodes();
      } else {
        const errorData = await response.json();
        alert(errorData.error || t('affiliate.dashboard.promoCodes.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert(t('affiliate.dashboard.promoCodes.deleteError'));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('affiliate.dashboard.promoCodes.loading')}</p>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">{t('affiliate.dashboard.promoCodes.title')}</h1>
              <p className="text-gray-600">{t('affiliate.dashboard.promoCodes.manage')}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/affiliate/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                {t('affiliate.dashboard.title')}
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('affiliate.dashboard.promoCodes.newPromoCode')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {promoCodes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('affiliate.dashboard.promoCodes.noPromoCodes')}</h3>
            <p className="text-gray-600 mb-6">{t('affiliate.dashboard.promoCodes.noPromoCodesDesc')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t('affiliate.dashboard.promoCodes.createPromoCode')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promoCodes.map((code) => (
              <div key={code.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{code.code}</h3>
                    <p className="text-sm text-gray-600">
                      {code.discountSharePct}{t('affiliate.dashboard.promoCodes.discountFromCommission')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('affiliate.dashboard.promoCodes.forBusinessSubscriptions')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      code.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {code.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('affiliate.dashboard.promoCodes.redemptions')}</span>
                    <span className="font-semibold">
                      {code.redemptionCount}
                      {code.maxRedemptions && ` / ${code.maxRedemptions}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('affiliate.dashboard.promoCodes.validUntil')}</span>
                    <span className="font-semibold">
                      {code.endsAt
                        ? new Date(code.endsAt).toLocaleDateString()
                        : t('affiliate.dashboard.promoCodes.noExpiry')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCode(code.code)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {t('affiliate.dashboard.promoCodes.copy')}
                  </button>
                  {code.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleDelete(code)}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        code.redemptionCount > 0
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title={
                        code.redemptionCount > 0
                          ? t('affiliate.dashboard.promoCodes.disableTooltip')
                          : t('affiliate.dashboard.promoCodes.deleteTooltip')
                      }
                    >
                      {code.redemptionCount > 0 ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs">{t('affiliate.dashboard.promoCodes.disable')}</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">{t('affiliate.dashboard.promoCodes.delete')}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="px-3 py-2 text-xs text-gray-500">
                      {t('affiliate.dashboard.promoCodes.disabled')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal - Simplified version, you can expand this */}
      {showCreateModal && (
        <CreatePromoCodeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPromoCodes();
          }}
        />
      )}
    </div>
  );
}

function CreatePromoCodeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [discountSharePct, setDiscountSharePct] = useState(0);
  const [endsAt, setEndsAt] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);

  // Fetch affiliate info to check if sub-affiliate
  useEffect(() => {
    fetch('/api/affiliate/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data?.affiliate?.isSubAffiliate) {
          setIsSubAffiliate(true);
        }
      })
      .catch(err => console.error('Error fetching affiliate info:', err));
  }, []);

  // Maximum discount percentage based on affiliate type
  // Main affiliates: 80% max (must keep 20% = 10% of total)
  // Sub-affiliates: 75% max (must keep 25% = 10% of total, since they get 40% commission)
  // Van €40 commissie kan max €30 korting (75%), blijft €10 over (25% = 10% van totaal)
  const maxDiscountPct = isSubAffiliate ? 75 : 80;

  // Calculate example based on discount percentage and affiliate type
  // Use useMemo to recalculate when isSubAffiliate or discountSharePct changes
  const example = (() => {
    const examplePriceCents = 9900; // €99 example subscription
    const baseCommissionPct = isSubAffiliate ? 0.40 : 0.50; // 40% for sub, 50% for main
    const baseCommissionCents = Math.round(examplePriceCents * baseCommissionPct);
    const discountFromCommission = Math.round(baseCommissionCents * (discountSharePct / 100));
    const finalPrice = examplePriceCents - discountFromCommission;
    const finalCommission = baseCommissionCents - discountFromCommission;
    const homecheffShare = Math.round(examplePriceCents * 0.50); // HomeCheff always gets 50% of base
    
    return {
      basePrice: examplePriceCents,
      baseCommission: baseCommissionCents,
      discountAmount: discountFromCommission,
      finalPrice,
      finalCommission,
      homecheffShare,
      commissionPct: (baseCommissionPct * 100).toFixed(0),
    };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate discount percentage doesn't exceed maximum
    if (discountSharePct > maxDiscountPct) {
      const errorMsg = isSubAffiliate 
        ? t('affiliate.dashboard.promoCodes.maxDiscountErrorSub', { max: maxDiscountPct })
        : t('affiliate.dashboard.promoCodes.maxDiscountError', { max: maxDiscountPct });
      alert(errorMsg);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/affiliate/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discountSharePct,
          endsAt: endsAt || null,
          maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || t('affiliate.dashboard.promoCodes.createError'));
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      alert(t('affiliate.dashboard.promoCodes.createError'));
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('affiliate.dashboard.promoCodes.createPromoCode')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('affiliate.dashboard.promoCodes.code')}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('affiliate.dashboard.promoCodes.discountPct')}
            </label>
            <input
              type="number"
              min="0"
              max={maxDiscountPct}
              value={discountSharePct}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setDiscountSharePct(Math.min(value, maxDiscountPct));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-semibold text-gray-700">
                {t('affiliate.dashboard.promoCodes.maxDiscount')}: {maxDiscountPct}%
              </span>
              {' '}
              {isSubAffiliate 
                ? t('affiliate.dashboard.promoCodes.maxDiscountDescSub')
                : t('affiliate.dashboard.promoCodes.maxDiscountDesc')}
            </p>
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-600 font-medium">
                {t('affiliate.dashboard.promoCodes.discountExplanation')}
              </p>
              {isSubAffiliate ? (
                <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                  {t('affiliate.dashboard.promoCodes.discountExplanationSubDetail')}
                </p>
              ) : (
                <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                  {t('affiliate.dashboard.promoCodes.discountExplanationDetail')}
                </p>
              )}
            </div>
            {discountSharePct > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-semibold text-blue-900 mb-2">{t('affiliate.dashboard.promoCodes.exampleTitle')}</p>
                <div className="space-y-1 text-blue-800">
                  <p><strong>{t('affiliate.dashboard.promoCodes.exampleBasePrice')}:</strong> €{(example.basePrice / 100).toFixed(2)}</p>
                  <p><strong>{t('affiliate.dashboard.promoCodes.exampleYourCommission')}:</strong> {example.commissionPct}% = €{(example.baseCommission / 100).toFixed(2)}</p>
                  <p><strong>{t('affiliate.dashboard.promoCodes.exampleDiscountPct')}:</strong> {discountSharePct}% {t('affiliate.dashboard.promoCodes.exampleDiscountOfCommission')} = €{(example.discountAmount / 100).toFixed(2)}</p>
                  <p className="pt-2 border-t border-blue-300"><strong>{t('affiliate.dashboard.promoCodes.exampleBusinessPays')}:</strong> <span className="text-green-700 font-bold">€{(example.finalPrice / 100).toFixed(2)}</span></p>
                  <p><strong>{t('affiliate.dashboard.promoCodes.exampleYouGet')}:</strong> <span className="text-emerald-700 font-bold">€{(example.finalCommission / 100).toFixed(2)}</span> ({t('affiliate.dashboard.promoCodes.exampleYouGetDesc')})</p>
                  <p><strong>{t('affiliate.dashboard.promoCodes.exampleHomeCheffGets')}:</strong> €{(example.homecheffShare / 100).toFixed(2)} ({t('affiliate.dashboard.promoCodes.exampleHomeCheffGetsDesc')})</p>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-3 p-2 bg-gray-50 rounded border border-gray-200">
              <strong className="text-gray-700">{isSubAffiliate ? t('affiliate.dashboard.promoCodes.maxDiscountRuleSub') : t('affiliate.dashboard.promoCodes.maxDiscountRuleMain')}</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('affiliate.dashboard.promoCodes.expiryDate')}
            </label>
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('affiliate.dashboard.promoCodes.maxRedemptions')}
            </label>
            <input
              type="number"
              min="1"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {submitting ? t('affiliate.dashboard.promoCodes.creating') : t('affiliate.dashboard.promoCodes.create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('affiliate.dashboard.promoCodes.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

