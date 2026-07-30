/**
 * Explicit Settings widget host — Phase 2F.
 * Only settings.hub is allowlisted. No dynamic/arbitrary registry.
 */

import React, { type ReactNode } from "react";
import {
  SETTINGS_HUB_WIDGET_ID,
} from "@/lib/adaptive-workspace-react/create-settings-initial-plan";
import { isSettingsRenderAllowlistedWidget } from "@/lib/adaptive-workspace-react/validate-settings-render-plan";

export type SettingsWorkspaceWidgetHostProps = {
  widgetId: string;
  preservationKey: string;
  children: ReactNode;
  onReject?: (widgetId: string) => void;
};

export default function SettingsWorkspaceWidgetHost({
  widgetId,
  preservationKey,
  children,
  onReject,
}: SettingsWorkspaceWidgetHostProps) {
  if (
    widgetId !== SETTINGS_HUB_WIDGET_ID ||
    !isSettingsRenderAllowlistedWidget(widgetId)
  ) {
    onReject?.(widgetId);
    return null;
  }

  return (
    <div
      data-aw-widget-host=""
      data-aw-widget-id={widgetId}
      data-aw-preservation-key={preservationKey}
      data-aw-settings-content=""
      className="w-full min-w-0"
    >
      {children}
    </div>
  );
}
