'use client';

import OperationsSidepanelContent from '@/components/operations/OperationsSidepanelContent';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export default function OperationsSidepanel({ className }: Props) {
  return (
    <div
      className={cn(
        'hc-operations-sidepanel-sticky hc-operations-sidepanel-sticky-inner px-4 py-4',
        className,
      )}
    >
      <OperationsSidepanelContent surface="desktop" />
    </div>
  );
}
