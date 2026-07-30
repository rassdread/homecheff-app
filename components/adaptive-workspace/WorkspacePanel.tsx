/**
 * Neutral Workspace Panel instance wrapper — Phase 2F Settings ON pilot.
 */

import React, { type ReactNode } from "react";

export type WorkspacePanelProps = {
  panelId: string;
  slotId: string;
  widgetId: string;
  mode: string;
  children: ReactNode;
};

export default function WorkspacePanel({
  panelId,
  slotId,
  widgetId,
  mode,
  children,
}: WorkspacePanelProps) {
  return (
    <div
      data-aw-panel=""
      data-aw-panel-id={panelId}
      data-aw-panel-slot={slotId}
      data-aw-panel-widget={widgetId}
      data-aw-panel-mode={mode}
      className="w-full min-w-0"
    >
      {children}
    </div>
  );
}
