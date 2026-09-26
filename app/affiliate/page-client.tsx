'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import AffiliateGrowthLanding from '@/components/affiliate/AffiliateGrowthLanding';
import { buildVerifyEmailPath } from '@/lib/affiliate/signup-flow';

export default function AffiliatePageClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);
  const [isMainAffiliate, setIsMainAffiliate] = useState(false);
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
    if (!session?.user) return;

    fetch('/api/profile/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) return;

        const hasPrivacy = data.user.privacyPolicyAccepted || false;
        const hasTerms = data.user.termsAccepted || false;

        if (data.user.affiliate?.parentAffiliateId) {
          setIsSubAffiliate(true);
          router.push('/affiliate/dashboard');
          return;
        }

        if (data.user.affiliate?.id && !data.user.affiliate?.parentAffiliateId) {
          setIsMainAffiliate(true);
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
      })
      .catch((err) => console.error('Error fetching user data:', err));
  }, [session, router]);

  const handleSignup = async () => {
    if (!acceptPrivacyPolicy) {
      setSignupError(t('affiliate.mustAcceptPrivacy'));
      return;
    }
    if (!acceptTerms) {
      setSignupError(t('affiliate.mustAcceptTerms'));
      return;
    }
    if (!acceptAffiliateAgreement) {
      setSignupError(t('affiliate.mustAcceptAffiliate'));
      return;
    }

    setSignupError(null);
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

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const email = session?.user?.email || '';
        if (data?.needsEmailVerification && email) {
          router.push(buildVerifyEmailPath(email, '/affiliate/dashboard'));
          return;
        }
        router.push('/affiliate/dashboard?welcome=true');
        router.refresh();
      } else {
        setSignupError(data?.error || t('affiliate.signupError'));
        setIsSigningUp(false);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setSignupError(t('affiliate.signupError'));
      setIsSigningUp(false);
    }
  };

  if (isSubAffiliate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="mx-auto max-w-md px-4 text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">
            {t('affiliate.subAffiliateNotAllowed') || 'Made affiliates cannot become main affiliate'}
          </h1>
          <p className="mb-6 text-slate-600">
            {t('affiliate.subAffiliateNotAllowedDesc') ||
              'As a made affiliate you cannot become a main affiliate. You can use your affiliate dashboard.'}
          </p>
          <Link
            href="/affiliate/dashboard"
            className="inline-block rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            {t('affiliate.goToDashboard') || 'Go to dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="affiliate-signup" className="mx-auto mt-8 max-w-3xl scroll-mt-24">
      <AffiliateGrowthLanding
        mode="signup"
        session={session}
        isMainAffiliate={isMainAffiliate}
        userData={userData}
        acceptPrivacyPolicy={acceptPrivacyPolicy}
        setAcceptPrivacyPolicy={setAcceptPrivacyPolicy}
        acceptTerms={acceptTerms}
        setAcceptTerms={setAcceptTerms}
        acceptAffiliateAgreement={acceptAffiliateAgreement}
        setAcceptAffiliateAgreement={setAcceptAffiliateAgreement}
        handleSignup={handleSignup}
        isSigningUp={isSigningUp}
        signupError={signupError}
      />
    </div>
  );
}
