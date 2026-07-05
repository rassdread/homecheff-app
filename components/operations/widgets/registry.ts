import AnalyticsContextWidget from '@/components/operations/widgets/AnalyticsContextWidget';
import DeliveryOpportunitiesWidget from '@/components/operations/widgets/DeliveryOpportunitiesWidget';
import FinanceContextWidget from '@/components/operations/widgets/FinanceContextWidget';
import OrdersContextWidget from '@/components/operations/widgets/OrdersContextWidget';
import PartnersGrowthWidget from '@/components/operations/widgets/PartnersGrowthWidget';
import PartnersNetworkWidget from '@/components/operations/widgets/PartnersNetworkWidget';
import TodayContextWidget from '@/components/operations/widgets/TodayContextWidget';
import type { OperationsWidgetDefinition } from '@/components/operations/widgets/types';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';

function hasDelivery(ctx: SettingsHubContext | null): boolean {
  if (!ctx) return false;
  const role = (ctx.role || '').toUpperCase();
  return Boolean(ctx.hasDeliveryProfile) || role === 'DELIVERY';
}

function hasAffiliate(ctx: SettingsHubContext | null): boolean {
  return Boolean(ctx?.hasAffiliate);
}

function hasSeller(ctx: SettingsHubContext | null): boolean {
  if (!ctx) return false;
  const role = (ctx.role || '').toUpperCase();
  return (ctx.sellerRoles?.length ?? 0) > 0 || role === 'SELLER';
}

/**
 * Opportunity-zone widget registry.
 * Core (Tasks/Finance/Status) and Action (Quick links) stay hardcoded in the shell.
 */
export const OPERATIONS_OPPORTUNITY_WIDGETS: OperationsWidgetDefinition[] = [
  {
    id: 'partners-growth',
    priority: 90,
    surfaces: ['desktop', 'drawer', 'sheet'],
    sections: ['partners'],
    eligibility: ({ ctx, activeSection }) =>
      activeSection === 'partners' && hasAffiliate(ctx),
    Component: PartnersGrowthWidget,
  },
  {
    id: 'partners-network',
    priority: 85,
    surfaces: ['desktop', 'drawer'],
    sections: ['partners'],
    eligibility: ({ ctx, activeSection, partnerExtras }) =>
      activeSection === 'partners' &&
      hasAffiliate(ctx) &&
      partnerExtras != null &&
      !partnerExtras.isSubAffiliate,
    Component: PartnersNetworkWidget,
  },
  {
    id: 'delivery-opportunities',
    priority: 80,
    surfaces: ['desktop', 'drawer', 'sheet'],
    sections: ['delivery'],
    eligibility: ({ ctx, activeSection }) =>
      activeSection === 'delivery' && hasDelivery(ctx),
    Component: DeliveryOpportunitiesWidget,
  },
  {
    id: 'today-context',
    priority: 75,
    surfaces: ['desktop', 'drawer', 'sheet'],
    sections: ['today'],
    eligibility: ({ activeSection }) => activeSection === 'today',
    Component: TodayContextWidget,
  },
  {
    id: 'orders-context',
    priority: 70,
    surfaces: ['desktop', 'drawer', 'sheet'],
    sections: ['orders'],
    eligibility: ({ ctx, activeSection }) =>
      activeSection === 'orders' && hasSeller(ctx),
    Component: OrdersContextWidget,
  },
  {
    id: 'finance-context',
    priority: 65,
    surfaces: ['desktop', 'drawer', 'sheet'],
    sections: ['finance'],
    eligibility: ({ activeSection }) => activeSection === 'finance',
    Component: FinanceContextWidget,
  },
  {
    id: 'analytics-context',
    priority: 50,
    surfaces: ['desktop', 'drawer', 'sheet'],
    sections: ['analytics'],
    eligibility: ({ ctx, activeSection }) =>
      activeSection === 'analytics' && hasSeller(ctx),
    Component: AnalyticsContextWidget,
  },
];
