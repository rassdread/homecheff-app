/** Level from total HomeCheff Points: simple sqrt curve. */
export function hcpLevelFromTotal(totalHcp: number): number {
  const t = Math.max(0, Number(totalHcp) || 0);
  return Math.floor(Math.sqrt(t / 100)) + 1;
}

/** Minimum total HCP required to reach the next level (exclusive of current band upper bound). */
export function nextLevelTotalHcpThreshold(currentLevel: number): number {
  const L = Math.max(1, Math.floor(currentLevel) || 1);
  return L * L * 100;
}

export function hcpProgressToNextLevel(totalHcp: number): {
  level: number;
  nextLevelHcp: number;
  hcpToNextLevel: number;
} {
  const level = hcpLevelFromTotal(totalHcp);
  const nextLevelHcp = nextLevelTotalHcpThreshold(level);
  const hcpToNextLevel = Math.max(0, nextLevelHcp - Math.max(0, totalHcp));
  return { level, nextLevelHcp, hcpToNextLevel };
}
