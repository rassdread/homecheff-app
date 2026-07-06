'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppBackBar from '@/components/navigation/AppBackBar';
import { FeedMediaLightbox } from '@/components/feed/FeedMediaLightbox';
import ProfileV2Shell from '@/components/profile/v2/ProfileV2Shell';
import {
  ProfileV2AanbodPanel,
  ProfileV2CommunityPanel,
  ProfileV2InspiratiePanel,
  ProfileV2OverviewPanel,
  ProfileV2VertrouwenPanel,
} from '@/components/profile/v2/ProfileV2TabPanels';
import { useTranslation } from '@/hooks/useTranslation';
import {
  loadFeedSurfaceState,
  saveFeedSurfaceState,
} from '@/lib/feed/feedSurfaceState';
import {
  migrateLegacyProfileTab,
  legacyTabToInspiratieVertical,
  PROFILE_V2_SURFACE_ID,
} from '@/lib/profile/profile-v2/migration';
import {
  parseProfileVerticalParam,
  profileSlugToAanbodFilter,
  profileSlugToInspiratieFilter,
  sanitizeAanbodFilter,
} from '@/lib/create/offering-vertical';
import { normalizeProfileV2User } from '@/lib/profile/profile-v2/normalize-user';
import { isProfileV2TabId } from '@/lib/profile/profile-v2/tabs';
import type {
  ProfileV2AanbodFilter,
  ProfileV2Context,
  ProfileV2InspiratieFilter,
  ProfileV2Stats,
  ProfileV2TabId,
} from '@/lib/profile/profile-v2/types';
import type { PublicProfileHcpPayload } from '@/lib/profile/public-profile-hcp';
import { sortBadgesByDisplayPriority } from '@/lib/gamification/badge-priority';
import { hcpPublicLevelTitle } from '@/lib/gamification/hcp-public-label';
import { iconKeyToDisplayIcon } from '@/lib/gamification/author-badge-summaries';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';

type PersistedProfileV2 = {
  activeTab?: string;
  aanbodFilter?: ProfileV2AanbodFilter;
  inspiratieFilter?: ProfileV2InspiratieFilter;
};

export type ProfileV2ClientProps = {
  variant: 'private' | 'public';
  user: Record<string, unknown>;
  openNewProducts?: boolean;
  searchParams?: { [key: string]: string | string[] | undefined };
  isOwnProfile?: boolean;
  publicHcp?: PublicProfileHcpPayload | null;
  ecosystemChipKeys?: string[];
  publicContactChannels?: PublicContactChannel[];
};

function searchParamTruthy(
  value: string | string[] | undefined,
  key: string,
): boolean {
  if (value === 'true' || (Array.isArray(value) && value[0] === 'true')) return true;
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).get(key) === 'true';
  }
  return false;
}

