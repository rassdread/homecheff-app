import type { ComponentType } from 'react';
import type { SidepanelLayout } from '@/components/operations/OperationsSidepanelContent';
import type { PartnerSectionExtras } from '@/hooks/useOperationsSectionExtras';
import type { OperationsSidepanelSection } from '@/lib/operations/operations-sidepanel-section';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';

export type OperationsWidgetSurface = SidepanelLayout;

export type OperationsWidgetSection = OperationsSidepanelSection;

export type OperationsWidgetProps = {
  compact?: boolean;
};

export type OperationsWidgetResolveContext = {
  ctx: SettingsHubContext | null;
  activeSection: OperationsWidgetSection;
  layout: OperationsWidgetSurface;
  hasUrgentTasks: boolean;
  loadingSection: boolean;
  partnerExtras: PartnerSectionExtras | null;
};

export type OperationsWidgetDefinition = {
  id: string;
  priority: number;
  surfaces: OperationsWidgetSurface[];
  sections: OperationsWidgetSection[];
  eligibility: (resolveCtx: OperationsWidgetResolveContext) => boolean;
  Component: ComponentType<OperationsWidgetProps>;
};

export const OPPORTUNITY_WIDGET_CAPS: Record<
  OperationsWidgetSurface,
  { default: number; urgent: number }
> = {
  desktop: { default: 3, urgent: 1 },
  drawer: { default: 1, urgent: 0 },
  sheet: { default: 1, urgent: 0 },
};
