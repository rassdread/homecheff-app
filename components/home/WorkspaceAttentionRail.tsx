'use client';

import UserActionCenter from '@/components/home/UserActionCenter';

/**
 * Right rail: what deserves attention.
 * UserActionCenter already aggregates orders, messages, and role work.
 * Empty result stays the calm healthy state. No promotions.
 */
export default function WorkspaceAttentionRail() {
  return (
    <div data-hc-workspace-right="">
      <UserActionCenter variant="sidebar" />
    </div>
  );
}
