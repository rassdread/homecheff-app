/** Dutch tier label for public profiles (no “XP”; display-only). */
export function hcpPublicLevelTitle(level: number): string {
  const L = Math.max(1, Math.floor(level) || 1);
  if (L <= 1) return 'Nieuwkomer';
  if (L <= 2) return 'Actieve maker';
  if (L <= 4) return 'Lokale maker';
  if (L <= 6) return 'Groeiende creator';
  if (L <= 9) return 'Community-maker';
  if (L <= 12) return 'HomeCheff Creator';
  return 'HomeCheff legende';
}
