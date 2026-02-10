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
    // Fetch existing user data if logged in
    if (session?.user) {
      fetch('/api/profile/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            const hasPrivacy = data.user.privacyPolicyAccepted || false;
            const hasTerms = data.user.termsAccepted || false;
            
            setUserData({
              name: data.user.name,
              email: data.user.email,
              username: data.user.username,
              hasSellerProfile: !!data.user.SellerProfile,
              hasDeliveryProfile: !!data.user.DeliveryProfile,
              privacyPolicyAccepted: hasPrivacy,
              termsAccepted: hasTerms,
            });
            
            // Auto-check if user already accepted
            if (hasPrivacy) setAcceptPrivacyPolicy(true);
            if (hasTerms) setAcceptTerms(true);
          }
        })
        .catch(err => console.error('Error fetching user data:', err));
    }
  }, [session]);

  const handleSignup = async () => {
    // Validation
    if (!acceptPrivacyPolicy) {
      alert('Je moet de privacyverklaring accepteren om door te gaan.');
      return;
    }
    
    if (!acceptTerms) {
      alert('Je moet de algemene voorwaarden accepteren om door te gaan.');
      return;
    }
    
    if (!acceptAffiliateAgreement) {
      alert('Je moet het affiliate programma overeenkomst accepteren om door te gaan.');
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
        // Refresh session to get updated affiliate status
        // This ensures the dropdown menu shows affiliate dashboard immediately
        if (typeof window !== 'undefined' && (window as any).location) {
          // Force a page refresh to update session
          setTimeout(() => {
            router.push('/affiliate/dashboard?welcome=true');
            router.refresh(); // Refresh to update session
          }, 500);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Er ging iets mis bij het aanmelden. Probeer het opnieuw.');
        setIsSigningUp(false);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      alert('Er ging iets mis bij het aanmelden. Controleer je internetverbinding en probeer het opnieuw.');
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with selection message */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-6">
            🎉 {t('affiliate.selected')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {t('affiliate.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-emerald-700">{t('affiliate.selectedMessage')}</strong>
            <br />
            {t('affiliate.earnCommission')}
            <br />
            <strong className="text-emerald-700">• {t('affiliate.usersCommission')}</strong> {t('affiliate.usersCommissionDesc')}
            <br />
            <strong className="text-emerald-700">• {t('affiliate.businessCommission')}</strong> {t('affiliate.businessCommissionDesc')}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">
              {t('affiliate.revenueShare')}
            </span>
          </div>
        </div>

        {/* Own Your Area - New Section */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-10 mb-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full -ml-36 -mb-36"></div>
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">🏘️ {t('affiliate.ownYourArea')}</h2>
            <p className="text-xl md:text-2xl mb-6 opacity-95 max-w-4xl mx-auto font-semibold">
              {t('affiliate.ownYourAreaDesc')}
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-5xl mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
                <div className="text-5xl mb-4">🏘️</div>
                <h3 className="text-xl font-bold mb-3">{t('affiliate.ownYourNeighborhood')}</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {t('affiliate.ownYourNeighborhoodDesc')}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
                <div className="text-5xl mb-4">🏡</div>
                <h3 className="text-xl font-bold mb-3">{t('affiliate.ownYourVillage')}</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {t('affiliate.ownYourVillageDesc')}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border-2 border-white/30">
                <div className="text-5xl mb-4">🏙️</div>
                <h3 className="text-xl font-bold mb-3">{t('affiliate.ownYourCity')}</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {t('affiliate.ownYourCityDesc')}
                </p>
              </div>
            </div>
            <div className="mt-8 bg-white/20 backdrop-blur-sm rounded-lg p-6 border border-white/30 max-w-4xl mx-auto">
              <p className="font-bold text-lg mb-3">{t('affiliate.localMarketPower')}</p>
              <p className="text-sm opacity-95 leading-relaxed">
                {t('affiliate.localMarketPowerDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Security for Long Term */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-2xl shadow-2xl p-10 mb-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full -ml-36 -mb-36"></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                🛡️ {t('affiliate.financialSecurity.title')}
              </h2>
              <p className="text-xl md:text-2xl opacity-95 max-w-4xl mx-auto font-semibold">
                {t('affiliate.financialSecurity.subtitle')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 border-2 border-white/20">
              <p className="text-lg md:text-xl leading-relaxed text-center max-w-4xl mx-auto opacity-95">
                {t('affiliate.financialSecurity.mainMessage')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border-2 border-white/25">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">📅</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('affiliate.financialSecurity.keyPoints.point1')}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {t('affiliate.financialSecurity.keyPoints.point1Desc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border-2 border-white/25">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💰</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('affiliate.financialSecurity.keyPoints.point2')}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {t('affiliate.financialSecurity.keyPoints.point2Desc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border-2 border-white/25">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">✅</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('affiliate.financialSecurity.keyPoints.point3')}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {t('affiliate.financialSecurity.keyPoints.point3Desc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border-2 border-white/25">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">📈</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{t('affiliate.financialSecurity.keyPoints.point4')}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {t('affiliate.financialSecurity.keyPoints.point4Desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-xl p-8 mb-6 border-2 border-emerald-400/50">
              <h3 className="text-2xl font-bold mb-4 text-center">{t('affiliate.financialSecurity.exampleTitle')}</h3>
              <p className="text-center mb-6 opacity-95">{t('affiliate.financialSecurity.exampleDesc')}</p>
              
              <div className="bg-white/20 rounded-lg p-6 mb-4">
                <p className="font-bold text-lg mb-4 text-center">{t('affiliate.financialSecurity.exampleAfter12')}</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-300 mb-2">
                      {t('affiliate.financialSecurity.exampleMonthly')}
                    </div>
                    <p className="text-sm opacity-75">Blijvend passief inkomen</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-300 mb-2">
                      {t('affiliate.financialSecurity.exampleYearly')}
                    </div>
                    <p className="text-sm opacity-75">Jaar na jaar</p>
                  </div>
                </div>
                <p className="text-center mt-4 font-semibold text-lg">
                  {t('affiliate.financialSecurity.exampleContinues')}
                </p>
              </div>
            </div>

            <div className="bg-yellow-400/20 rounded-lg p-6 border-2 border-yellow-300/50">
              <p className="text-center text-lg font-semibold leading-relaxed">
                {t('affiliate.financialSecurity.securityMessage')}
              </p>
            </div>

            <div className="text-center mt-8">
              <p className="text-xl font-bold mb-4">{t('affiliate.financialSecurity.cta')}</p>
              <Link 
                href="#signup"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <TrendingUp className="w-6 h-6" />
                <span>{t('affiliate.signupButton')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Commission Structure - Consolidated */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-xl p-8 mb-12 text-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center">{t('affiliate.howEarnCommission')}</h2>
            <p className="text-center mb-8 opacity-95">{t('affiliate.everyoneWorthMoneyDesc')}</p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
                <div className="text-5xl mb-3 text-center">🛒</div>
                <h3 className="text-xl font-bold mb-2 text-center">{t('affiliate.buyers')}</h3>
                <p className="text-sm opacity-90 mb-3 text-center">{t('affiliate.buyersDesc')}</p>
                <p className="text-2xl font-bold text-center">€3 {t('affiliate.perTransaction')}</p>
                <p className="text-xs opacity-75 mt-2 text-center">{t('affiliate.platformFee')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
                <div className="text-5xl mb-3 text-center">🏪</div>
                <h3 className="text-xl font-bold mb-2 text-center">{t('affiliate.sellers')}</h3>
                <p className="text-sm opacity-90 mb-3 text-center">{t('affiliate.sellersDesc')}</p>
                <p className="text-2xl font-bold text-center">€3 {t('affiliate.perTransaction')}</p>
                <p className="text-xs opacity-75 mt-2 text-center">{t('affiliate.platformFee')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
                <div className="text-5xl mb-3 text-center">🏢</div>
                <h3 className="text-xl font-bold mb-2 text-center">{t('affiliate.businesses')}</h3>
                <p className="text-sm opacity-90 mb-3 text-center">{t('affiliate.businessesDesc')}</p>
                <div className="space-y-1 text-sm text-center">
                  <p className="font-bold">Basic: €19.50/maand</p>
                  <p className="font-bold">Pro: €49.50/maand</p>
                  <p className="font-bold">Premium: €99.50/maand</p>
                </div>
                <p className="text-xs opacity-75 mt-2 text-center">{t('affiliate.subscriptionCommission')}</p>
                <p className="text-xs opacity-75 mt-1 text-center">{t('affiliate.transactionCommission')}</p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('affiliate.usersBringing')}
                </h3>
                <div className="space-y-3 text-sm opacity-95">
                  <p>• <strong>{t('affiliate.buyerBringing')}</strong> {t('affiliate.buyerBringingDesc')}</p>
                  <p>• <strong>{t('affiliate.sellerBringing')}</strong> {t('affiliate.sellerBringingDesc')}</p>
                  <p>• <strong>{t('affiliate.bothBringing')}</strong> {t('affiliate.bothBringingDesc')}</p>
                  <p className="text-xs opacity-75 mt-2">💡 {t('affiliate.everyTransaction')}</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t('affiliate.businessBringing')}
                </h3>
                <div className="space-y-3 text-sm opacity-95">
                  <p>• <strong>{t('affiliate.businessBringingDesc')}</strong></p>
                  <p>• <strong>{t('affiliate.homecheffAlways50')}</strong></p>
                  <p>• <strong>{t('affiliate.canGiveDiscount')}</strong></p>
                  <div className="bg-white/20 rounded-lg p-4 mt-4">
                    <p className="font-semibold mb-2 text-xs">Voorbeelden:</p>
                    <div className="space-y-1 text-xs">
                      <p><strong>Basic (€39/maand):</strong> Jij €19.50, HomeCheff €19.50</p>
                      <p><strong>Pro (€99/maand):</strong> Jij €49.50, HomeCheff €49.50</p>
                      <p><strong>Premium (€199/maand):</strong> Jij €99.50, HomeCheff €99.50</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <p className="font-bold text-lg mb-2 text-center">🎯 {t('affiliate.bothSidesBonus')}</p>
              <p className="text-sm opacity-95 text-center">
                {t('affiliate.bothSidesDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* How it works - Simple steps */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t('affiliate.howItWorks')}</h2>
          <p className="text-center text-gray-600 mb-8">{t('affiliate.howItWorksDesc')}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('affiliate.step1')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('affiliate.step1Desc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('affiliate.step2')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('affiliate.step2Desc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('affiliate.step3')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('affiliate.step3Desc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{t('affiliate.step4')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('affiliate.step4Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Existing User Info */}
        {userData && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Je bestaande account wordt gebruikt</h3>
                <p className="text-sm text-gray-600 mb-3">
                  We gebruiken je bestaande gegevens: <strong>{userData.name || userData.email}</strong>
                  {userData.username && ` (@${userData.username})`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {userData.hasSellerProfile && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      ✓ Verkoper
                    </span>
                  )}
                  {userData.hasDeliveryProfile && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      ✓ Bezorger
                    </span>
                  )}
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    + Affiliate (wordt toegevoegd)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Je kunt meerdere rollen hebben. Alle dashboards zijn beschikbaar in je profiel menu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Passive Income Overview - Consolidated */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white rounded-2xl shadow-2xl p-10 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4">💰 Realistisch Passief Inkomen</h2>
              <p className="text-xl opacity-90">Met 2 bedrijven per maand bouw je een blijvend passief inkomen op</p>
            </div>

            {/* Key Insight */}
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-2xl">💡</div>
                <div>
                  <p className="font-semibold text-lg mb-2">Het Realistische Voordeel</p>
                  <p className="text-sm opacity-90 leading-relaxed">
                    <strong>2 bedrijven per maand is haalbaar:</strong> Dat is 1 bedrijf per 2 weken. 
                    Na 12 maanden heb je een blijvend passief inkomen van <strong>€1,378/maand</strong> 
                    (€1,188 subscriptions + €190 transacties) — zelfs als je stopt met nieuwe referrals!
                  </p>
                </div>
              </div>
            </div>

            {/* Cost vs Income */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-xl font-bold mb-4 text-center">Wat Het Kost</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-lg">
                    <span>Aanmelding:</span>
                    <span className="font-bold text-3xl">€0</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span>Maandelijkse kosten:</span>
                    <span className="font-bold text-3xl">€0</span>
                  </div>
                  <div className="border-t border-white/30 pt-4 mt-4">
                    <div className="text-center">
                      <div className="text-sm opacity-75 mb-1">Totaal investering</div>
                      <div className="text-4xl font-bold">€0</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm border-2 border-yellow-300/50">
                <h4 className="text-xl font-bold mb-4 text-center">Wat Je Verdient</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-lg">
                    <span>Jaar 1 (opbouw):</span>
                    <span className="font-bold text-2xl">€10,002</span>
                  </div>
                  <div className="text-xs opacity-75 mb-3">
                    * €7,722 subscriptions + €2,280 transacties
                  </div>
                  <div className="border-t border-white/30 pt-3">
                    <div className="flex justify-between items-center text-lg">
                      <span>Jaar 2+ (passief):</span>
                      <span className="font-bold text-2xl">€16,536/jaar</span>
                    </div>
                    <div className="flex justify-between items-center text-lg mt-2">
                      <span>Maandelijks:</span>
                      <span className="font-bold text-2xl">€1,378</span>
                    </div>
                  </div>
                  <div className="border-t border-white/30 pt-4 mt-4 bg-yellow-400/20 rounded-lg p-3">
                    <div className="text-center">
                      <div className="text-sm opacity-75 mb-1">ROI</div>
                      <div className="text-4xl font-bold">∞</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Realistic Examples - Simplified */}
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm mb-6">
              <h4 className="text-xl font-bold mb-4 text-center">🎯 Realistische Scenario's</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="font-semibold mb-2 text-center">Conservatief</p>
                  <p className="opacity-90 mb-3 text-xs text-center">1 bedrijf/maand + 5 verkopers</p>
                  <div className="space-y-1">
                    <p className="flex justify-between text-xs">
                      <span>Subscriptions:</span>
                      <span className="font-semibold">€594/maand</span>
                    </p>
                    <p className="flex justify-between text-xs">
                      <span>Transacties:</span>
                      <span className="font-semibold">€95/maand</span>
                    </p>
                    <p className="flex justify-between border-t border-white/30 pt-1 font-bold">
                      <span>Totaal:</span>
                      <span>€689/maand</span>
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg p-4 border-2 border-yellow-300/50">
                  <p className="font-semibold mb-2 text-center">Realistisch ⭐</p>
                  <p className="opacity-90 mb-3 text-xs text-center">2 bedrijven/maand + 10 verkopers</p>
                  <div className="space-y-1">
                    <p className="flex justify-between text-xs">
                      <span>Subscriptions:</span>
                      <span className="font-semibold">€1,188/maand</span>
                    </p>
                    <p className="flex justify-between text-xs">
                      <span>Transacties:</span>
                      <span className="font-semibold">€190/maand</span>
                    </p>
                    <p className="flex justify-between border-t border-white/30 pt-1 font-bold">
                      <span>Totaal:</span>
                      <span>€1,378/maand</span>
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="font-semibold mb-2 text-center">Ambitieus</p>
                  <p className="opacity-90 mb-3 text-xs text-center">3 bedrijven/maand + 15 verkopers</p>
                  <div className="space-y-1">
                    <p className="flex justify-between text-xs">
                      <span>Subscriptions:</span>
                      <span className="font-semibold">€1,782/maand</span>
                    </p>
                    <p className="flex justify-between text-xs">
                      <span>Transacties:</span>
                      <span className="font-semibold">€285/maand</span>
                    </p>
                    <p className="flex justify-between border-t border-white/30 pt-1 font-bold">
                      <span>Totaal:</span>
                      <span>€2,067/maand</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Timeline */}
            <div className="bg-white/10 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4 text-center">📈 Maandelijkse Groei (2 Pro Abonnementen/maand)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xs opacity-75 mb-1">Maand 1</div>
                  <div className="font-bold text-lg">€114</div>
                </div>
                <div className="text-center">
                  <div className="text-xs opacity-75 mb-1">Maand 3</div>
                  <div className="font-bold text-lg">€342</div>
                </div>
                <div className="text-center">
                  <div className="text-xs opacity-75 mb-1">Maand 6</div>
                  <div className="font-bold text-lg">€684</div>
                </div>
                <div className="text-center">
                  <div className="text-xs opacity-75 mb-1">Maand 12</div>
                  <div className="font-bold text-xl">€1,338</div>
                  <div className="text-xs opacity-75 mt-1">Blijvend passief!</div>
                </div>
              </div>
            </div>

            {/* Contract Renewal Information */}
            <div className="bg-blue-500/30 rounded-xl p-6 backdrop-blur-sm mb-6 border-2 border-blue-400/50">
              <h4 className="text-xl font-bold mb-4 text-center">📋 Contract Verlenging</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/20 rounded-lg p-4">
                  <p className="font-semibold mb-2">{t('affiliate.guaranteed12Months')}</p>
                  <p className="opacity-90 text-xs">{t('affiliate.guaranteed12MonthsDesc')}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <p className="font-semibold mb-2">{t('affiliate.contractRenewal')}</p>
                  <p className="opacity-90 text-xs">{t('affiliate.contractRenewalDesc')}</p>
                </div>
              </div>
              <p className="text-xs opacity-75 text-center mt-4 italic">
                {t('affiliate.contractTermsDesc')}
              </p>
            </div>

            <div className="text-center">
              <Link 
                href="/affiliate/passive-income-calculator"
                className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <TrendingUp className="w-6 h-6" />
                <span>Bereken Je Eigen Potentieel →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Terms and Agreements */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Verplichte acceptaties</h2>
          <div className="space-y-4">
            {/* Privacy Policy */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptPrivacyPolicy"
                checked={acceptPrivacyPolicy}
                onChange={(e) => setAcceptPrivacyPolicy(e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 mt-1 flex-shrink-0"
                required
              />
              <label htmlFor="acceptPrivacyPolicy" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">{t('affiliate.acceptPrivacy')}</span>
                <br />
                <span className="text-gray-500 text-xs">
                  {userData?.privacyPolicyAccepted 
                    ? t('affiliate.alreadyAccepted')
                    : 'Verplicht om door te gaan'}
                </span>
                <Link href="/privacy" target="_blank" className="text-emerald-600 hover:underline ml-1 text-xs">
                  (Lees privacyverklaring)
                </Link>
              </label>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 mt-1 flex-shrink-0"
                required
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">{t('affiliate.acceptTerms')}</span>
                <br />
                <span className="text-gray-500 text-xs">
                  {userData?.termsAccepted 
                    ? t('affiliate.alreadyAccepted')
                    : 'Verplicht om door te gaan'}
                </span>
                <Link href="/terms" target="_blank" className="text-emerald-600 hover:underline ml-1 text-xs">
                  (Lees voorwaarden)
                </Link>
              </label>
            </div>

            {/* Affiliate Agreement */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptAffiliateAgreement"
                checked={acceptAffiliateAgreement}
                onChange={(e) => setAcceptAffiliateAgreement(e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 mt-1 flex-shrink-0"
                required
              />
              <label htmlFor="acceptAffiliateAgreement" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-medium">{t('affiliate.acceptAffiliate')}</span>
                <br />
                <span className="text-gray-500 text-xs">
                  {t('affiliate.acceptAffiliateDesc')}
                </span>
              </label>
            </div>

            {/* Contract Terms - Tariefwijzigingen */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📋</span>
                {t('affiliate.contractTerms')}
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">{t('affiliate.guaranteed12Months')}</p>
                  <p className="text-gray-700">{t('affiliate.guaranteed12MonthsDesc')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">{t('affiliate.contractRenewal')}</p>
                  <p className="text-gray-700">{t('affiliate.contractRenewalDesc')}</p>
                </div>
                <p className="text-xs text-gray-600 mt-3 italic">
                  {t('affiliate.contractTermsDesc')}
                </p>
              </div>
            </div>

            {/* Belasting Informatie */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                Belasting Informatie
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Belangrijk:</strong> Als affiliate ben je zelf verantwoordelijk voor het correct afdragen van belasting 
                  over je affiliate inkomsten.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Affiliate commissies worden uitbetaald <strong>exclusief BTW</strong></li>
                  <li>Je bent zelf verantwoordelijk voor het afdragen van <strong>inkomstenbelasting</strong> over je affiliate inkomsten</li>
                  <li>Als je een bedrijf hebt, moet je mogelijk <strong>BTW</strong> afdragen over je commissies</li>
                  <li>HomeCheff geeft geen belastingadvies - raadpleeg een belastingadviseur voor jouw specifieke situatie</li>
                  <li>Alle uitbetalingen worden geregistreerd en kunnen worden gebruikt voor je belastingaangifte</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  Door te accepteren bevestig je dat je begrijpt dat je zelf verantwoordelijk bent voor het correct 
                  afdragen van alle belastingen over je affiliate inkomsten.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA - Simple signup */}
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Klaar om te beginnen?</h2>
          <p className="text-gray-600 mb-6">
            {userData 
              ? 'Klik op de knop hieronder om affiliate te worden met je bestaande account.'
              : 'Aanmelding duurt minder dan 30 seconden. Geen creditcard nodig, volledig gratis.'}
          </p>
          <button
            onClick={handleSignup}
            disabled={isSigningUp || !acceptPrivacyPolicy || !acceptTerms || !acceptAffiliateAgreement}
            className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSigningUp ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {t('affiliate.signingUp')}
              </span>
            ) : (
              t('affiliate.signupButton')
            )}
          </button>
          {(!acceptPrivacyPolicy || !acceptTerms || !acceptAffiliateAgreement) && (
            <p className="text-red-600 text-sm mt-3">
              Accepteer alle verplichte voorwaarden om door te gaan
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Geen verplichtingen</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Direct actief</span>
            </div>
          </div>
          <p className="text-gray-600 mt-6 text-sm">
            Al affiliate? <Link href="/affiliate/dashboard" className="text-emerald-600 hover:underline font-medium">Ga naar je dashboard</Link>
          </p>
          <div className="mt-6">
            <Link 
              href="/affiliate/passive-income-calculator" 
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Bereken je passieve inkomen potentieel →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

