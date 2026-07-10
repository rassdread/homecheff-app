import type { TaxonomyTone } from './taxonomy-types';

/** Compact badge styling per taxonomy tone — Phase 13M richer contrast. */
export const TAXONOMY_TONE_CLASSES: Record<TaxonomyTone, string> = {
  food: 'bg-orange-50 text-orange-900 border-orange-300/70',
  garden: 'bg-emerald-50 text-emerald-900 border-emerald-300/70',
  creative: 'bg-purple-50 text-purple-900 border-purple-300/70',
  artistic: 'bg-pink-50 text-pink-900 border-pink-300/70',
  service: 'bg-sky-50 text-sky-900 border-sky-300/70',
  knowledge: 'bg-amber-50 text-amber-900 border-amber-300/70',
  international: 'bg-indigo-50 text-indigo-900 border-indigo-300/70',
  blocked: 'bg-neutral-100 text-neutral-700 border-neutral-300/70',
};

export {
  TAXONOMY_TONE_ICON_CLASSES,
  resolveTaxonomyIconClass,
} from './marketplace-icon-colors';

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

/** Active/inactive chip shells for taxonomy pickers — icons inherit tone via TaxonomyLucideIcon. */
export function taxonomyToneChipClass(active: boolean, tone: TaxonomyTone): string {
  return active
    ? `border ${TAXONOMY_TONE_CLASSES[tone]}`
    : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300';
}
