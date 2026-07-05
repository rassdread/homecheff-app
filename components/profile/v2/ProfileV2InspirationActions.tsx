'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { sellerRolesToAllowedVerticals } from '@/lib/createFlowIntent';
import {
  profileSlugToCreateVertical,
  type OfferingProfileSlug,
} from '@/lib/create/offering-vertical';
import { ProfileV2FilterChips } from '@/components/profile/v2/ProfileV2Ui';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  ProfileV2InspiratieFilter,
  ProfileV2User,
} from '@/lib/profile/profile-v2/types';

const INSPIRATIE_FILTERS: ProfileV2InspiratieFilter[] = [
  'all',
  'chef',
  'garden',
  'designer',
];

function filterToVertical(filter: ProfileV2InspiratieFilter) {
  if (filter === 'chef' || filter === 'garden' || filter === 'designer') {
    return profileSlugToCreateVertical(filter as OfferingProfileSlug);
  }
  return undefined;
}

function inspiratieFilterToRole(filter: ProfileV2InspiratieFilter): string {
  if (filter === 'all') return 'overview';
  return filter;
}

export { inspiratieFilterToRole };

type Props = {
  user: ProfileV2User;
  filter: ProfileV2InspiratieFilter;
  onFilterChange: (f: ProfileV2InspiratieFilter) => void;
  /** Compact: alleen knop (bijv. in empty state). */
  variant?: 'full' | 'ctaOnly';
};

export function ProfileV2InspirationActions({
  user,
  filter,
  onFilterChange,
  variant = 'full',
}: Props) {
  const { t } = useTranslation();
  const createFlow = useCreateFlow();
  const allowedVerticals = sellerRolesToAllowedVerticals(user.sellerRoles ?? []);
  const hasRoles = allowedVerticals.length > 0;

  const openAddInspiratie = () => {
    const vertical = filterToVertical(filter);
    createFlow.openCreateFlowWithIntent({
      mode: 'inspiratie',
      ...(vertical ? { vertical } : {}),
      allowedVerticals,
    });
  };

  if (!hasRoles) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">{t('profileV2.inspiratie.noMakerTitle')}</p>
        <p className="mt-1 text-amber-900/90">{t('profileV2.inspiratie.noMakerDesc')}</p>
        <Link
          href="/onboarding/seller"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 touch-manipulation"
        >
          {t('profileV2.inspiratie.setupProfile')}
        </Link>
      </div>
    );
  }

  const ctaButton = (
    <button
      type="button"
      onClick={openAddInspiratie}
      className="hc-btn-primary inline-flex min-h-[44px] w-full items-center justify-center gap-2 touch-manipulation sm:w-auto"
    >
      <Plus className="h-4 w-4 shrink-0" aria-hidden />
      {t('profileV2.inspiratie.addCta')}
    </button>
  );

  if (variant === 'ctaOnly') {
    return ctaButton;
  }

  const visibleFilters = INSPIRATIE_FILTERS.filter(
    (f) =>
      f === 'all' ||
      (f === 'chef' && user.sellerRoles?.includes('chef')) ||
      (f === 'garden' && user.sellerRoles?.includes('garden')) ||
      (f === 'designer' && user.sellerRoles?.includes('designer')),
  );

  return (
    <div className="space-y-4">
      {ctaButton}
      {visibleFilters.length > 1 ? (
        <ProfileV2FilterChips
          options={visibleFilters}
          value={filter}
          onChange={onFilterChange}
          labelKey={(f) => t(`profileV2.inspiratie.filters.${f}`)}
        />
      ) : null}
    </div>
  );
}
