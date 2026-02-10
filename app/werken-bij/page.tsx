'use client';

import Link from 'next/link';
import { Euro, Clock, MapPin, Truck, Package, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function WerkenBijPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);

  // Check if user is a sub-affiliate
  useEffect(() => {
    if (session?.user) {
      fetch('/api/profile/me')
        .then(res => res.json())
        .then(data => {
          if (data.user?.affiliate?.parentAffiliateId) {
            setIsSubAffiliate(true);
          }
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('werkenBij.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('werkenBij.subtitle')}
          </p>
        </div>

        {/* Grid met voordelen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Goede Verdiensten */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="bg-green-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Euro className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              {t('werkenBij.goodEarnings')}
            </h3>
            <p className="text-gray-600 text-sm text-center">
              {t('werkenBij.goodEarningsDesc')}
            </p>
          </div>

          {/* Flexibel Werken */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              {t('werkenBij.flexibleWork')}
            </h3>
            <p className="text-gray-600 text-sm text-center">
              {t('werkenBij.flexibleWorkDesc')}
            </p>
          </div>

          {/* In Je Buurt */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              {t('werkenBij.inYourNeighborhood')}
            </h3>
            <p className="text-gray-600 text-sm text-center">
              {t('werkenBij.inYourNeighborhoodDesc')}
            </p>
          </div>

          {/* Veilig en Betrouwbaar */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="bg-yellow-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              {t('werkenBij.safeReliable')}
            </h3>
            <p className="text-gray-600 text-sm text-center">
              {t('werkenBij.safeReliableDesc')}
            </p>
          </div>

          {/* Lokale Economie */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="bg-primary-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              {t('werkenBij.localEconomy')}
            </h3>
            <p className="text-gray-600 text-sm text-center">
              {t('werkenBij.localEconomyDesc')}
            </p>
          </div>

          {/* Vanaf 15 jaar */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow">
            <div className="bg-green-100 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              {t('werkenBij.from15Years')}
            </h3>
            <p className="text-gray-600 text-sm text-center">
              {t('werkenBij.from15YearsDesc')}
            </p>
          </div>
        </div>

        {/* Job Options - Clickable Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Bezorging Tile */}
          <button
            onClick={() => router.push('/delivery/signup')}
            className="bg-white rounded-2xl shadow-sm p-8 hover:shadow-lg transition-all duration-200 text-left group border-2 border-transparent hover:border-primary-200"
          >
            <div className="flex items-start gap-4">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                <Truck className="w-8 h-8 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t('werkenBij.delivery')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('werkenBij.deliveryDesc')}
                </p>
                <div className="text-primary-600 font-medium group-hover:text-primary-700">
                  {t('werkenBij.learnMore')}
                </div>
              </div>
            </div>
          </button>

          {/* Affiliate Tile - Only show if not a sub-affiliate */}
          {!isSubAffiliate && (
            <button
              onClick={() => router.push('/affiliate')}
              className="bg-white rounded-2xl shadow-sm p-8 hover:shadow-lg transition-all duration-200 text-left group border-2 border-transparent hover:border-orange-200 relative"
            >
              <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {t('werkenBij.temporary')}
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('werkenBij.affiliate')}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {t('werkenBij.affiliateDesc')}
                  </p>
                  <p className="text-xs text-orange-600 mb-4 font-medium">
                    {t('werkenBij.affiliateTemporary')}
                  </p>
                  <div className="text-orange-600 font-medium group-hover:text-orange-700">
                    {t('werkenBij.learnMore')}
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('werkenBij.readyToStart')}
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {t('werkenBij.readyToStartDesc')}
          </p>
          <p className="text-gray-500 text-sm mt-4">
            {t('werkenBij.legalInfo')}
          </p>
        </div>
      </div>
    </div>
  );
}





















