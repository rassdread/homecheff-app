'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
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
import { Button } from '@/components/ui/Button';

interface RevenueData {
  totalEarnings: number;
  pendingPayout: number;
  lastPayout: number;
  lastPayoutDate: string | null;
  platformFee: number;
  netEarnings: number;
  stripeConnected: boolean;
  stripeAccountId: string | null;
}

export default function SellerRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nog niet uitbetaald';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Omzet & Uitbetalingen</h1>
              <p className="text-gray-600">Overzicht van je verdiensten en betalingen</p>
            </div>
            <Link href="/verkoper/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {data && (
          <>
            {/* Stripe Connection Status */}
            {!data.stripeConnected ? (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-500 rounded-full">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Koppel je bankrekening</h3>
                    <p className="text-gray-700 mb-4">
                      Om uitbetalingen te ontvangen moet je eerst je Stripe account koppelen
                    </p>
                    <Link href="/seller/stripe/onboard">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Stripe Koppelen
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500 rounded-full">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">✅ Stripe Verbonden</h3>
                    <p className="text-gray-700">
                      Je ontvangt automatisch uitbetalingen naar je gekoppelde bankrekening
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Totale Verdiensten</h3>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalEarnings)}</p>
                <p className="text-sm text-gray-500 mt-2">Bruto omzet (voor platformkosten)</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Platform Kosten (12%)</h3>
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.platformFee)}</p>
                <p className="text-sm text-gray-500 mt-2">HomeCheff servicekosten</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Netto Verdiensten</h3>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(data.netEarnings)}</p>
                <p className="text-sm text-gray-500 mt-2">Jouw uitbetaling (88%)</p>
              </div>
            </div>

            {/* Payout Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Wachtend op Uitbetaling</h3>
                    <p className="text-sm text-gray-600">Wordt binnenkort overgemaakt</p>
                  </div>
                </div>
                <p className="text-4xl font-bold text-blue-600 mb-4">{formatCurrency(data.pendingPayout)}</p>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Uitbetalingen worden automatisch gedaan binnen 2-5 werkdagen na voltooiing van de bestelling
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Laatste Uitbetaling</h3>
                    <p className="text-sm text-gray-600">{formatDate(data.lastPayoutDate)}</p>
                  </div>
                </div>
                <p className="text-4xl font-bold text-green-600 mb-4">{formatCurrency(data.lastPayout)}</p>
                {data.stripeConnected && (
                  <Link href="/seller/stripe/refresh">
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Bekijk in Stripe
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">💰 Kostenoverzicht</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Bruto Omzet</p>
                    <p className="text-sm text-gray-600">Totale verkoopwaarde</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(data.totalEarnings)}</p>
                </div>

                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Platform Kosten</p>
                    <p className="text-sm text-gray-600">12% HomeCheff servicekosten</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">-{formatCurrency(data.platformFee)}</p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Netto Uitbetaling</p>
                    <p className="text-sm text-gray-600">Jouw deel (88%)</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.netEarnings)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

