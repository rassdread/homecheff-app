'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'floating';
}

export default function BackButton({ 
  fallbackUrl = '/', 
  label = 'Terug',
  className = '',
  variant = 'default'
}: BackButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history in this session
    if (typeof window !== 'undefined' && window.history.length > 1) {
      // Use browser history but stay within app
      router.back();
    } else {
      // No history, go to fallback
      router.push(fallbackUrl);
    }
  };

  const variantStyles = {
    default: 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm',
    minimal: 'inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors',
    floating: 'fixed top-20 left-4 z-40 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-900/80 backdrop-blur-sm rounded-full hover:bg-gray-900 transition-all shadow-lg print:hidden'
  };

  return (
    <button
      onClick={handleBack}
      className={`${variantStyles[variant]} ${className}`}
      aria-label={t('common.goBack')}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}

