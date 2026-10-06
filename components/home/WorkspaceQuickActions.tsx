'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AffiliateQuickShareModal from '@/components/affiliate/AffiliateQuickShareModal';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useTranslation } from '@/hooks/useTranslation';
import { sellerRolesToAllowedVerticals } from '@/lib/createFlowIntent';
import { buildWorkspaceQuickActions } from '@/lib/home/workspace-rail-model';
import { primaryDashboardContextFromUser } from '@/lib/navigation/primary-dashboard';

const FALLBACKS: Record<string, { en: string; nl: string }> = {
  'home.presentation.newOffer': { en: 'New listing', nl: 'Nieuw aanbod' },
  'home.presentation.offerService': { en: 'Offer a service', nl: 'Dienst aanbieden' },
  'home.presentation.promote': { en: 'Share my link', nl: 'Deel mijn link' },
  'home.presentation.deliveries': { en: 'Deliveries', nl: 'Leveringen' },
};

/**
 * Phone and tablet copy of the primary actions.
 * Desktop keeps them in the work rail so the center stays the working surface.
 */
export default function WorkspaceQuickActions() {
  const { tOr } = useTranslation();
  const { data: session } = useSession();
  const createFlow = useCreateFlow();
  const [qrOpen, setQrOpen] = useState(false);
  const ctx = primaryDashboardContextFromUser(
    (session?.user ?? null) as Record<string, unknown> | null,
  );
  const actions = buildWorkspaceQuickActions(ctx);
  const allowedVerticals = sellerRolesToAllowedVerticals(ctx?.sellerRoles ?? []);
  if (actions.length === 0) return null;

  const labelFor = (key: string) => {
    const fallback = FALLBACKS[key];
    return tOr(key, fallback?.en ?? key, fallback?.nl ?? key);
  };

  return (
    <div
      data-hc-workspace-quick=""
      className="flex flex-wrap gap-2 border-b border-[var(--hc-border-quiet)] bg-[var(--hc-surface-card)] px-3 py-2 md:hidden"
    >
      {actions.map((item) => {
        const primary = item.emphasis !== 'secondary';
        const className = primary
          ? 'hc-btn-primary min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-semibold'
          : 'hc-btn-secondary min-h-[40px] rounded-lg px-2.5 py-1 text-xs font-semibold';
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
                ...(item.id === 'offer-service' ? {} : { allowedVerticals }),
                ...(item.createVertical ? { vertical: item.createVertical } : {}),
              });
            }}
            className={className}
          >
            {labelFor(item.labelKey)}
          </button>
        );
      })}
      <AffiliateQuickShareModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
