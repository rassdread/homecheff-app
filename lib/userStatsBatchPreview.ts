/**
 * Batch-compute user stats for feed statsPreview.
 */
import {
  computeUserPublicStats,
  toUserStatsTilePayload,
} from '@/lib/stats/compute-user-public-stats';
import type { UserStatsPayload } from '@/lib/userStatsClientCache';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function batchComputeUserStatsPreview(
  userIds: string[],
): Promise<Record<string, UserStatsPayload>> {
  const ids = [...new Set(userIds)].filter((id) => UUID_REGEX.test(id));
  if (ids.length === 0) return {};

  const out: Record<string, UserStatsPayload> = {};

  try {
    const rows = await Promise.all(
      ids.map(async (id) => {
        const stats = await computeUserPublicStats(id);
        return [id, toUserStatsTilePayload(stats)] as const;
      }),
    );
    for (const [id, payload] of rows) {
      out[id] = payload;
    }
    return out;
  } catch (e) {
    console.error('[batchComputeUserStatsPreview]', e);
    return {};
  }
}
