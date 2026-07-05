'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { sellerRolesToAllowedVerticals } from '@/lib/createFlowIntent';
import {
  profileSlugToCreateVertical,
  type OfferingProfileSlug,
} from '@/lib/create/offering-vertical';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  ProfileV2AanbodFilter,
  ProfileV2User,
} from '@/lib/profile/profile-v2/types';

function aanbodFilterToVertical(filter: ProfileV2AanbodFilter): ReturnType<typeof profileSlugToCreateVertical> | undefined {
  if (filter === 'chef' || filter === 'garden' || filter === 'designer') {
    return profileSlugToCreateVertical(filter as OfferingProfileSlug);
  }
  return undefined;
}

type Props = {
  user: ProfileV2User;
  filter: ProfileV2AanbodFilter;
  variant?: 'full' | 'ctaOnly';
};

export function ProfileV2AanbodActions({
  user,
  filter,
  variant = 'full',
}: Props) {
  const { t } = useTranslation();
  const createFlow = useCreateFlow();
  const allowedVerticals = sellerRolesToAllowedVerticals(user.sellerRoles ?? []);
  const hasRoles = allowedVerticals.length > 0;

  const openAddAanbod = () => {
    const vertical = aanbodFilterToVertical(filter);
    createFlow.openCreateFlowWithIntent({
      mode: 'dorpsplein',
      ...(vertical ? { vertical } : {}),
      allowedVerticals,
    });
  };

  if (!hasRoles) {
    if (variant === 'ctaOnly') return null;
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">{t('profileV2.aanbod.noMakerTitle')}</p>
        <p className="mt-1 text-amber-900/90">{t('profileV2.aanbod.noMakerDesc')}</p>
        <Link
          href="/onboarding/seller"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 touch-manipulation"
        >
          {t('profileV2.aanbod.setupProfile')}
        </Link>
      </div>
    );
  }

  const ctaButton = (
    <button
      type="button"
      onClick={openAddAanbod}
      className="hc-btn-primary inline-flex min-h-[44px] w-full items-center justify-center gap-2 touch-manipulation sm:w-auto"
    >
      <Plus className="h-4 w-4 shrink-0" aria-hidden />
      {t('profileV2.aanbod.addCta')}
    </button>
  );

  if (variant === 'ctaOnly') {
    return ctaButton;
  }

  return <div>{ctaButton}</div>;
}
