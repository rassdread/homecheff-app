import type { ProfileV2AanbodFilter, ProfileV2InspiratieFilter } from '@/lib/profile/profile-v2/types';
import {
  dbCategoryToFormCategory,
  type OfferingDbCategory,
  type OfferingFormCategory,
  profileSlugToAanbodFilter,
  profileSlugToDbCategory,
} from '@/lib/create/offering-vertical';

/**
 * Profiel-tab na productflow — Profile V2 gebruikt tab=aanbod + optioneel filter.
 */
export type ProductCategoryTab = OfferingFormCategory;

export function getProfileTabAfterProductFlow(
  _category: ProductCategoryTab,
): string {
  return 'aanbod';
}

export function categoryToAanbodFilter(
  category: ProductCategoryTab,
): ProfileV2AanbodFilter {
  if (category === 'CHEFF') return 'chef';
  if (category === 'GARDEN') return 'garden';
  return 'designer';
}

export function dbCategoryToAanbodFilter(
  category: OfferingDbCategory | string | null | undefined,
): ProfileV2AanbodFilter {
  const form = dbCategoryToFormCategory(category);
  if (!form) return 'all';
  return categoryToAanbodFilter(form);
}

type ProfileHrefOpts = {
  /** Toon succes na nieuw item (?added=1) */
  added?: boolean;
  /** Open edit na opslaan (niet gebruikt op profiel) */
  openForm?: boolean;
  /** Open inspiratie manager edit form for dish id */
  edit?: string;
};

export function buildProfileV2Href(opts: {
  tab: 'aanbod' | 'inspiratie' | 'overview' | 'community' | 'vertrouwen';
  aanbodFilter?: ProfileV2AanbodFilter;
  inspiratieFilter?: ProfileV2InspiratieFilter;
  added?: boolean;
  openForm?: boolean;
  vertical?: string;
  edit?: string;
}): string {
  const params = new URLSearchParams();
  params.set('tab', opts.tab);
  if (opts.tab === 'aanbod' && opts.aanbodFilter && opts.aanbodFilter !== 'all') {
    params.set('filter', opts.aanbodFilter);
  }
  if (opts.tab === 'inspiratie' && opts.inspiratieFilter && opts.inspiratieFilter !== 'all') {
    params.set('vertical', opts.inspiratieFilter);
  }
  if (opts.vertical && opts.tab === 'inspiratie') {
    params.set('vertical', opts.vertical);
  }
  if (opts.added) params.set('added', '1');
  if (opts.openForm) params.set('openForm', 'true');
  if (opts.edit) params.set('edit', opts.edit);
  return `/profile?${params.toString()}`;
}

export function getProfileHrefAfterProductSave(
  category: ProductCategoryTab,
  opts?: ProfileHrefOpts,
): string {
  return buildProfileV2Href({
    tab: 'aanbod',
    aanbodFilter: categoryToAanbodFilter(category),
    added: opts?.added,
  });
}

export function getProfileHrefAfterProductEdit(
  category: ProductCategoryTab | OfferingDbCategory | string | null | undefined,
): string {
  const form = dbCategoryToFormCategory(
    typeof category === 'string' ? category : category ?? null,
  );
  return buildProfileV2Href({
    tab: 'aanbod',
    aanbodFilter: form ? categoryToAanbodFilter(form) : 'all',
  });
}

export { profileSlugToDbCategory, profileSlugToAanbodFilter };
