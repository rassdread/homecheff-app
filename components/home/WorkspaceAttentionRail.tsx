'use client';

import { useLayoutEffect, useState } from 'react';
import CommunityPulseBar from '@/components/home/CommunityPulseBar';
import CreatorMomentumCard from '@/components/home/CreatorMomentumCard';
import HomeReputationCompactCard from '@/components/home/HomeReputationCompactCard';
import ReturnBelongingStrip from '@/components/home/ReturnBelongingStrip';
import UserActionCenter from '@/components/home/UserActionCenter';

/** Matches the layout band that opens the end rail (1024px and up). */
function useWorkspaceEndRailVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setVisible(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return visible;
}

/**
 * Right rail: what is happening, and how is it going?
 * Attention first, then compact insights. Empty blocks render nothing.
 * Below 1024 the column is hidden, so this returns null and does not fetch.
 * Growth, promotions, and the FAQ card stay out.
 */
export default function WorkspaceAttentionRail() {
  const visible = useWorkspaceEndRailVisible();
  if (!visible) return null;

  return (
    <div data-hc-workspace-right="" className="flex flex-col gap-2 px-1 py-1">
      <UserActionCenter variant="sidebar" density="cockpit" />
      <CreatorMomentumCard variant="workspace" className="mb-0" />
      <CommunityPulseBar variant="workspace" />
      <HomeReputationCompactCard variant="workspace" />
      <ReturnBelongingStrip variant="workspace" className="mb-0" />
    </div>
  );
}
