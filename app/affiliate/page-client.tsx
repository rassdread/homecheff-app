'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DollarSign, Users, TrendingUp, Gift, CheckCircle, XCircle, User } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function AffiliatePageClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);
  const [userData, setUserData] = useState<{
    name?: string;
    email?: string;
    username?: string;
    hasSellerProfile?: boolean;
    hasDeliveryProfile?: boolean;
    privacyPolicyAccepted?: boolean;
    termsAccepted?: boolean;
  } | null>(null);
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptAffiliateAgreement, setAcceptAffiliateAgreement] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/profile/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            const hasPrivacy = data.user.privacyPolicyAccepted || false;
            const hasTerms = data.user.termsAccepted || false;
            
            // Check if user is a sub-affiliate
            if (data.user.affiliate?.parentAffiliateId) {
              setIsSubAffiliate(true);
              // Redirect to dashboard if already a sub-affiliate
              router.push('/affiliate/dashboard');
              return;
            }
            
            setUserData({
              name: data.user.name,
              email: data.user.email,
              username: data.user.username,
              hasSellerProfile: !!data.user.SellerProfile,
              hasDeliveryProfile: !!data.user.DeliveryProfile,
              privacyPolicyAccepted: hasPrivacy,
              termsAccepted: hasTerms,
            });
            
            if (hasPrivacy) setAcceptPrivacyPolicy(true);
            if (hasTerms) setAcceptTerms(true);
          }
        })
        .catch(err => console.error('Error fetching user data:', err));
    }
  }, [session, router]);

  const handleSignup = async () => {
    if (!acceptPrivacyPolicy) {
      alert(t('affiliate.mustAcceptPrivacy'));
      return;
    }
    
    if (!acceptTerms) {
      alert(t('affiliate.mustAcceptTerms'));
      return;
    }
    
    if (!acceptAffiliateAgreement) {
      alert(t('affiliate.mustAcceptAffiliate'));
      return;
    }

    setIsSigningUp(true);
    try {
      const response = await fetch('/api/affiliate/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptPrivacyPolicy,
          acceptTerms,
          acceptAffiliateAgreement,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof window !== 'undefined' && (window as any).location) {
          setTimeout(() => {
            router.push('/affiliate/dashboard?welcome=true');
            router.refresh();
          }, 500);
        }
      } else {
        const error = await response.json();
        alert(error.error || t('affiliate.signupError'));
        setIsSigningUp(false);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      alert(t('affiliate.signupError'));
      setIsSigningUp(false);
    }
  };

  // Don't show page if user is a sub-affiliate
  if (isSubAffiliate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('affiliate.subAffiliateNotAllowed') || 'Sub-Affiliates kunnen geen affiliate worden'}</h1>
          <p className="text-gray-600 mb-6">{t('affiliate.subAffiliateNotAllowedDesc') || 'Als sub-affiliate kun je geen main affiliate worden. Je kunt wel je sub-affiliate dashboard gebruiken.'}</p>
          <Link href="/affiliate/dashboard" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors inline-block">
            {t('affiliate.goToDashboard') || 'Ga naar Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="text-center mb-4">
            <div className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold mb-3">
              {t('affiliate.temporary')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t('affiliate.title')} <span className="text-emerald-600">12-12</span>
            </h1>
            <p className="text-sm font-semibold text-emerald-700 mb-3">
              {t('affiliate.twelveTwelveDescription')}
            </p>
            <p className="text-sm text-orange-700 mb-4">
              {t('affiliate.temporaryNotice')}
            </p>
            <p className="text-sm text-gray-600">
              <strong className="text-emerald-700">{t('affiliate.selectedMessage')}</strong>
              <br />
              {t('affiliate.earnCommission')}
            </p>
          </div>
        </div>

        {/* Commissions - Simple List */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('affiliate.howEarnCommission')}</h2>
          
          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">{t('affiliate.usersCommission')}</h3>
              <p className="text-sm text-gray-600">{t('affiliate.usersCommissionDesc')}</p>
              <p className="text-xs text-gray-500 mt-1">• {t('affiliate.buyerBringing')} {t('affiliate.buyerBringingDesc')}</p>
              <p className="text-xs text-gray-500">• {t('affiliate.sellerBringing')} {t('affiliate.sellerBringingDesc')}</p>
              <p className="text-xs text-gray-500">• {t('affiliate.bothBringing')} {t('affiliate.bothBringingDesc')}</p>
            </div>

            <div className="border-l-4 border-emerald-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">{t('affiliate.businessCommission')}</h3>
              <p className="text-sm text-gray-600">{t('affiliate.businessCommissionDesc')}</p>
              <p className="text-xs text-gray-500 mt-1">• {t('affiliate.basicExample')}</p>
              <p className="text-xs text-gray-500">• {t('affiliate.proExample')}</p>
              <p className="text-xs text-gray-500">• {t('affiliate.premiumExample')}</p>
              <p className="text-xs text-gray-500 mt-2">• {t('affiliate.homecheffAlways50')}</p>
              <p className="text-xs text-gray-500">• {t('affiliate.canGiveDiscount')}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700 mb-3">
            <p><strong>💡 {t('affiliate.everyoneWorthMoney')}:</strong> {t('affiliate.everyoneWorthMoneyDesc')}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm text-gray-700">
            <p><strong>{t('affiliate.twelveTwelveProgram')}:</strong> {t('affiliate.twelveTwelveFullDescription')}</p>
          </div>
        </div>

        {/* How it Works - Simple */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('affiliate.howItWorks')}</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-emerald-600">1.</span>
              <span>{t('affiliate.step1')} {t('affiliate.step1Desc')}</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-emerald-600">2.</span>
              <span>{t('affiliate.step2')} {t('affiliate.step2Desc')}</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-emerald-600">3.</span>
              <span>{t('affiliate.step3')} {t('affiliate.step3Desc')}</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-emerald-600">4.</span>
              <span>{t('affiliate.step4')} {t('affiliate.step4Desc')}</span>
            </li>
          </ol>
        </div>

        {/* Passive Income - Compact */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">💰 {t('affiliate.passiveIncomeTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="border rounded p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t('affiliate.whatItCosts')}</h3>
              <p className="text-2xl font-bold text-emerald-600">€0</p>
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.signupCost')} + {t('affiliate.monthlyCosts')}</p>
            </div>
            <div className="border rounded p-4 bg-emerald-50">
              <h3 className="font-semibold text-gray-900 mb-2">{t('affiliate.whatYouEarn')}</h3>
              <p className="text-2xl font-bold text-emerald-600">€1,378{t('affiliate.perMonth')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.year2Plus')} ({t('affiliate.realistic')})</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 bg-gray-50 rounded p-3">
            <strong>{t('affiliate.example')}:</strong> {t('affiliate.realisticDesc')} = {t('affiliate.exampleCalculation', { subscriptions: '€1,188', transactions: '€190', total: '€1,378' })}. 
            {t('affiliate.twelveTwelveExample')} {t('affiliate.financialSecurity.keyPoints.point1Desc')}
          </p>
        </div>

        {/* Sharing - Compact */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📱 {t('affiliate.easySharing.title')}</h2>
          <p className="text-sm text-gray-600 mb-3">{t('affiliate.easySharing.automatic')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl mb-1">🍳</div>
              <p className="font-medium">{t('affiliate.easySharing.recipes')}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl mb-1">🛒</div>
              <p className="font-medium">{t('affiliate.easySharing.products')}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl mb-1">🌱</div>
              <p className="font-medium">{t('affiliate.easySharing.garden')}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-2xl mb-1">🎨</div>
              <p className="font-medium">{t('affiliate.easySharing.designs')}</p>
            </div>
          </div>
        </div>

        {/* Existing User Info */}
        {userData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{t('affiliate.existingAccountTitle')}</h3>
                <p className="text-xs text-gray-600 mb-2">
                  {t('affiliate.existingAccountDesc')} <strong>{userData.name || userData.email}</strong>
                  {userData.username && ` (@${userData.username})`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {userData.hasSellerProfile && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">✓ {t('affiliate.sellerRole')}</span>
                  )}
                  {userData.hasDeliveryProfile && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">✓ {t('affiliate.deliveryRole')}</span>
                  )}
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs">+ {t('affiliate.affiliateRole')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms - Only if logged in */}
        {session?.user && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('affiliate.requiredAcceptances')}</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptPrivacyPolicy"
                  checked={acceptPrivacyPolicy}
                  onChange={(e) => setAcceptPrivacyPolicy(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                  required
                />
                <label htmlFor="acceptPrivacyPolicy" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">{t('affiliate.acceptPrivacy')}</span>
                  <Link href="/privacy" target="_blank" className="text-emerald-600 hover:underline ml-1 text-xs">
                    ({t('affiliate.readPrivacy')})
                  </Link>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                  required
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">{t('affiliate.acceptTerms')}</span>
                  <Link href="/terms" target="_blank" className="text-emerald-600 hover:underline ml-1 text-xs">
                    ({t('affiliate.readTerms')})
                  </Link>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptAffiliateAgreement"
                  checked={acceptAffiliateAgreement}
                  onChange={(e) => setAcceptAffiliateAgreement(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                  required
                />
                <label htmlFor="acceptAffiliateAgreement" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">{t('affiliate.acceptAffiliate')}</span>
                  <span className="text-xs text-gray-500 block mt-1">{t('affiliate.acceptAffiliateDesc')}</span>
                </label>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t space-y-2 text-xs text-gray-600">
              <p><strong>{t('affiliate.twelveTwelveProgram')} - {t('affiliate.guaranteed12Months')}:</strong> {t('affiliate.twelveTwelveDescription')}. {t('affiliate.guaranteed12MonthsDesc')}</p>
              <p><strong>{t('affiliate.contractRenewal')}:</strong> {t('affiliate.contractRenewalDesc')}</p>
              <p className="italic">{t('affiliate.contractTermsDesc')}</p>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">⚠️ {t('affiliate.taxInfo.title')}</h3>
              <p className="text-xs text-gray-600 mb-2">{t('affiliate.taxInfo.importantDesc')}</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li>{t('affiliate.taxInfo.point1')}</li>
                <li>{t('affiliate.taxInfo.point2')}</li>
                <li>{t('affiliate.taxInfo.point3')}</li>
                <li>{t('affiliate.taxInfo.point4')}</li>
                <li>{t('affiliate.taxInfo.point5')}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Account Required - If not logged in */}
        {!session?.user && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('affiliate.accountRequired.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">{t('affiliate.accountRequired.description')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register?returnUrl=/affiliate"
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                {t('affiliate.accountRequired.createAccount')}
              </Link>
              <Link
                href="/login?callbackUrl=/affiliate"
                className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold border-2 border-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                {t('affiliate.accountRequired.login')}
              </Link>
            </div>
          </div>
        )}

        {/* CTA - Simple */}
        {session?.user && (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center mb-6 pb-20 md:pb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('affiliate.readyToStart')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {userData ? t('affiliate.readyToStartDesc') : t('affiliate.readyToStartDescNew')}
            </p>
            <button
              onClick={handleSignup}
              disabled={isSigningUp || !acceptPrivacyPolicy || !acceptTerms || !acceptAffiliateAgreement}
              className="w-full sm:w-auto min-w-[280px] bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold text-base shadow-lg hover:bg-emerald-700 hover:shadow-xl active:bg-emerald-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:hover:shadow-lg border-2 border-emerald-700 disabled:border-emerald-400 relative z-10"
              style={{
                minHeight: '44px', // iOS minimum touch target
                WebkitTapHighlightColor: 'rgba(16, 185, 129, 0.3)'
              }}
            >
              {isSigningUp ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t('affiliate.signingUp')}
                </span>
              ) : (
                t('affiliate.signupButton')
              )}
            </button>
            {(!acceptPrivacyPolicy || !acceptTerms || !acceptAffiliateAgreement) && (
              <p className="text-red-600 text-xs mt-3">{t('affiliate.acceptAllRequired')}</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                {t('affiliate.free')}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                {t('affiliate.noObligations')}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                {t('affiliate.directActive')}
              </span>
            </div>
            <div className="mt-4">
              <Link 
                href="/affiliate/passive-income-calculator" 
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {t('affiliate.calculatePotential')} →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
