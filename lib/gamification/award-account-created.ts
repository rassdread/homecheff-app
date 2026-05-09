import { awardHcp } from './award-hcp';
import { HCP_ACTION_POINTS } from './hcp-actions';

export async function tryAwardAccountCreated(userId: string): Promise<void> {
  await awardHcp({
    userId,
    action: 'ACCOUNT_CREATED',
    points: HCP_ACTION_POINTS.ACCOUNT_CREATED,
    sourceType: 'USER',
    sourceId: userId,
  });
}
