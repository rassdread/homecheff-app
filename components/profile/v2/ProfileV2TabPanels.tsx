'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowRight,
  Heart,
  ImageIcon,
  Shield,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';
import StripeConnectSetup from '@/components/profile/StripeConnectSetup';
import { ProfileV2TrustPhotoSections } from '@/components/profile/v2/ProfileV2TrustSections';
import ProfileV2RolesSection from '@/components/profile/v2/ProfileV2RolesSection';
import {
  ProfileV2EmptyState,
  ProfileV2FilterChips,
  ProfileV2PanelHeader,
  ProfileV2PreviewCard,
  ProfileV2SectionCard,
  ProfileV2SocialProofStrip,
} from '@/components/profile/v2/ProfileV2Ui';
import {
  ProfileV2InspirationActions,
  inspiratieFilterToRole,
} from '@/components/profile/v2/ProfileV2InspirationActions';
import { ProfileV2AanbodActions } from '@/components/profile/v2/ProfileV2AanbodActions';
import { ExchangeSuggestionsMobileModule, ExchangeSuggestionsProfileModule } from '@/components/marketplace/exchange-suggestions';
import ProfileTrustSummaryLoader from '@/components/profile/ProfileTrustSummaryLoader';
import { useTranslation } from '@/hooks/useTranslation';
import { PROFILE_V2_LIVE_AANBOD_FILTERS } from '@/lib/create/offering-vertical';
import type {
  ProfileV2AanbodFilter,
  ProfileV2Context,
  ProfileV2InspiratieFilter,
  ProfileV2TabId,
} from '@/lib/profile/profile-v2/types';

const MyDishesManager = dynamic(() => import('@/components/profile/MyDishesManager'), {
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />,
  ssr: false,
});

const ItemsWithReviews = dynamic(() => import('@/components/profile/ItemsWithReviews'), {
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />,
  ssr: false,
});

const FansAndFollowsList = dynamic(() => import('@/components/FansAndFollowsList'), {
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />,
  ssr: false,
});

const CreatorAudiencePanel = dynamic(() => import('@/components/profile/CreatorAudiencePanel'), {
  loading: () => null,
  ssr: false,
});

const AANBOD_FILTERS: ProfileV2AanbodFilter[] = [...PROFILE_V2_LIVE_AANBOD_FILTERS];

type PanelProps = {
  ctx: ProfileV2Context;
  onNavigateTab: (tab: ProfileV2TabId) => void;
  aanbodFilter?: ProfileV2AanbodFilter;
  onAanbodFilterChange?: (f: ProfileV2AanbodFilter) => void;
  inspiratieFilter?: ProfileV2InspiratieFilter;
  onInspiratieFilterChange?: (f: ProfileV2InspiratieFilter) => void;
  onStatsUpdate?: () => void;
};

function aanbodFilterToRole(filter: ProfileV2AanbodFilter): string {
  if (filter === 'chef') return 'chef';
  if (filter === 'garden') return 'garden';
  if (filter === 'designer') return 'designer';
  return 'generic';
}

const PREVIEW_CARDS = [
  {
    tab: 'aanbod' as const,
    titleKey: 'profileV2.overview.previewAanbod',
    descKey: 'profileV2.overview.previewAanbodDesc',
    icon: ShoppingBag,
  },
  {
    tab: 'inspiratie' as const,
    titleKey: 'profileV2.overview.previewInspiratie',
    descKey: 'profileV2.overview.previewInspiratieDesc',
    icon: ImageIcon,
  },
  {
    tab: 'community' as const,
    titleKey: 'profileV2.overview.previewCommunity',
    descKey: 'profileV2.overview.previewCommunityDesc',
    icon: Users,
  },
  {
    tab: 'vertrouwen' as const,
    titleKey: 'profileV2.overview.previewTrust',
    descKey: 'profileV2.overview.previewTrustDesc',
    icon: Shield,
  },
] as const;

