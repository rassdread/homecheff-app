'use client';
import * as React from 'react';
import { useMemo, useState } from 'react';
import CompactChefForm from './CompactChefForm';
import CompactGardenForm from './CompactGardenForm';
import CompactDesignerForm from './CompactDesignerForm';
import MarketplaceOfferForm from './marketplace/MarketplaceOfferForm';
import MarketplaceEntryFlow, {
  type MarketplaceEntryResult,
} from './marketplace/MarketplaceEntryFlow';
import type { MarketplaceCategory } from '@prisma/client';
import type { ListingIntentValue } from '@/lib/marketplace/listing-taxonomy';
import {
  entryPrefillIsComplete,
  type MarketplaceEntryPrefill,
} from '@/lib/marketplace/entry-prefill';

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
  /** V3 entry flow prefill from URL / intent */
  marketplaceEntryPrefill?: MarketplaceEntryPrefill;
  allowedMarketplaceCategories?: MarketplaceCategory[];
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
  marketplaceEntryPrefill,
  allowedMarketplaceCategories,
}: CategoryFormSelectorProps) {
  const prefillComplete = marketplaceEntryPrefill
    ? entryPrefillIsComplete(marketplaceEntryPrefill)
    : false;

  const [entryResult, setEntryResult] = useState<MarketplaceEntryResult | null>(
    () =>
      prefillComplete && marketplaceEntryPrefill
        ? {
            listingIntent: marketplaceEntryPrefill.listingIntent!,
            marketplaceCategory: marketplaceEntryPrefill.marketplaceCategory!,
            specializations: marketplaceEntryPrefill.specializations!,
          }
        : null,
  );

  if (platform === 'dorpsplein' && useMarketplaceV2) {
    if (!editMode && !entryResult) {
      return (
        <MarketplaceEntryFlow
          onComplete={setEntryResult}
          onCancel={onCancel}
          initialIntent={marketplaceEntryPrefill?.listingIntent}
          initialCategory={marketplaceEntryPrefill?.marketplaceCategory}
          initialSpecializations={marketplaceEntryPrefill?.specializations}
          allowedCategories={allowedMarketplaceCategories}
        />
      );
    }

    return (
      <MarketplaceOfferForm
        editMode={editMode}
        existingProduct={existingProduct}
        onSave={onSave}
        onCancel={onCancel}
        initialPhoto={initialPhoto}
        initialLegacyCategory={category}
        initialListingIntent={
          entryResult?.listingIntent ??
          (existingProduct?.listingIntent as ListingIntentValue | undefined)
        }
        initialMarketplaceCategory={
          entryResult?.marketplaceCategory ??
          (existingProduct?.marketplaceCategory as MarketplaceCategory | undefined)
        }
        initialSpecializations={
          entryResult?.specializations ??
          (Array.isArray(existingProduct?.specializations)
            ? existingProduct.specializations
            : [])
        }
        onRestartEntry={editMode ? undefined : () => setEntryResult(null)}
      />
    );
  }

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
