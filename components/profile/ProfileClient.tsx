'use client';

import ProfileV2Client from '@/components/profile/v2/ProfileV2Client';

interface ProfileClientProps {
  user: Record<string, unknown>;
  openNewProducts: boolean;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ProfileClient({
  user,
  openNewProducts,
  searchParams,
}: ProfileClientProps) {
  return (
    <ProfileV2Client
      variant="private"
      user={user}
      openNewProducts={openNewProducts}
      searchParams={searchParams}
    />
  );
}
