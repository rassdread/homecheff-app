'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SubAffiliateSignupClientProps {
  token?: string;
}

export default function SubAffiliateSignupClient({ token }: SubAffiliateSignupClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('affiliate.subAffiliateSignup.noToken'));
      setLoading(false);
      return;
    }

    // Validate token
    fetch(`/api/affiliate/validate-invite?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setValid(true);
        } else {
          setError(data.error || t('affiliate.subAffiliateSignup.invalidToken'));
        }
      })
      .catch(err => {
        setError(t('affiliate.subAffiliateSignup.error'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('affiliate.subAffiliateSignup.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('affiliate.subAffiliateSignup.errorTitle')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/affiliate" 
            className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t('affiliate.subAffiliateSignup.backToAffiliate')}
          </Link>
        </div>
      </div>
    );
  }

  if (valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('affiliate.subAffiliateSignup.title')}</h1>
            <p className="text-gray-600">{t('affiliate.subAffiliateSignup.description')}</p>
          </div>
          
          <div className="space-y-3">
            <Link 
              href={`/login?inviteToken=${token}`}
              className="block w-full px-6 py-3 bg-emerald-600 text-white text-center rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              {t('affiliate.subAffiliateSignup.login')}
            </Link>
            <Link 
              href={`/register?inviteToken=${token}`}
              className="block w-full px-6 py-3 bg-gray-200 text-gray-800 text-center rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t('affiliate.subAffiliateSignup.register')}
            </Link>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-6">
            {t('affiliate.subAffiliateSignup.noAccount')}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

