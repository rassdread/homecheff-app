'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import SellerFinancialManagement from '@/components/seller/SellerFinancialManagement';
import AppBackBar from '@/components/navigation/AppBackBar';
import { useTranslation } from '@/hooks/useTranslation';

interface RevenueData {
  totalEarnings: number;
  pendingPayout: number;
  lastPayout: number;
  lastPayoutDate: string | null;
  platformFee: number;
  platformFeePercentage?: number;
  netEarnings: number;
  stripeConnected: boolean;
  stripeAccountId: string | null;
}

export default function SellerRevenuePageClient() {
  const { t, language } = useTranslation();
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const locale = language === 'en' ? 'en-GB' : 'nl-NL';

  useEffect(() => {
    loadRevenueData();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#uitbetaling-aanvragen') {
      const el = document.getElementById('uitbetaling-aanvragen');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading]);

  // Tab title follows selected language
  useEffect(() => {
    document.title = `${t('seller.revenuePageTitle')} | HomeCheff`;
  }, [language]);

  const loadRevenueData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/seller/earnings');
      if (response.ok) {
        const revenueData = await response.json();
        setData(revenueData);
      }
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
        <AppBackBar
          fallbackUrl="/verkoper/dashboard"
          label={t('seller.back')}
          title={t('seller.revenuePageTitle')}
          className="rounded-xl border border-gray-200/90 bg-white/95 px-1.5 shadow-sm"
        />
        <p className="pb-4 pt-1 text-sm text-gray-600">{t('seller.revenuePageDescription')}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Duidelijke CTA: uitbetaling naar bankrekening via Stripe */}
        <a
          href="#uitbetaling-aanvragen"
          className="block mb-6 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg flex-shrink-0">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">{t('seller.revenueCtaTitle')}</h2>
              <p className="text-gray-700 text-sm mt-1">
                {t('seller.revenueCtaDescription')}
              </p>
              <span className="inline-block mt-2 text-emerald-700 font-medium text-sm">{t('seller.revenueCtaLink')}</span>
            </div>
          </div>
        </a>
        <SellerFinancialManagement />
      </div>
    </div>
  );
}

