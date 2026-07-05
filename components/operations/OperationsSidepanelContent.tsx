'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import OperationsTasksSection, {
  type OperationsTasksSurface,
} from '@/components/operations/OperationsTasksSection';
import UnansweredMessagesWidget from '@/components/operations/widgets/UnansweredMessagesWidget';
import CustomerWaitingWidget from '@/components/operations/widgets/CustomerWaitingWidget';
import OperationsFinanceCard from '@/components/operations/OperationsFinanceCard';
import OperationsStatusChips from '@/components/operations/OperationsStatusChips';
import OperationsOpportunityZone from '@/components/operations/widgets/OperationsOpportunityZone';
import RoleQuickLinksSection from '@/components/navigation/RoleQuickLinksSection';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

export type SidepanelLayout = 'desktop' | 'drawer' | 'sheet';

type Props = {
  /** Task list density */
  surface?: OperationsTasksSurface;
  /** desktop | drawer | sheet section ordering */
  layout?: SidepanelLayout;
  showProfileLink?: boolean;
  className?: string;
};

export default function OperationsSidepanelContent({
  surface = 'desktop',
  layout = 'desktop',
  showProfileLink = true,
  className,
}: Props) {
  const { tOr } = useTranslation();
  const { ctx, activeSection, sectionExtras } = useOperationsSidepanel();

  const profileLabel = tOr(
    'operations.sidepanel.profileLink',
    'View profile',
    'Bekijk profiel',
  );

  const tasks = (
    <>
      <UnansweredMessagesWidget compact={layout === 'sheet'} />
      <CustomerWaitingWidget />
      <OperationsTasksSection
        surface={layout === 'sheet' ? 'inline' : surface}
        compactHeader={layout === 'sheet'}
      />
    </>
  );
  const finance = (
    <OperationsFinanceCard compact={layout === 'sheet' || surface === 'inline'} />
  );
  const status = layout !== 'sheet' ? <OperationsStatusChips /> : null;
  const opportunity = (
    <OperationsOpportunityZone layout={layout} compact={layout === 'sheet'} />
  );
  const actions = layout !== 'sheet' ? (
    <RoleQuickLinksSection
      ctx={ctx}
      surface="operations"
      operationsSection={activeSection}
      max={4}
      isSubAffiliate={sectionExtras.partner?.isSubAffiliate}
      className="border-0 shadow-none"
    />
  ) : null;

  const profileLink =
    showProfileLink && layout === 'desktop' ? (
      <div className="pt-1">
        <Link
          href="/profile"
          prefetch
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-emerald-700"
        >
          {profileLabel}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    ) : null;

  let blocks: ReactNode;

  if (layout === 'drawer') {
    blocks = (
      <>
        {finance}
        {tasks}
        {status}
        {actions}
        {opportunity}
      </>
    );
  } else if (layout === 'sheet') {
    blocks = (
      <>
        {tasks}
        {finance}
        {opportunity}
      </>
    );
  } else {
    blocks = (
      <>
        {tasks}
        {finance}
        {status}
        {actions}
        {opportunity}
      </>
    );
  }

  return <div className={cn('space-y-3', className)}>{blocks}{profileLink}</div>;
}
