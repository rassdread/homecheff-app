import { OPERATIONS_OPPORTUNITY_WIDGETS } from '@/components/operations/widgets/registry';
import {
  OPPORTUNITY_WIDGET_CAPS,
  type OperationsWidgetDefinition,
  type OperationsWidgetResolveContext,
} from '@/components/operations/widgets/types';

export function resolveOperationsOpportunityWidgets(
  resolveCtx: OperationsWidgetResolveContext,
): OperationsWidgetDefinition[] {
  const { layout, hasUrgentTasks } = resolveCtx;
  const cap = hasUrgentTasks
    ? OPPORTUNITY_WIDGET_CAPS[layout].urgent
    : OPPORTUNITY_WIDGET_CAPS[layout].default;

  if (cap === 0) return [];

  return OPERATIONS_OPPORTUNITY_WIDGETS.filter((widget) => {
    if (!widget.surfaces.includes(layout)) return false;
    if (!widget.sections.includes(resolveCtx.activeSection)) return false;
    return widget.eligibility(resolveCtx);
  })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, cap);
}
