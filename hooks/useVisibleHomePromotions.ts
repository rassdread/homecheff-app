'use client';

import { useSession } from 'next-auth/react';
import { useUserBootstrap } from '@/components/user/UserBootstrapProvider';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { isNativeAndroid } from '@/lib/native/capacitor';
import {
  getVisibleHomePromotions,
  type HomePromotion,
  type HomePromotionId,
  type HomePromotionVisibilityContext,
} from '@/lib/promotions/home-promotions';

export function useHomePromotionVisibility(): HomePromotionVisibilityContext {
  const { data: session } = useSession();
  const { profile: bootstrapProfile } = useUserBootstrap();
  const nativeMounted = useIsNativeAppMounted();
  const isSubAffiliate = session?.user
    ? !!bootstrapProfile?.affiliate?.parentAffiliateId
    : false;
  const hideOnNativeAndroid = nativeMounted && isNativeAndroid();

  return { isSubAffiliate, hideOnNativeAndroid };
}

export function useVisibleHomePromotions(): HomePromotion[] {
  return getVisibleHomePromotions(useHomePromotionVisibility());
}

export function useVisibleHomePromotionIds(): HomePromotionId[] {
  return useVisibleHomePromotions().map((p) => p.id);
}
