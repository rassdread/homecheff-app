import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';
import type { ProfileFieldsForHcp } from './profile-completeness';
import { isProfileCompleteForHcp } from './profile-completeness';

export type { ProfileFieldsForHcp } from './profile-completeness';
export { isProfileCompleteForHcp } from './profile-completeness';

export async function tryAwardProfileCompleted(userId: string, u: ProfileFieldsForHcp): Promise<void> {
  if (!isProfileCompleteForHcp(u)) return;
  await awardHcp({
    userId,
    action: 'PROFILE_COMPLETED',
    points: HCP_ACTION_POINTS.PROFILE_COMPLETED,
    sourceType: 'USER',
    sourceId: userId,
  });
}
