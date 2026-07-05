'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, QrCode, Plus, Sparkles } from 'lucide-react';
import AffiliateQuickShareModal from '@/components/affiliate/AffiliateQuickShareModal';
import MessagesQuickActionLink from '@/components/communication/MessagesQuickActionLink';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useAffiliatePartnerMeta } from '@/hooks/useAffiliatePartnerMeta';
import { useCommsUnread } from '@/hooks/useCommsUnread';
import { useTranslation } from '@/hooks/useTranslation';
import { sellerRolesToAllowedVerticals } from '@/lib/createFlowIntent';
import {
  getRoleQuickLinks,
  type QuickLinkSurface,
  type RoleQuickLink,
} from '@/lib/navigation/role-quick-links';
import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import type { OperationsTabId } from '@/lib/operations/operations-tabs';
import { cn } from '@/lib/utils';

type Props = {
  ctx: SettingsHubContext | null;
  surface: QuickLinkSurface;
  titleKey?: string;
  className?: string;
  compact?: boolean;
  operationsSection?: OperationsTabId;
  max?: number;
  /** Skip lazy affiliate meta fetch when parent already knows sub-partner status */
  isSubAffiliate?: boolean;
  /** Show Berichten link in this block (operations sidepanel) */
  includeMessagesLink?: boolean;
};

function linkIcon(id: string) {
  if (id.startsWith('affiliate')) return <QrCode className="h-4 w-4 shrink-0" />;
  if (id.startsWith('seller-new')) return <Plus className="h-4 w-4 shrink-0" />;
  if (id.startsWith('seller-inspiration')) return <Sparkles className="h-4 w-4 shrink-0" />;
  return null;
}

export default function RoleQuickLinksSection({
  ctx,
  surface,
  titleKey = surface === 'profile'
    ? 'roleQuickLinks.profileTitle'
    : 'roleQuickLinks.title',
  className,
  compact = false,
  operationsSection,
  max,
  isSubAffiliate: isSubAffiliateProp,
  includeMessagesLink,
}: Props) {
  const { t } = useTranslation();
  const createFlow = useCreateFlow();
  const [qrOpen, setQrOpen] = useState(false);
  const { count: messagesUnreadCount } = useCommsUnread();
  const showMessagesLink = includeMessagesLink ?? surface === 'operations';
  const promoteMessages = showMessagesLink && messagesUnreadCount > 0;

  const needsAffiliateMeta =
    Boolean(ctx?.hasAffiliate) && isSubAffiliateProp === undefined;
  const { meta: affiliateMeta } = useAffiliatePartnerMeta(needsAffiliateMeta);

  const isSubAffiliate =
    isSubAffiliateProp ?? affiliateMeta?.isSubAffiliate ?? false;

  const links = getRoleQuickLinks(ctx, surface, {
    operationsSection,
    max,
    isSubAffiliate,
  });

  if (links.length === 0 && !showMessagesLink) return null;

  const allowedVerticals = sellerRolesToAllowedVerticals(ctx?.sellerRoles ?? []);

  const handleAction = (link: RoleQuickLink) => {
    if (link.action === 'openAffiliateQr') {
      setQrOpen(true);
      return;
    }
    if (link.action === 'openCreateOffer') {
      createFlow.openCreateFlowWithIntent({
        mode: 'dorpsplein',
        allowedVerticals,
      });
      return;
    }
    if (link.action === 'openCreateInspiration') {
      createFlow.openCreateFlowWithIntent({
        mode: 'inspiratie',
        allowedVerticals,
      });
    }
  };

  return (
    <>
      <section
        className={cn('hc-dorpsplein-card px-3 py-3', className)}
        aria-label={t(titleKey)}
      >
        <h3 className={cn('hc-section-title mb-2', compact ? 'text-sm' : 'text-base')}>
          {t(titleKey)}
        </h3>
        <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
          {promoteMessages ? (
            <MessagesQuickActionLink layout={compact ? 'row' : 'grid'} />
          ) : null}
          {links.map((link) => {
            const icon = linkIcon(link.id);
            const inner = (
              <>
                <span className="flex min-w-0 items-center gap-2">
                  {icon}
                  <span className="truncate">{t(link.labelKey)}</span>
                </span>
                {!link.action ? (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                ) : null}
              </>
            );

            if (link.href) {
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  prefetch
                  className="group flex min-h-[44px] items-center justify-between gap-1 rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-900 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleAction(link)}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-900 transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                {inner}
              </button>
            );
          })}
          {showMessagesLink && !promoteMessages ? (
            <MessagesQuickActionLink layout={compact ? 'row' : 'grid'} />
          ) : null}
        </div>
      </section>

      <AffiliateQuickShareModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
}
