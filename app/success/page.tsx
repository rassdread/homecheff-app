'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [sessionData, setSessionData] = useState<{
    amount_total?: number;
    metadata?: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    if (sessionId) {
      fetchSessionData(sessionId);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchSessionData = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/checkout/session?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('paymentSuccess.processing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('paymentSuccess.successTitle')}
          </h1>

          <p className="text-lg text-gray-600 mb-8">{t('paymentSuccess.successSubtitle')}</p>

          {sessionData ? (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('paymentSuccess.detailsTitle')}
              </h3>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('paymentSuccess.totalAmount')}</span>
                <span className="font-bold text-green-600">
                  €{((sessionData.amount_total || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push('/')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {t('paymentSuccess.backToHome')}
            </Button>
            <Button onClick={() => router.push('/profile')} variant="outline" className="flex-1">
              {t('navbar.myProfile')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">…</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