function searchParamString(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function resolveInitialTab(
  searchParams?: ProfileV2ClientProps['searchParams'],
): ProfileV2TabId {
  if (searchParamString(searchParams?.edit)) {
    return 'inspiratie';
  }
  if (
    searchParamTruthy(searchParams?.addInspiratie, 'addInspiratie') ||
    searchParamTruthy(searchParams?.openForm, 'openForm')
  ) {
    return 'inspiratie';
  }
  const raw = searchParams?.tab;
  const tab = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;
  if (tab) {
    const migrated = migrateLegacyProfileTab(tab);
    if (isProfileV2TabId(migrated)) return migrated;
  }
  const persisted = loadFeedSurfaceState<PersistedProfileV2>(PROFILE_V2_SURFACE_ID);
  if (persisted?.activeTab && isProfileV2TabId(persisted.activeTab)) {
    return persisted.activeTab;
  }
  return 'overview';
}

function resolveInitialAanbodFilter(
  searchParams?: ProfileV2ClientProps['searchParams'],
): ProfileV2AanbodFilter {
  const slug = parseProfileVerticalParam(searchParams?.filter ?? searchParams?.vertical);
  if (slug) return sanitizeAanbodFilter(profileSlugToAanbodFilter(slug));
  const persisted = loadFeedSurfaceState<PersistedProfileV2>(PROFILE_V2_SURFACE_ID);
  return sanitizeAanbodFilter(persisted?.aanbodFilter);
}

function resolveInitialInspiratieFilter(
  searchParams?: ProfileV2ClientProps['searchParams'],
): ProfileV2InspiratieFilter {
  const editId = searchParamString(searchParams?.edit);
  if (editId) {
    const slug = parseProfileVerticalParam(searchParams?.vertical ?? searchParams?.filter);
    if (slug) return profileSlugToInspiratieFilter(slug);
    const legacyVertical = legacyTabToInspiratieVertical(
      searchParamString(searchParams?.tab),
    );
    if (legacyVertical) return legacyVertical;
  }
  const slug = parseProfileVerticalParam(searchParams?.vertical ?? searchParams?.filter);
  if (slug) return profileSlugToInspiratieFilter(slug);
  const persisted = loadFeedSurfaceState<PersistedProfileV2>(PROFILE_V2_SURFACE_ID);
  return persisted?.inspiratieFilter ?? 'all';
}

export default function ProfileV2Client({
  variant,
  user: rawUser,
  openNewProducts = false,
  searchParams,
  isOwnProfile = false,
  publicHcp = null,
  ecosystemChipKeys = [],
  publicContactChannels = [],
}: ProfileV2ClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const viewerIsOwner = variant === 'private';
  const user = useMemo(() => normalizeProfileV2User(rawUser), [rawUser]);

  const [activeTab, setActiveTab] = useState<ProfileV2TabId>(() => {
    if (openNewProducts) return 'aanbod';
    return resolveInitialTab(searchParams);
  });
  const [aanbodFilter, setAanbodFilter] = useState<ProfileV2AanbodFilter>(() =>
    resolveInitialAanbodFilter(searchParams),
  );
  const [inspiratieFilter, setInspiratieFilter] = useState<ProfileV2InspiratieFilter>(() =>
    resolveInitialInspiratieFilter(searchParams),
  );
  const [stats, setStats] = useState<ProfileV2Stats | null>(null);
  const [ownerHcp, setOwnerHcp] = useState<PublicProfileHcpPayload | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const endpoint =
        variant === 'private'
          ? '/api/profile/stats'
          : `/api/user/${encodeURIComponent(user.id)}/stats`;
      const res = await fetch(endpoint);
      if (!res.ok) return;
      const data = await res.json();
      if (variant === 'private') {
        setStats(data as ProfileV2Stats);
      } else {
        setStats({
          items: 0,
          dishes: 0,
          products: 0,
          followers: data.fansCount ?? 0,
          following: data.followingCount ?? 0,
          favorites: data.totalFavorites ?? 0,
          orders: 0,
          reviews: data.totalReviews ?? 0,
          props: data.totalProps ?? 0,
        });
      }
    } catch {
      /* ignore */
    }
  }, [variant, user.id]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (variant !== 'private') return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/gamification/me');
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          totalHcp?: number;
          level?: number;
          currentStreak?: number;
          badges?: Array<{ slug: string; name: string; iconKey: string }>;
        };
        if (cancelled) return;
        const level = data.level ?? 1;
        setOwnerHcp({
          totalHcp: data.totalHcp ?? 0,
          level,
          levelTitle: hcpPublicLevelTitle(level),
          currentStreak: data.currentStreak ?? 0,
          badges: sortBadgesByDisplayPriority(
            (data.badges ?? []).map((b) => ({
              key: b.slug,
              name: b.name,
              icon: iconKeyToDisplayIcon(b.iconKey),
            })),
          ),
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variant]);

  useEffect(() => {
    if (variant === 'public' && !isOwnProfile) {
      void fetch('/api/analytics/track-profile-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUserId: user.id }),
      }).catch(() => undefined);
    }
  }, [variant, isOwnProfile, user.id]);

  useEffect(() => {
    const tabRaw = searchParams?.tab;
    const tab = typeof tabRaw === 'string' ? tabRaw : Array.isArray(tabRaw) ? tabRaw[0] : undefined;
    const migratedTab = tab ? migrateLegacyProfileTab(tab) : null;

    if (
      searchParamTruthy(searchParams?.addInspiratie, 'addInspiratie') ||
      searchParamTruthy(searchParams?.openForm, 'openForm')
    ) {
      setActiveTab('inspiratie');
    } else if (searchParamString(searchParams?.edit)) {
      setActiveTab('inspiratie');
      const slug = parseProfileVerticalParam(
        searchParams?.vertical ?? searchParams?.filter,
      );
      const legacyVertical = legacyTabToInspiratieVertical(tab);
      if (slug) {
        setInspiratieFilter(profileSlugToInspiratieFilter(slug));
      } else if (legacyVertical) {
        setInspiratieFilter(legacyVertical);
      }
    } else if (migratedTab && isProfileV2TabId(migratedTab)) {
      setActiveTab(migratedTab);
    }

    const filterSlug = parseProfileVerticalParam(
      searchParams?.filter ?? searchParams?.vertical,
    );
    if (filterSlug) {
      const targetTab =
        searchParamTruthy(searchParams?.openForm, 'openForm') ||
        searchParamTruthy(searchParams?.addInspiratie, 'addInspiratie')
          ? 'inspiratie'
          : migratedTab;
      if (targetTab === 'aanbod') {
        setAanbodFilter(profileSlugToAanbodFilter(filterSlug));
      }
      if (targetTab === 'inspiratie') {
        setInspiratieFilter(profileSlugToInspiratieFilter(filterSlug));
      }
    }
  }, [
    searchParams?.addInspiratie,
    searchParams?.openForm,
    searchParams?.tab,
    searchParams?.filter,
    searchParams?.vertical,
    searchParams?.edit,
  ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveFeedSurfaceState(PROFILE_V2_SURFACE_ID, {
        activeTab,
        aanbodFilter,
        inspiratieFilter,
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [activeTab, aanbodFilter, inspiratieFilter]);

  const ctx: ProfileV2Context = useMemo(
    () => ({
      viewerIsOwner,
      isOwnPublicUrl: variant === 'public' && isOwnProfile,
      user,
      stats,
      hcp: variant === 'private' ? ownerHcp : publicHcp,
      publicContact: publicContactChannels,
      ecosystemChipKeys,
    }),
    [
      viewerIsOwner,
      variant,
      isOwnProfile,
      user,
      stats,
      publicHcp,
      ownerHcp,
      publicContactChannels,
      ecosystemChipKeys,
    ],
  );

  const panelProps = {
    ctx,
    onNavigateTab: setActiveTab,
    aanbodFilter,
    onAanbodFilterChange: setAanbodFilter,
    inspiratieFilter,
    onInspiratieFilterChange: setInspiratieFilter,
  };

  const topBar =
    variant === 'public' ? (
      <AppBackBar
        fallbackUrl="/?chip=sale#homecheff-feed"
        label={t('navigation.backToDorpsplein')}
        sticky
        className="-mx-1 mb-4 rounded-xl border border-emerald-100/80 bg-white/95 px-1 sm:px-2"
      />
    ) : null;

  const ownerSidepanel =
    viewerIsOwner
      ? {
          ctx,
          activeTab,
          aanbodFilter,
          inspiratieFilter,
          onTabChange: setActiveTab,
          onEditProfile: () => router.push('/settings'),
        }
      : null;

  return (
    <>
    <ProfileV2Shell
      ctx={ctx}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      topBar={topBar}
      onEditProfile={() => router.push('/settings')}
      onPhotoChange={(url) => {
        if (url) setAvatarPreviewUrl(url);
        void fetchStats();
      }}
      onAvatarPreview={setAvatarPreviewUrl}
      avatarPreviewUrl={avatarPreviewUrl}
      ownerSidepanel={ownerSidepanel}
    >
      {activeTab === 'overview' ? <ProfileV2OverviewPanel {...panelProps} onStatsUpdate={fetchStats} /> : null}
      {activeTab === 'aanbod' ? <ProfileV2AanbodPanel {...panelProps} onStatsUpdate={fetchStats} /> : null}
      {activeTab === 'inspiratie' ? <ProfileV2InspiratiePanel {...panelProps} onStatsUpdate={fetchStats} /> : null}
      {activeTab === 'community' ? <ProfileV2CommunityPanel {...panelProps} /> : null}
      {activeTab === 'vertrouwen' ? <ProfileV2VertrouwenPanel {...panelProps} /> : null}
    </ProfileV2Shell>
    <FeedMediaLightbox
      open={Boolean(avatarPreviewUrl)}
      onClose={() => setAvatarPreviewUrl(null)}
      payload={
        avatarPreviewUrl
          ? {
              kind: 'image',
              src: avatarPreviewUrl,
              alt: t('profilePage.profilePhotoAlt'),
            }
          : null
      }
      closeLabel={t('feed.closeMediaViewer')}
    />
    </>
  );
}
