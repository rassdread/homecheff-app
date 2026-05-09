/** Shared types for `/api/gamification/me` (safe for client `import type`). */

export type PendingClientReward = {
  id: string;
  kind: 'hcp' | 'badge' | 'streak' | 'level';
  title: string;
  subtitle?: string;
  points?: number;
  slug?: string;
};

export type WeeklyChallengeItemDto = {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
};

export type GamificationMeResponse = {
  totalHcp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  nextLevelHcp: number;
  hcpToNextLevel: number;
  recentEvents: Array<{
    id: string;
    action: string;
    points: number;
    sourceType: string;
    sourceId: string;
    createdAt: string;
  }>;
  badges: Array<{
    slug: string;
    name: string;
    description?: string | null;
    iconKey?: string | null;
    awardedAt: string;
  }>;
  pendingClientRewards?: PendingClientReward[];
  hcpWelcomePending?: boolean;
  weeklyChallenges?: { weekKey: string; items: WeeklyChallengeItemDto[] };
};
