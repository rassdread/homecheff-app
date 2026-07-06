'use client';

import type { TileTrustCue } from '@/lib/marketplace/tiles';

export default function TileTrustCue({
  trustCue,
  className = 'truncate text-[11px] font-medium text-gray-500',
}: {
  trustCue: TileTrustCue | null;
  className?: string;
}) {
  if (!trustCue || trustCue.segments.length === 0) return null;
  return <p className={className}>{trustCue.segments.join(' · ')}</p>;
}
