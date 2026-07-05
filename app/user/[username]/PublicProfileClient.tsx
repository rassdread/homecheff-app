'use client';

import ProfileV2Client from '@/components/profile/v2/ProfileV2Client';
import type { PublicProfileHcpPayload } from '@/lib/profile/public-profile-hcp';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';

export type { PublicProfileHcpPayload };

interface PublicProfileClientProps {
  user: Record<string, unknown>;
  openNewProducts: boolean;
  isOwnProfile?: boolean;
  publicHcp?: PublicProfileHcpPayload | null;
  ecosystemChipKeys?: string[];
  publicContactChannels?: PublicContactChannel[];
}

export default function PublicProfileClient({
  user,
  openNewProducts,
  isOwnProfile = false,
  publicHcp = null,
  ecosystemChipKeys = [],
  publicContactChannels = [{ id: 'chat', href: '' }],
}: PublicProfileClientProps) {
  return (
    <ProfileV2Client
      variant="public"
      user={user}
      openNewProducts={openNewProducts}
      isOwnProfile={isOwnProfile}
      publicHcp={publicHcp}
      ecosystemChipKeys={ecosystemChipKeys}
      publicContactChannels={publicContactChannels}
    />
  );
}
