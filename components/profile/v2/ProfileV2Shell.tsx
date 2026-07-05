'use client';

import type { ReactNode } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import ProfileV2Header from './ProfileV2Header';
import ProfileV2TabNav from './ProfileV2TabNav';
import {
  ProfileV2OwnerSidepanelProvider,
  ProfileV2OwnerSidepanelSurface,
  type ProfileV2OwnerSidepanelProps,
} from './ProfileV2OwnerSidepanel';
import type { ProfileV2Context } from '@/lib/profile/profile-v2/types';
import type { ProfileV2TabId } from '@/lib/profile/profile-v2/types';
import { cn } from '@/lib/utils';

type Props = {
  ctx: ProfileV2Context;
  activeTab: ProfileV2TabId;
  onTabChange: (tab: ProfileV2TabId) => void;
  children: ReactNode;
  topBar?: ReactNode;
  onEditProfile?: () => void;
  onPhotoChange?: (url: string | null) => void;
  onAvatarPreview?: (url: string) => void;
  avatarPreviewUrl?: string | null;
  ownerSidepanel?: ProfileV2OwnerSidepanelProps | null;
};

/** Bottom padding: clears fixed bottom nav + safe-area on all breakpoints. */
const PROFILE_V2_BOTTOM_PAD = 'hc-profile-v2-bottom-inset';

export default function ProfileV2Shell({
  ctx,
  activeTab,
  onTabChange,
  children,
  topBar,
  onEditProfile,
  onPhotoChange,
  onAvatarPreview,
  avatarPreviewUrl,
  ownerSidepanel,
}: Props) {
  const { t } = useTranslation();
  const showOwnerSidepanel = Boolean(ownerSidepanel && ctx.viewerIsOwner);

  return (
    <div className="min-h-screen w-full min-w-0 hc-dorpsplein-page overflow-x-hidden">
      <div className="mx-auto w-full min-w-0 px-3 py-4 sm:px-4 sm:py-6 md:px-6">
        {topBar}

        {/* 1–2. Hero + tabnav: full personal width — never beside sidepanel */}
        <div className="mx-auto w-full max-w-6xl min-w-0">
          <ProfileV2Header
            ctx={ctx}
            onEditProfile={onEditProfile}
            onPhotoChange={onPhotoChange}
            onAvatarPreview={onAvatarPreview}
            onViewAanbod={() => onTabChange('aanbod')}
            avatarPreviewUrl={avatarPreviewUrl}
          />
          <div className="mt-6 min-w-0">
            <ProfileV2TabNav activeTab={activeTab} onTabChange={onTabChange} />
          </div>
        </div>

        {/* 3. Tab content (+ owner aside on xl) — starts below hero + tabnav */}
        <div
          className={cn(
            'mx-auto mt-6 w-full min-w-0',
            showOwnerSidepanel ? 'max-w-[90rem]' : 'max-w-6xl',
          )}
        >
          {showOwnerSidepanel && ownerSidepanel ? (
            <ProfileV2OwnerSidepanelProvider {...ownerSidepanel}>
              <div
                className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:items-start xl:gap-6"
                role="presentation"
              >
                <main role="tabpanel" className={cn('min-w-0', PROFILE_V2_BOTTOM_PAD)}>
                  <ProfileV2OwnerSidepanelSurface surface="mobile-inline" />
                  {children}
                </main>
                <aside
                  className={cn(
                    'hidden xl:block hc-profile-v2-sidepanel-sticky',
                    PROFILE_V2_BOTTOM_PAD,
                  )}
                  aria-label={t('profileV2.sidepanel.assistantLabel')}
                >
                  <ProfileV2OwnerSidepanelSurface surface="desktop-sticky" />
                </aside>
              </div>
            </ProfileV2OwnerSidepanelProvider>
          ) : (
            <div role="tabpanel" className={cn('min-w-0', PROFILE_V2_BOTTOM_PAD)}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
