import type { TaxonomyTone } from './taxonomy-types';

/** Compact badge styling per taxonomy tone */
export const TAXONOMY_TONE_CLASSES: Record<TaxonomyTone, string> = {
  food: 'bg-orange-50 text-orange-800 border-orange-200/80',
  garden: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  creative: 'bg-purple-50 text-purple-800 border-purple-200/80',
  artistic: 'bg-pink-50 text-pink-800 border-pink-200/80',
  service: 'bg-sky-50 text-sky-800 border-sky-200/80',
  knowledge: 'bg-amber-50 text-amber-800 border-amber-200/80',
  international: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
  blocked: 'bg-neutral-100 text-neutral-600 border-neutral-200/80',
};

export const TAXONOMY_BADGE_SIZE_CLASSES = {
  sm: {
    badge: 'px-1.5 py-0.5 text-[10px] gap-1 leading-tight',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2 py-0.5 text-xs gap-1 leading-tight',
    icon: 'h-3.5 w-3.5',
  },
} as const;

export type TaxonomyBadgeSize = keyof typeof TAXONOMY_BADGE_SIZE_CLASSES;