export function ProfileV2OverviewPanel({ ctx, onNavigateTab }: PanelProps) {
  const { t } = useTranslation();
  const { viewerIsOwner, user, stats, hcp } = ctx;
  const hasBio = Boolean(user.bio?.trim());
  const hasQuote = Boolean(user.quote?.trim());

  return (
    <div className="space-y-8">
      {!viewerIsOwner && (hasQuote || hasBio) ? (
        <p className="text-center text-sm leading-relaxed text-gray-600 xl:text-left">
          {t('profileV2.overview.visitorIntro')}
        </p>
      ) : null}

      <ProfileV2SectionCard>
        <ProfileV2PanelHeader
          title={t('profileV2.overview.aboutTitle')}
          subtitle={t('profileV2.overview.aboutSubtitle')}
        />
        <div className="mt-4">
          {hasBio ? (
            <p className="text-sm leading-relaxed text-gray-700 sm:text-[15px]">{user.bio!.trim()}</p>
          ) : (
            <ProfileV2EmptyState
              title={t('profileV2.empty.aboutTitle')}
              description={
                viewerIsOwner
                  ? t('profileV2.empty.aboutOwner')
                  : t('profileV2.empty.aboutPublic')
              }
              actionLabel={viewerIsOwner ? t('profileV2.actions.editProfile') : undefined}
              actionHref={viewerIsOwner ? '/settings' : undefined}
              icon={<Heart className="h-8 w-8" aria-hidden />}
            />
          )}
        </div>
      </ProfileV2SectionCard>

      <ProfileV2RolesSection ctx={ctx} />

      {viewerIsOwner ? (
        <>
          <div className="lg:hidden">
            <ExchangeSuggestionsMobileModule context="profile" />
          </div>
          <div className="hidden lg:block">
            <ExchangeSuggestionsProfileModule />
          </div>
        </>
      ) : null}

      {!viewerIsOwner || stats ? (
        <ProfileV2SectionCard padding="compact">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('profileV2.overview.socialProof')}
          </p>
          <ProfileV2SocialProofStrip
            items={[
              ...(stats
                ? [
                    { label: t('profileV2.community.fansLabel'), value: stats.followers },
                    {
                      label: t('profileV2.overview.itemsLabel'),
                      value: stats.items || stats.products || 0,
                    },
                  ]
                : []),
              ...(hcp && hcp.totalHcp > 0
                ? [{ label: 'HCP', value: hcp.totalHcp, accent: true }]
                : []),
            ]}
          />
        </ProfileV2SectionCard>
      ) : null}

      <div>
        <ProfileV2PanelHeader
          title={t('profileV2.overview.exploreTitle')}
          subtitle={t('profileV2.overview.exploreSubtitle')}
          className="mb-4"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PREVIEW_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <ProfileV2PreviewCard
                key={card.tab}
                title={t(card.titleKey)}
                description={t(card.descKey)}
                icon={<Icon className="h-5 w-5" aria-hidden />}
                ctaLabel={t('profileV2.overview.viewSection')}
                onClick={() => onNavigateTab(card.tab)}
              />
            );
          })}
        </div>
      </div>

      {viewerIsOwner && ((user.sellerRoles?.length ?? 0) > 0 || user.stripeConnectAccountId) ? (
        <ProfileV2SectionCard className="border-dashed border-gray-200/90 bg-gray-50/30">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('profileV2.overview.ownerTools')}
          </p>
          <div className="space-y-6">
            {(user.sellerRoles?.length ?? 0) > 0 ? (
              <Suspense fallback={null}>
                <CreatorAudiencePanel />
              </Suspense>
            ) : null}
            <StripeConnectSetup
              stripeConnectAccountId={user.stripeConnectAccountId}
              stripeConnectOnboardingCompleted={user.stripeConnectOnboardingCompleted}
              onUpdate={() => undefined}
            />
          </div>
        </ProfileV2SectionCard>
      ) : null}
    </div>
  );
}

export function ProfileV2AanbodPanel({
  ctx,
  aanbodFilter = 'all',
  onAanbodFilterChange,
  onStatsUpdate,
}: PanelProps) {
  const { t } = useTranslation();
  const { viewerIsOwner, user } = ctx;
  const role = aanbodFilterToRole(aanbodFilter);

  return (
    <div className="space-y-6">
      <ProfileV2PanelHeader
        title={t('profileV2.aanbod.title')}
        subtitle={t('profileV2.aanbod.subtitle')}
      />

      {viewerIsOwner ? (
        <ProfileV2AanbodActions user={user} filter={aanbodFilter} />
      ) : (
        <p className="text-sm text-gray-600">{t('profileV2.aanbod.visitorHint')}</p>
      )}

      <ProfileV2FilterChips
        options={AANBOD_FILTERS}
        value={aanbodFilter}
        onChange={(f) => onAanbodFilterChange?.(f)}
        labelKey={(f) => t(`profileV2.aanbod.filters.${f}`)}
      />

      <div className="hc-profile-v2-content-well rounded-2xl border border-primary-brand/10 bg-white/80 p-1 sm:p-2">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-gray-100" />}>
          <MyDishesManager
            onStatsUpdate={onStatsUpdate}
            activeRole={role}
            role={role}
            isPublic={!viewerIsOwner}
            userId={viewerIsOwner ? undefined : user.id}
            contentSubTab="dorpsplein"
            userSellerRoles={user.sellerRoles ?? []}
            hideCreateActions={viewerIsOwner}
            ownerUser={user}
            aanbodFilter={aanbodFilter}
          />
        </Suspense>
      </div>
    </div>
  );
}

