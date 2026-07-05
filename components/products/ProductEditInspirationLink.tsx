'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { buildProfileV2Href } from '@/lib/profileProductTab';
import type { InspirationCategory } from '@/lib/inspiratie/instruction-content';

type Props = {
  productId: string;
  category: InspirationCategory;
};

function verticalFilter(category: InspirationCategory): 'chef' | 'garden' | 'designer' {
  if (category === 'CHEFF') return 'chef';
  if (category === 'GROWN') return 'garden';
  return 'designer';
}

export default function ProductEditInspirationLink({ productId, category }: Props) {
  const { t } = useTranslation();

  const handleEditInspiration = () => {
    sessionStorage.setItem('inspiratieEditItemId', productId);
    window.location.href = buildProfileV2Href({
      tab: 'inspiratie',
      inspiratieFilter: verticalFilter(category),
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500">{t('productDetail.productFormScopeHint')}</p>
      <button
        type="button"
        onClick={handleEditInspiration}
        className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 touch-manipulation"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        {t('productDetail.editFullInspiration')}
      </button>
    </div>
  );
}
