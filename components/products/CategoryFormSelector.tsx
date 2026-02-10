'use client';
import * as React from 'react';
import CompactChefForm from './CompactChefForm';
import CompactGardenForm from './CompactGardenForm';
import CompactDesignerForm from './CompactDesignerForm';

interface CategoryFormSelectorProps {
  category: 'CHEFF' | 'GARDEN' | 'DESIGNER';
  editMode?: boolean;
  existingProduct?: any;
  onSave?: (product: any) => void;
  onCancel?: () => void;
  initialPhoto?: string;
  platform?: 'dorpsplein' | 'inspiratie';
}

export default function CategoryFormSelector({
  category,
  editMode = false,
  existingProduct = null,
  onSave,
  onCancel,
  initialPhoto,
  platform = 'dorpsplein'
}: CategoryFormSelectorProps) {
  
  // Map category to correct form component
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































