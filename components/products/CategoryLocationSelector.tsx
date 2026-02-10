'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { X } from 'lucide-react';

interface CategoryLocationSelectorProps {
  platform: 'dorpsplein' | 'inspiratie';
  userSellerRoles?: string[];
  onSelect: (categoryOrLocation: string) => void;
  onClose: () => void;
}

export default function CategoryLocationSelector({
  platform,
  userSellerRoles = [],
  onSelect,
  onClose
}: CategoryLocationSelectorProps) {
  const { t } = useTranslation();

  if (platform === 'dorpsplein') {
    // Dorpsplein: toon categorieën (CHEFF, GARDEN, DESIGNER) - gefilterd op basis van user roles
    const categories = [
      { id: 'CHEFF', label: '🍳 Chef', description: 'Gerechten en maaltijden', role: 'chef' },
      { id: 'GARDEN', label: '🌱 Garden', description: 'Tuinproducten en planten', role: 'garden' },
      { id: 'DESIGNER', label: '🎨 Designer', description: 'Designs en creaties', role: 'designer' },
    ];

    // Filter op basis van user roles
    const availableCategories = categories.filter(cat => 
      !cat.role || userSellerRoles.includes(cat.role)
    );

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">🏪 Product toevoegen</h2>
                <p className="text-sm text-gray-600 mt-1">Kies een categorie</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="p-6 space-y-3">
            {availableCategories.length > 0 ? (
              availableCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onSelect(category.id)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{category.label.split(' ')[0]}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 group-hover:text-emerald-700">
                        {category.label}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {category.description}
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-emerald-600">
                      →
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Je hebt nog geen rollen ingesteld</p>
                <p className="text-sm mt-2">Ga naar instellingen om rollen toe te voegen</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inspiratie: toon locaties (recepten, kweken, designs)
  const locations = [
    { id: 'recepten', label: '📝 Recepten', description: 'Deel je recepten en kooktips', role: 'chef' },
    { id: 'kweken', label: '🌱 Kweken', description: 'Deel je tuinprojecten', role: 'garden' },
    { id: 'designs', label: '🎨 Designs', description: 'Deel je creaties', role: 'designer' },
  ];

  // Filter op basis van user roles
  const availableLocations = locations.filter(loc => 
    !loc.role || userSellerRoles.includes(loc.role)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">✨ Inspiratie toevoegen</h2>
              <p className="text-sm text-gray-600 mt-1">Kies wat je wilt delen</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Locations */}
        <div className="p-6 space-y-3">
          {availableLocations.length > 0 ? (
            availableLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => onSelect(location.id)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{location.label.split(' ')[0]}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-emerald-700">
                      {location.label}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {location.description}
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-emerald-600">
                    →
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Je hebt nog geen rollen ingesteld</p>
              <p className="text-sm mt-2">Ga naar instellingen om rollen toe te voegen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

