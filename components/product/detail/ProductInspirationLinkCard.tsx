'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Leaf, Palette } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { InspirationCategory } from '@/lib/inspiratie/instruction-content';

export type ProductInspirationLink = {
  href: string;
  category: InspirationCategory;
};

type Props = {
  link: ProductInspirationLink;
};

const ACCENT: Record<InspirationCategory, string> = {
  CHEFF: 'border-orange-200 bg-gradient-to-br from-orange-50 to-white',
  GROWN: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
  DESIGNER: 'border-purple-200 bg-gradient-to-br from-purple-50 to-white',
};

const ICON: Record<InspirationCategory, typeof BookOpen> = {
  CHEFF: BookOpen,
  GROWN: Leaf,
  DESIGNER: Palette,
};

const CTA_KEY: Record<InspirationCategory, string> = {
  CHEFF: 'productDetail.viewFullRecipe',
  GROWN: 'productDetail.viewFullGrowingGuide',
  DESIGNER: 'productDetail.viewFullMakingGuide',
};

const DESC_KEY: Record<InspirationCategory, string> = {
  CHEFF: 'productDetail.viewFullRecipeDesc',
  GROWN: 'productDetail.viewFullGrowingGuideDesc',
  DESIGNER: 'productDetail.viewFullMakingGuideDesc',
};

export default function ProductInspirationLinkCard({ link }: Props) {
  const { t } = useTranslation();
  const Icon = ICON[link.category];

  return (
    <Link
      href={link.href}
      className={`group block rounded-2xl border p-4 shadow-sm transition hover:shadow-md touch-manipulation sm:p-5 ${ACCENT[link.category]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t('productDetail.moreBehindOffer')}
      </p>
      <div className="mt-2 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon className="h-5 w-5 text-gray-700" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-900 group-hover:underline">
            {t(CTA_KEY[link.category])}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {t(DESC_KEY[link.category])}
          </p>
        </div>
        <ArrowRight
          className="mt-1 h-5 w-5 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-700"
          aria-hidden
        />
      </div>
    </Link>
  );
}
