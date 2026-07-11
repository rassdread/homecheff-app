'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function FoodCategoryContextBlock({
  variant,
}: {
  variant: 0 | 1 | 2;
}) {
  const { t } = useTranslation();
  const ns = `foodCategoryContextV${variant}`;

  return (
    <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-gray-700">
      {t(`${ns}.body`)}
      <Link
        href="/wat-is-homecheff"
        className="font-medium text-emerald-800 underline-offset-2 hover:underline"
      >
        {t('foodCategoryContextShared.linkPlatform')}
      </Link>
      {' · '}
      <Link
        href="/hoe-homecheff-werkt"
        className="font-medium text-emerald-800 underline-offset-2 hover:underline"
      >
        {t('foodCategoryContextShared.linkEcosystem')}
      </Link>
    </p>
  );
}
