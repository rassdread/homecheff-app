'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Edit3, ShoppingCart, Trash2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { dishCategoryToVertical } from '@/lib/items/public-item-detail';
import type { InspiratieDetailItem } from '@/lib/items/load-inspiratie-detail';
import { buildProfileV2Href } from '@/lib/profileProductTab';

type Props = {
  item: InspiratieDetailItem;
  isOwner: boolean;
};

function persistSellPayload(storageKey: string, payload: unknown, query: string) {
  const json = JSON.stringify(payload);
  sessionStorage.setItem(storageKey, json);
  localStorage.setItem(storageKey, json);
  window.location.href = `/sell/new?${query}`;
}

export default function PublicItemOwnerActions({ item, isOwner }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!isOwner) return null;

  const vertical = dishCategoryToVertical(item.category);
  const profileEditHref = buildProfileV2Href({
    tab: 'inspiratie',
    inspiratieFilter: vertical ?? 'all',
    edit: item.id,
  });

  const handleEdit = () => {
    sessionStorage.setItem('inspiratieEditItemId', item.id);
    router.push(profileEditHref);
  };

  const handleSell = () => {
    if (item.category === 'GROWN') {
      persistSellPayload(
        'gardenToProductData',
        {
          title: item.title,
          description: item.description || '',
          photos: item.photos.map((p) => ({ url: p.url, isMain: p.isMain, idx: p.idx })),
          growthPhotos: item.growthPhotos.map((p) => ({
            url: p.url,
            phaseNumber: p.phaseNumber,
            description: p.description || '',
            idx: p.idx,
          })),
          plantType: item.plantType,
          plantDate: item.plantDate,
          harvestDate: item.harvestDate,
          growthDuration: item.growthDuration,
          sunlight: item.sunlight,
          waterNeeds: item.waterNeeds,
          location: item.location,
          soilType: item.soilType,
          plantDistance: item.plantDistance,
          difficulty: item.difficulty,
          tags: item.tags,
          notes: item.notes,
        },
        'fromGarden=true',
      );
      return;
    }

    if (item.category === 'DESIGNER') {
      persistSellPayload(
        'designToProductData',
        {
          title: item.title,
          description: item.description || '',
          photos: item.photos.map((p) => ({ url: p.url, isMain: p.isMain, idx: p.idx })),
          materials: item.materials,
          dimensions: item.dimensions,
          category: item.subcategory,
          subcategory: item.subcategory,
          tags: item.tags,
          notes: item.notes,
          instructions: item.instructions,
          stepPhotos: item.stepPhotos.map((p) => ({
            url: p.url,
            stepNumber: p.stepNumber,
            description: p.description || '',
            idx: p.idx,
          })),
        },
        'fromDesign=true',
      );
      return;
    }

    persistSellPayload(
      'recipeToProductData',
      {
        title: item.title,
        description: item.description || '',
        ingredients: item.ingredients,
        instructions: item.instructions,
        stepPhotos: item.stepPhotos.map((p) => ({
          url: p.url,
          stepNumber: p.stepNumber,
          description: p.description || '',
          idx: p.idx,
        })),
        photos: item.photos.map((p) => ({ url: p.url, isMain: p.isMain, idx: p.idx })),
        prepTime: item.prepTime,
        servings: item.servings,
        difficulty: item.difficulty,
        category: item.subcategory || item.category,
        tags: item.tags,
      },
      'fromRecipe=true',
    );
  };

  const handleDelete = async () => {
    if (!confirm(t('publicItemDetail.confirmDelete'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/profile/dishes/${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push(
          buildProfileV2Href({
            tab: 'inspiratie',
            inspiratieFilter: vertical ?? 'all',
          }),
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    const next = item.status === 'PUBLISHED' ? 'PRIVATE' : 'PUBLISHED';
    const res = await fetch(`/api/profile/dishes/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) router.refresh();
  };

  const isPublished = item.status === 'PUBLISHED';
  const canSell = !item.priceCents || item.priceCents === 0;

  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-primary-brand/15 bg-white p-3 shadow-sm sm:p-4">
      <p className="w-full text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t('publicItemDetail.ownerActions')}
      </p>
      <button
        type="button"
        onClick={handleEdit}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 touch-manipulation"
      >
        <Edit3 className="h-4 w-4" aria-hidden />
        {t('profileV2.forms.inspiratie.edit')}
      </button>
      {canSell ? (
        <button
          type="button"
          onClick={handleSell}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 touch-manipulation"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          {t('profileV2.forms.inspiratie.putForSale')}
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleTogglePublish}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 touch-manipulation"
      >
        {isPublished ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
        {isPublished
          ? t('publicItemDetail.unpublish')
          : t('publicItemDetail.publish')}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 touch-manipulation disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {deleting ? t('common.loading') : t('profileV2.forms.deleteAction')}
      </button>
      {!isPublished ? (
        <span className="w-full text-xs text-amber-700">{t('publicItemDetail.privateDraftHint')}</span>
      ) : null}
    </div>
  );
}
