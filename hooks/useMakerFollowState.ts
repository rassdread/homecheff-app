'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { openSoftAuthGateWithScroll } from '@/lib/onboarding/open-soft-auth-gate';
import {
  fetchMakerFollowStatusDeduped,
  getMakerFollowSnapshot,
  seedMakerFollowSnapshot,
  setMakerFollowSnapshot,
  subscribeMakerFollow,
} from '@/lib/follow/follow-state-store';
import { invalidateCachedUserStats, patchCachedUserFansCount } from '@/lib/userStatsClientCache';

type Options = {
  sellerId: string;
  initialFollowing?: boolean;
  initialFansCount?: number;
};

export function useMakerFollowState({
  sellerId,
  initialFollowing,
  initialFansCount,
}: Options) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [, bump] = useState(0);

  useEffect(() => {
    if (!sellerId) return;
    if (initialFollowing !== undefined || initialFansCount !== undefined) {
      seedMakerFollowSnapshot(sellerId, {
        following: Boolean(initialFollowing),
        fansCount: initialFansCount ?? getMakerFollowSnapshot(sellerId)?.fansCount ?? 0,
      });
    }
    return subscribeMakerFollow(sellerId, () => bump((n) => n + 1));
  }, [sellerId, initialFollowing, initialFansCount]);

  const snap = getMakerFollowSnapshot(sellerId) ?? {
    following: Boolean(initialFollowing),
    fansCount: initialFansCount ?? 0,
  };

  useEffect(() => {
    if (!sellerId || !session?.user) return;
    const current = getMakerFollowSnapshot(sellerId);
    if (current && initialFollowing !== undefined) return;
    if (current && initialFollowing === undefined && current.following) return;

    let cancelled = false;
    void (async () => {
      try {
        const following = await fetchMakerFollowStatusDeduped(sellerId);
        if (cancelled) return;
        const prev = getMakerFollowSnapshot(sellerId);
        setMakerFollowSnapshot(sellerId, {
          following,
          fansCount: prev?.fansCount ?? initialFansCount ?? 0,
        });
      } catch {
        /* keep seeded state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId, session?.user, initialFollowing, initialFansCount]);

  const toggle = useCallback(
    async (event?: React.MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (!sellerId) return;

      if (!session?.user) {
        const returnPath = `${pathname || '/'}${typeof window !== 'undefined' ? window.location.search : ''}`;
        openSoftAuthGateWithScroll({
          copyKey: 'follow',
          intent: {
            type: 'follow_profile',
            targetId: sellerId,
            returnPath,
            autoResume: true,
          },
        });
        return;
      }

      const prev = getMakerFollowSnapshot(sellerId) ?? {
        following: Boolean(initialFollowing),
        fansCount: initialFansCount ?? 0,
      };
      const optimisticFollowing = !prev.following;
      const optimisticCount = Math.max(0, prev.fansCount + (optimisticFollowing ? 1 : -1));
      setMakerFollowSnapshot(
        sellerId,
        {
          following: optimisticFollowing,
          fansCount: optimisticCount,
        },
        { local: true },
      );
      patchCachedUserFansCount(sellerId, optimisticCount);

      try {
        const res = await fetch('/api/follows/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellerId }),
        });
        if (!res.ok) {
          setMakerFollowSnapshot(sellerId, prev, { local: true });
          patchCachedUserFansCount(sellerId, prev.fansCount);
          return;
        }
        const data = (await res.json()) as { following?: boolean; fansCount?: number };
        const following = Boolean(data.following);
        const fansCount =
          typeof data.fansCount === 'number' ? Math.max(0, data.fansCount) : optimisticCount;
        setMakerFollowSnapshot(sellerId, { following, fansCount }, { local: true });
        patchCachedUserFansCount(sellerId, fansCount);
        invalidateCachedUserStats(sellerId);
      } catch {
        setMakerFollowSnapshot(sellerId, prev, { local: true });
        patchCachedUserFansCount(sellerId, prev.fansCount);
      }
    },
    [pathname, sellerId, session?.user, initialFollowing, initialFansCount],
  );

  return {
    following: snap.following,
    fansCount: snap.fansCount,
    toggle,
    isOwnProfile: Boolean(session?.user?.id && session.user.id === sellerId),
  };
}
