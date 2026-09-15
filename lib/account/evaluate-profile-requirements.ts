/**
 * Central profile/account requirements engine.
 *
 * Combines existing account gates, recommended profile fields, seller location
 * nudges and delivery missing codes into one structured result.
 * Does not invent new blocking rules.
 */

import type { AccountRequirementsAction, AccountRequirementsUserInput } from '@/lib/account-requirements';
import {
  getAccountRequirements,
  missingRequirementsForAction,
} from '@/lib/account-requirements';
import {
  aggregateRequirementNotice,
  assertNoticeIsActionable,
  noticesForAccountMissing,
  noticesForDeliveryMissing,
  recommendedProfileNotices,
  recommendedSellerLocationNotices,
  serializeRequirementNotice,
  type AggregatedRequirementNotice,
  type ProfileRequirementNotice,
} from '@/lib/account/profile-requirement-notice';

export type ProfileRequirementsUserInput = AccountRequirementsUserInput & {
  name?: string | null;
  image?: string | null;
  place?: string | null;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
};

export type ProfileRequirementsEvaluation = {
  action: AccountRequirementsAction;
  isComplete: boolean;
  blockingRequirements: ProfileRequirementNotice[];
  recommendedRequirements: ProfileRequirementNotice[];
  informationalRequirements: ProfileRequirementNotice[];
  missingRequirements: ProfileRequirementNotice[];
  notice: AggregatedRequirementNotice | null;
  targetRoute: string | null;
};

export function evaluateProfileRequirements(input: {
  user: ProfileRequirementsUserInput | null | undefined;
  action?: AccountRequirementsAction;
  deliveryMissing?: string[] | null;
  includeSellerLocation?: boolean;
}): ProfileRequirementsEvaluation {
  const action = input.action ?? 'postItem';
  const snap = getAccountRequirements(input.user ?? null);
  const actionMissing = missingRequirementsForAction(action, snap.missing);
  const blocking = [
    ...noticesForAccountMissing(actionMissing),
    ...noticesForDeliveryMissing(input.deliveryMissing || []),
  ];
  const recommended = [
    ...recommendedProfileNotices({
      name: input.user?.name,
      image: input.user?.image,
      place: input.user?.place,
      lat: input.user?.lat,
      lng: input.user?.lng,
    }),
    ...(input.includeSellerLocation
      ? recommendedSellerLocationNotices({
          city: input.user?.city,
          country: input.user?.country,
          postalCode: input.user?.postalCode,
        })
      : []),
  ].filter((item, index, all) => all.findIndex((x) => x.code === item.code) === index);

  const notice = aggregateRequirementNotice(blocking.length ? blocking : recommended, {
    completeCtaNl: blocking.length ? 'Account voltooien' : 'Profiel voltooien',
  });
  if (notice) assertNoticeIsActionable(notice);

  return {
    action,
    isComplete: blocking.length === 0,
    blockingRequirements: blocking,
    recommendedRequirements: recommended,
    informationalRequirements: [],
    missingRequirements: [...blocking, ...recommended],
    notice,
    targetRoute: notice?.targetRoute ?? null,
  };
}

export { serializeRequirementNotice };
