/**
 * Neutral Workspace Region wrapper — Phase 2F Settings ON pilot.
 * Semantic area only; no Domain State; not a landmark.
 */

import React, { type ReactNode } from "react";

export type WorkspaceRegionProps = {
  regionId: string;
  children: ReactNode;
};

export default function WorkspaceRegion({
  regionId,
  children,
}: WorkspaceRegionProps) {
  return (
    <div data-aw-region="" data-aw-region-id={regionId} className="w-full min-w-0">
      {children}
    </div>
  );
}
