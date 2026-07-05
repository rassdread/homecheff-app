'use client';
import * as React from 'react';
import CompactChefForm from './CompactChefForm';
import CompactGardenForm from './CompactGardenForm';
import CompactDesignerForm from './CompactDesignerForm';
import MarketplaceOfferForm from './marketplace/MarketplaceOfferForm';

interface CategoryFormSelectorProps {
  category: 'CHEFF' | 'GARDEN' | 'DESIGNER';
  editMode?: boolean;
  existingProduct?: any;
  onSave?: (product: any) => void;
  onCancel?: () => void;
  initialPhoto?: string;
  platform?: 'dorpsplein' | 'inspiratie';
  /** Marketplace Foundation V2 — unified offer form for new listings */
  useMarketplaceV2?: boolean;
}

export default function CategoryFormSelector({
  category,
  editMode = false,
  existingProduct = null,
  onSave,
  onCancel,
  initialPhoto,
  platform = 'dorpsplein',
  useMarketplaceV2 = true,
}: CategoryFormSelectorProps) {

  if (platform === 'dorpsplein' && useMarketplaceV2 && !editMode) {
    return (
      <MarketplaceOfferForm
        editMode={false}
        existingProduct={existingProduct}
        onSave={onSave}
        onCancel={onCancel}
        initialPhoto={initialPhoto}
        initialLegacyCategory={category}
      />
    );
  }
  
  // Map category to correct form component (legacy + edit mode)
  const getFormComponent = () => {
    switch (category) {
      case 'CHEFF':
        return (
          <CompactChefForm
            editMode={editMode}
            existingProduct={existingProduct}
            onSave={onSave}
            onCancel={onCancel}
            initialPhoto={initialPhoto}
            platform={platform}
          />
        );
      case 'GARDEN':
        return (
          <CompactGardenForm
            editMode={editMode}
            existingProduct={existingProduct}
            onSave={onSave}
            onCancel={onCancel}
            initialPhoto={initialPhoto}
            platform={platform}
          />
        );
      case 'DESIGNER':
        return (
          <CompactDesignerForm
            editMode={editMode}
            existingProduct={existingProduct}
            onSave={onSave}
            onCancel={onCancel}
            initialPhoto={initialPhoto}
            platform={platform}
          />
        );
      default:
        // Fallback to Chef form
        return (
          <CompactChefForm
            editMode={editMode}
            existingProduct={existingProduct}
            onSave={onSave}
            onCancel={onCancel}
            initialPhoto={initialPhoto}
            platform={platform}
          />
        );
    }
  };

  return getFormComponent();
}































