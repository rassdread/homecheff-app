'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CategoryFormSelector from '@/components/products/CategoryFormSelector';

interface ContextAwareProductButtonProps {
  activeTab: string;
  className?: string;
}

export default function ContextAwareProductButton({ 
  activeTab, 
  className = "inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
}: ContextAwareProductButtonProps) {
  const [showForm, setShowForm] = useState(false);

  // Determine category based on active tab
  const getCategory = (): 'CHEFF' | 'GARDEN' | 'DESIGNER' | null => {
    if (activeTab === 'dishes-chef' || activeTab.includes('chef')) {
      return 'CHEFF';
    }
    if (activeTab === 'dishes-garden' || activeTab.includes('garden')) {
      return 'GARDEN';
    }
    if (activeTab === 'dishes-designer' || activeTab.includes('designer')) {
      return 'DESIGNER';
    }
    return null;
  };

  const category = getCategory();

  // If no specific category, fall back to old behavior
  if (!category) {
    return (
      <a 
        href="/sell/new"
        className={className}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Nieuw Product</span>
        <span className="sm:hidden">+</span>
      </a>
    );
  }

  const handleFormSave = (product: any) => {
    setShowForm(false);
    // Optionally refresh the page or update the product list
    window.location.reload();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Get category-specific button text and icon
  const getButtonConfig = () => {
    switch (category) {
      case 'CHEFF':
        return {
          icon: '🍳',
          text: 'Nieuw Gerecht',
          shortText: '🍳'
        };
      case 'GARDEN':
        return {
          icon: '🌱',
          text: 'Nieuw Product',
          shortText: '🌱'
        };
      case 'DESIGNER':
        return {
          icon: '🎨',
          text: 'Nieuwe Creatie',
          shortText: '🎨'
        };
      default:
        return {
          icon: '+',
          text: 'Nieuw Product',
          shortText: '+'
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className={className}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{buttonConfig.text}</span>
        <span className="sm:hidden">{buttonConfig.shortText}</span>
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {buttonConfig.text}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {category === 'CHEFF' && 'Voeg een nieuw gerecht toe aan je aanbod'}
                    {category === 'GARDEN' && 'Voeg een nieuw tuinproduct toe aan je aanbod'}
                    {category === 'DESIGNER' && 'Voeg een nieuwe creatie toe aan je aanbod'}
                  </p>
                </div>
                <button
                  onClick={handleFormCancel}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <CategoryFormSelector
                category={category}
                onSave={handleFormSave}
                onCancel={handleFormCancel}
                platform="dorpsplein"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}