export function ProfileV2InspiratiePanel({
  ctx,
  onStatsUpdate,
  inspiratieFilter = 'all',
  onInspiratieFilterChange,
}: PanelProps) {
  const { t } = useTranslation();
  const { viewerIsOwner, user } = ctx;
  const role = inspiratieFilterToRole(inspiratieFilter);

  return (
    <div className="space-y-6">
      <ProfileV2PanelHeader
        title={t('profileV2.inspiratie.title')}
        subtitle={t('profileV2.inspiratie.subtitle')}
      />

      {viewerIsOwner ? (
        <ProfileV2InspirationActions
          user={user}
          filter={inspiratieFilter}
          onFilterChange={(f) => onInspiratieFilterChange?.(f)}
        />
      ) : (
        <p className="text-sm text-gray-600">{t('profileV2.inspiratie.visitorHint')}</p>
      )}

      <div className="hc-profile-v2-content-well rounded-2xl border border-primary-brand/10 bg-white/80 p-1 sm:p-2">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-gray-100" />}>
          <MyDishesManager
            onStatsUpdate={onStatsUpdate}
            activeRole={role}
            role={role}
            isPublic={!viewerIsOwner}
            userId={viewerIsOwner ? undefined : user.id}
            contentSubTab="inspiratie"
            userSellerRoles={user.sellerRoles ?? []}
            hideCreateActions={viewerIsOwner}
          />
        </Suspense>
      </div>
    </div>
  );
}

export function ProfileV2CommunityPanel({ ctx, onNavigateTab }: PanelProps) {
  const { t } = useTranslation();
  const { viewerIsOwner, user, isOwnPublicUrl, stats, hcp } = ctx;
  const showFans =
    viewerIsOwner || isOwnPublicUrl || user.showFansList !== false;

  return (
    <div className="space-y-8">
      <ProfileV2PanelHeader
        title={t('profileV2.community.title')}
        subtitle={t('profileV2.community.subtitle')}
      />

      <ProfileTrustSummaryLoader userId={user.id} />

      <ProfileV2SectionCard padding="compact">
        <ProfileV2SocialProofStrip
          items={[
            { label: t('profileV2.community.fansLabel'), value: stats?.followers ?? 0 },
            { label: t('profileV2.community.reviewsLabel'), value: stats?.reviews ?? '—' },
            ...(hcp && hcp.totalHcp > 0
              ? [{ label: 'HCP', value: hcp.totalHcp, accent: true }]
              : []),
          ]}
        />
      </ProfileV2SectionCard>

      <ProfileV2SectionCard>
        <h3 className="mb-4 text-lg font-bold text-gray-900">{t('profileV2.community.reviewsTitle')}</h3>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-gray-100" />}>
          <ItemsWithReviews userId={viewerIsOwner ? undefined : user.id} />
        </Suspense>
      </ProfileV2SectionCard>

      {user.DeliveryProfile ? (
        <ProfileV2SectionCard className="border-teal-100 bg-gradient-to-br from-teal-50/50 to-white">
          <h3 className="text-lg font-bold text-gray-900">{t('profilePage.tabs.ambassador')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {t('profileV2.community.deliveryStats', {
              count: user.DeliveryProfile.totalDeliveries,
            })}
          </p>
          {!viewerIsOwner ? (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-brand"
              onClick={() => onNavigateTab('vertrouwen')}
            >
              {t('profileV2.community.viewTrust')}
            </button>
          ) : null}
        </ProfileV2SectionCard>
      ) : null}

      {showFans ? (
        <ProfileV2SectionCard>
          <h3 className="mb-4 text-lg font-bold text-gray-900">{t('profileV2.community.fansTitle')}</h3>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-gray-100" />}>
            <FansAndFollowsList userId={viewerIsOwner ? undefined : user.id} />
          </Suspense>
        </ProfileV2SectionCard>
      ) : (
        <p className="text-sm text-gray-500">{t('profilePage.fanList.privateMessage')}</p>
      )}

      {viewerIsOwner ? (
        <Link
          href="/mijn-hcp"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {t('profileV2.community.hcpLink')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export function ProfileV2VertrouwenPanel({ ctx }: PanelProps) {
  const { t } = useTranslation();
  const { viewerIsOwner } = ctx;

  return (
    <div className="space-y-6">
      <ProfileV2PanelHeader
        title={t('profileV2.vertrouwen.title')}
        subtitle={t('profileV2.vertrouwen.subtitle')}
      />

      {!viewerIsOwner ? (
        <ProfileV2SectionCard className="border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white">
          <p className="text-sm leading-relaxed text-gray-700">{t('profileV2.vertrouwen.visitorIntro')}</p>
        </ProfileV2SectionCard>
      ) : null}

      <ProfileTrustSummaryLoader userId={ctx.user.id} />

      <ProfileV2TrustPhotoSections ctx={ctx} />
    </div>
  );
}
