'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AffiliateQuickShareModal from '@/components/affiliate/AffiliateQuickShareModal';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useTranslation } from '@/hooks/useTranslation';
import { sellerRolesToAllowedVerticals } from '@/lib/createFlowIntent';
import { primaryDashboardContextFromUser } from '@/lib/navigation/primary-dashboard';
import {
  buildWorkspaceLeftGroups,
  buildWorkspaceQuickActions,
} from '@/lib/home/workspace-rail-model';

const FALLBACKS: Record<string, { en: string; nl: string }> = {
  'home.presentation.workspace': { en: 'Workspace', nl: 'Werkruimte' },
  'home.presentation.today': { en: 'Today', nl: 'Vandaag' },
  'home.presentation.messages': { en: 'Messages', nl: 'Berichten' },
  'home.presentation.groupSelling': { en: 'Selling', nl: 'Verkopen' },
  'home.presentation.groupService': { en: 'Services', nl: 'Diensten' },
  'home.presentation.myServices': { en: 'My services', nl: 'Mijn diensten' },
  'home.presentation.myOffer': { en: 'My listings', nl: 'Mijn aanbod' },
  'home.presentation.newOffer': { en: 'New listing', nl: 'Nieuw aanbod' },
  'home.presentation.orders': { en: 'Orders', nl: 'Bestellingen' },
  'home.presentation.appointments': { en: 'Appointments', nl: 'Afspraken' },
  'home.presentation.groupAffiliate': { en: 'Affiliate', nl: 'Affiliate' },
  'home.presentation.myLink': { en: 'My link / QR', nl: 'Mijn link / QR' },
  'home.presentation.signups': { en: 'Signups', nl: 'Aanmeldingen' },
  'home.presentation.promo': { en: 'Promo material', nl: 'Promotiemateriaal' },
  'home.presentation.partners': { en: 'Partners', nl: 'Partners' },
  'home.presentation.groupDelivery': { en: 'Delivery', nl: 'Bezorging' },
  'home.presentation.deliveries': { en: 'Deliveries', nl: 'Leveringen' },
  'home.presentation.availability': { en: 'Availability', nl: 'Beschikbaarheid' },
  'home.presentation.groupOverview': { en: 'Overview', nl: 'Overzicht' },
  'home.presentation.performance': { en: 'Performance', nl: 'Prestaties' },
  'home.presentation.earnings': { en: 'Earnings', nl: 'Verdiensten' },
  'home.presentation.offerService': { en: 'Offer a service', nl: 'Dienst aanbieden' },
  'home.presentation.promote': { en: 'Share my link', nl: 'Deel mijn link' },
};

export default function WorkspaceWorkRail() {
  const { tOr } = useTranslation();
  const { data: session } = useSession();
  const createFlow = useCreateFlow();
  const [qrOpen, setQrOpen] = useState(false);
  const ctx = primaryDashboardContextFromUser(
    (session?.user ?? null) as Record<string, unknown> | null,
  );
  const groups = buildWorkspaceLeftGroups(ctx);
  const quickActions = buildWorkspaceQuickActions(ctx);
  const allowedVerticals = sellerRolesToAllowedVerticals(ctx?.sellerRoles ?? []);

  const labelFor = (key: string) => {
    const fallback = FALLBACKS[key];
    return tOr(key, fallback?.en ?? key, fallback?.nl ?? key);
  };

  if (groups.length === 0) return null;

  return (
    <nav
      aria-label={labelFor('home.presentation.workspace')}
      data-hc-workspace-left=""
      className="space-y-4"
    >
      {quickActions.length > 0 ? (
        <div data-hc-workspace-quick="" className="flex flex-col gap-1.5 px-1">
          {quickActions.map((item) => {
            const primary = item.emphasis !== 'secondary';
            const className = primary
              ? 'inline-flex min-h-[36px] items-center justify-center rounded-lg bg-emerald-700 px-2.5 py-1.5 text-center text-xs font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2'
              : 'inline-flex min-h-[32px] items-center justify-center rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-center text-xs font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2';
            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                data-hc-workspace-quick-action={item.id}
                data-hc-quick-emphasis={item.emphasis ?? 'primary'}
                className={className}
              >
                {labelFor(item.labelKey)}
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                data-hc-workspace-quick-action={item.id}
                data-hc-quick-emphasis={item.emphasis ?? 'primary'}
                onClick={() => {
                  if (item.action === 'openAffiliateQr') {
                    setQrOpen(true);
                    return;
                  }
                  createFlow.openCreateFlowWithIntent({
                    mode: 'dorpsplein',
                    allowedVerticals,
                    ...(item.createVertical
                      ? { vertical: item.createVertical }
                      : {}),
                  });
                }}
                className={className}
              >
                {labelFor(item.labelKey)}
              </button>
            );
          })}
        </div>
      ) : null}
      {groups.map((group) => (
        <section key={group.id} data-hc-workspace-group={group.id}>
          {group.labelKey ? (
            <h2 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {labelFor(group.labelKey)}
            </h2>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    data-hc-workspace-link={item.id}
                    className="block rounded-lg px-2 py-2 text-sm font-medium text-gray-800 hover:bg-emerald-50"
                  >
                    {labelFor(item.labelKey)}
                  </Link>
                ) : (
                  <button
                    type="button"
                    data-hc-workspace-link={item.id}
                    onClick={() => {
                      if (item.action === 'openAffiliateQr') {
                        setQrOpen(true);
                        return;
                      }
                      if (item.action === 'openCreateOffer') {
                        createFlow.openCreateFlowWithIntent({
                          mode: 'dorpsplein',
                          allowedVerticals,
                          ...(item.createVertical
                            ? { vertical: item.createVertical }
                            : {}),
                        });
                      }
                    }}
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-gray-800 hover:bg-emerald-50"
                  >
                    {labelFor(item.labelKey)}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <AffiliateQuickShareModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </nav>
  );
}
