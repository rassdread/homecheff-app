/**
 * Neutral Workspace Slot wrapper — Phase 2F Settings ON pilot.
 */

import React, { type ReactNode } from "react";

export type WorkspaceSlotProps = {
  slotId: string;
  regionId: string;
  children: ReactNode;
};

export default function WorkspaceSlot({
  slotId,
  regionId,
  children,
}: WorkspaceSlotProps) {
  return (
    <div
      data-aw-slot=""
      data-aw-slot-id={slotId}
      data-aw-slot-region={regionId}
      className="w-full min-w-0"
    >
      {children}
    </div>
  );
}
