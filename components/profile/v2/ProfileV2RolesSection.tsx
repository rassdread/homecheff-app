'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ProfileV2PanelHeader,
  ProfileV2SectionCard,
} from '@/components/profile/v2/ProfileV2Ui';
import {
  BUYER_ROLE_ACCENT,
  buyerRoleLabelKey,
  interestLabelKey,
  isEmailVerified,
  normalizeBuyerRoleKey,
  profileHasRoleContent,
  resolveSellerRoleProductCount,
  SELLER_ROLE_ACCENT,
  SELLER_ROLE_EMOJI,
  sellerRoleLabelKey,
} from '@/lib/profile/profile-v2/roles-display';
import type { ProfileV2Context, ProfileV2SellerRole } from '@/lib/profile/profile-v2/types';

function MetaDot() {
  return <span className="text-gray-300" aria-hidden>·</span>;
}

function RoleMetaLine({ parts }: { parts: string[] }) {
  const filtered = parts.filter(Boolean);
  if (filtered.length === 0) return null;
  return (
    <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-gray-600">
      {filtered.map((part, i) => (
        <span key={`${part}-${i}`} className="inline-flex min-w-0 items-center gap-1.5">
          {i > 0 ? <MetaDot /> : null}
          <span className="truncate">{part}</span>
        </span>
      ))}
    </p>
  );
}

function SellerRoleCard({
  role,
  label,
  metaParts,
  compact,
}: {
  role: ProfileV2SellerRole;
  label: string;
  metaParts: string[];
  compact?: boolean;
}) {
  const accent = SELLER_ROLE_ACCENT[role];
  return (
    <article
      className={cn(
        'min-w-0 shrink-0 rounded-xl border px-3.5 py-3 shadow-sm',
        accent.border,
        accent.bg,
        compact ? 'w-auto snap-start sm:min-w-[9.5rem]' : 'w-full',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-base leading-none" aria-hidden>
          {SELLER_ROLE_EMOJI[role]}
        </span>
        <span className={cn('truncate text-sm font-semibold', accent.text)}>{label}</span>
      </div>
      <RoleMetaLine parts={metaParts} />
    </article>
  );
}

function BuyerRoleCard({
  label,
  metaParts,
  accentKey,
  compact,
}: {
  label: string;
  metaParts: string[];
  accentKey: keyof typeof BUYER_ROLE_ACCENT | null;
  compact?: boolean;
}) {
  const accent = accentKey ? BUYER_ROLE_ACCENT[accentKey] : null;
  return (
    <article
      className={cn(
        'min-w-0 shrink-0 rounded-xl border px-3.5 py-3 shadow-sm',
        accent?.border ?? 'border-gray-200/80',
        accent?.bg ?? 'bg-gray-50/80',
        compact ? 'w-auto snap-start sm:min-w-[9.5rem]' : 'w-full',
      )}
    >
      <span className={cn('block truncate text-sm font-semibold', accent?.text ?? 'text-gray-900')}>
        {label}
      </span>
      <RoleMetaLine parts={metaParts} />
    </article>
  );
}

export default function ProfileV2RolesSection({ ctx }: { ctx: ProfileV2Context }) {
  const { t } = useTranslation();
  const { viewerIsOwner, user, stats } = ctx;

  if (!profileHasRoleContent(user, viewerIsOwner)) return null;

  const buyerRoles = user.buyerRoles ?? [];
  const sellerRoles = user.sellerRoles ?? [];
  const interests = user.interests ?? [];
  const emailVerified = viewerIsOwner && isEmailVerified(user);
  const purchaseCount =
    viewerIsOwner && stats && typeof stats.orders === 'number' ? stats.orders : null;

  const formatProductCount = (count: number) =>
    count === 1
      ? t('profileV2.roles.productCount', { count })
      : t('profileV2.roles.productsCount', { count });

  const formatPurchaseCount = (count: number) =>
    count === 1
      ? t('profileV2.roles.purchaseCount', { count })
      : t('profileV2.roles.purchasesCount', { count });

  const buyerMetaBase: string[] = viewerIsOwner
    ? [
        t('profileV2.roles.active'),
        ...(emailVerified ? [t('profileV2.roles.emailVerified')] : []),
        ...(purchaseCount !== null ? [formatPurchaseCount(purchaseCount)] : []),
      ]
    : [];

  const sellerMetaFor = (role: ProfileV2SellerRole): string[] => {
    if (!viewerIsOwner) {
      const count = resolveSellerRoleProductCount(role, user, stats);
      return count !== null && count > 0 ? [formatProductCount(count)] : [];
    }
    const parts = [t('profileV2.roles.active')];
    const count = resolveSellerRoleProductCount(role, user, stats);
    if (count !== null) parts.push(formatProductCount(count));
    return parts;
  };

  const interestLabels = interests.map((interest) => {
    const key = interestLabelKey(interest);
    return key ? t(key) : interest;
  });

  const publicSellerVerified =
    !viewerIsOwner && Boolean(user.SellerProfile?.kvk?.trim());

  return (
    <ProfileV2SectionCard>
      <ProfileV2PanelHeader
        title={viewerIsOwner ? t('profileV2.roles.title') : t('profileV2.roles.titlePublic')}
        subtitle={
          viewerIsOwner ? t('profileV2.roles.subtitle') : t('profileV2.roles.subtitlePublic')
        }
      />

      <div className="mt-5 space-y-5">
        {buyerRoles.length > 0 ? (
          <div>
            {viewerIsOwner ? (
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('profileV2.roles.buyerSection')}
              </p>
            ) : null}
            <div
              className={cn(
                viewerIsOwner
                  ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
                  : '-mx-1 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:thin]',
              )}
            >
              {buyerRoles.map((role) => {
                const key = normalizeBuyerRoleKey(role);
                return (
                  <BuyerRoleCard
                    key={role}
                    label={t(buyerRoleLabelKey(role))}
                    metaParts={buyerMetaBase}
                    accentKey={key}
                    compact={!viewerIsOwner}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {sellerRoles.length > 0 ? (
          <div>
            {viewerIsOwner ? (
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('profileV2.roles.sellerSection')}
              </p>
            ) : null}
            <div
              className={cn(
                viewerIsOwner
                  ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
                  : '-mx-1 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:thin]',
              )}
            >
              {sellerRoles.map((role) => (
                <SellerRoleCard
                  key={role}
                  role={role}
                  label={t(sellerRoleLabelKey(role))}
                  metaParts={[
                    ...sellerMetaFor(role),
                    ...(!viewerIsOwner && publicSellerVerified
                      ? [t('profileV2.roles.verified')]
                      : []),
                  ]}
                  compact={!viewerIsOwner}
                />
              ))}
            </div>
          </div>
        ) : null}

        {viewerIsOwner && interestLabels.length > 0 ? (
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('profileV2.roles.interestsSection')}
            </p>
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible">
              {interestLabels.map((label) => (
                <span
                  key={label}
                  className="shrink-0 snap-start rounded-full border border-gray-200/80 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ProfileV2SectionCard>
  );
}
