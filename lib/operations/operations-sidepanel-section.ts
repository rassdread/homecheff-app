import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import {
  listVisibleOperationsTabs,
  resolveActiveOperationsTab,
  type OperationsTabId,
} from '@/lib/operations/operations-tabs';

export type OperationsSidepanelSection = OperationsTabId;

/** Active Operations section from pathname, with role-gated fallback to today. */
export function resolveActiveOperationsSection(
  pathname: string | null | undefined,
  ctx: SettingsHubContext | null,
): OperationsSidepanelSection {
  const tab = resolveActiveOperationsTab(pathname);
  if (!tab || !ctx) return 'today';

  const visibleIds = new Set(
    listVisibleOperationsTabs(ctx).map((t) => t.id),
  );
  if (visibleIds.has(tab)) return tab;
  return 'today';
}

export function isOperationsSectionVisible(
  section: OperationsSidepanelSection,
  ctx: SettingsHubContext | null,
): boolean {
  if (!ctx) return false;
  return listVisibleOperationsTabs(ctx).some((t) => t.id === section);
}
