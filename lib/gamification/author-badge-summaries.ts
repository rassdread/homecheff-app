import { prisma } from '@/lib/prisma';

/** Lightweight badge row for tiles (no full badge history). */
export type AuthorBadgeChip = { key: string; name: string; icon: string };

const FALLBACK_ICON = '⭐';

/** Map stored `iconKey` to a single display glyph (emoji or short symbol). */
export function iconKeyToDisplayIcon(iconKey: string | null | undefined): string {
  if (!iconKey) return FALLBACK_ICON;
  const k = iconKey.trim().toLowerCase();
  const map: Record<string, string> = {
    medal: '🥇',
    photo: '📸',
    fotokoning: '📸',
    active: '🔥',
    actief: '🔥',
    inspiration: '🌱',
    inspiratie: '🌱',
    seller: '🛒',
    verkoper: '🛒',
    community: '🤝',
    review: '⭐',
    star: '⭐',
    spark: '✨',
    user: '👤',
    heart: '❤️',
    rocket: '🚀',
    streak: '🔥',
    fire: '🔥',
    cart: '🛒',
    chef: '👨‍🍳',
    garden: '🌿',
    design: '🎨',
  };
  return map[k] ?? (k.length <= 3 ? k.toUpperCase() : FALLBACK_ICON);
}

/**
 * Batch-fetch up to `maxPerUser` most recently awarded badges per user (single query, no N+1).
 */
export async function fetchAuthorBadgeSummariesByUserIds(
  userIds: string[],
  maxPerUser = 2
): Promise<Map<string, AuthorBadgeChip[]>> {
  const out = new Map<string, AuthorBadgeChip[]>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return out;

  const rows = await prisma.userBadge.findMany({
    where: { userId: { in: unique } },
    include: {
      badge: { select: { slug: true, name: true, iconKey: true } },
    },
    orderBy: { awardedAt: 'desc' },
  });

  for (const row of rows) {
    const uid = row.userId;
    const list = out.get(uid) ?? [];
    if (list.length >= maxPerUser) continue;
    list.push({
      key: row.badge.slug,
      name: row.badge.name,
      icon: iconKeyToDisplayIcon(row.badge.iconKey),
    });
    out.set(uid, list);
  }

  return out;
}
