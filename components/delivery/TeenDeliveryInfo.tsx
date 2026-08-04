'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

/** Informational panel for local delivery providers (legacy filename retained). */
export default function TeenDeliveryInfo() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
      >
        <Info className="w-4 h-4" />
        Over lokale bezorgaanbieders
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Lokale bezorgaanbieders via HomeCheff
          </h3>
        </div>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900">Zelfstandige aanbieders</p>
            <p>
              Bezorging wordt uitgevoerd door een zelfstandige bezorgaanbieder.
              HomeCheff faciliteert het contact en de boeking.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Vanaf 18 jaar</p>
            <p>
              Commerciële bezorgdiensten via HomeCheff zijn beschikbaar vanaf 18
              jaar.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Beschikbaarheid</p>
            <p>
              {t('checkout.teenDeliveryEstimatedTime') ||
                'Afhankelijk van beschikbaarheid van aanbieders in de buurt.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
