'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md w-full">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" aria-hidden />
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{t('errorPage.title')}</h2>
        <p className="text-gray-600 mb-6">{t('errorPage.description')}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="bg-gray-100 p-4 rounded-lg text-left text-sm text-red-800 overflow-x-auto mb-6">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            {t('errorPage.retry')}
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {t('errorPage.home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
