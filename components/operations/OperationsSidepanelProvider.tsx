'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useOperationsSidepanelData } from '@/hooks/useOperationsSidepanelData';
import { useOperationsSectionExtras } from '@/hooks/useOperationsSectionExtras';
import { useOperationsContext } from '@/components/operations/useOperationsContext';
import { resolveActiveOperationsSection } from '@/lib/operations/operations-sidepanel-section';
import type { OperationsSidepanelSection } from '@/lib/operations/operations-sidepanel-section';

type SectionExtrasState = ReturnType<typeof useOperationsSectionExtras>;

type OperationsSidepanelContextValue = ReturnType<
  typeof useOperationsSidepanelData
> & {
  ctx: ReturnType<typeof useOperationsContext>['ctx'];
  entry: ReturnType<typeof useOperationsContext>['entry'];
  activeSection: OperationsSidepanelSection;
  sectionExtras: SectionExtrasState;
};

const OperationsSidepanelContext =
  createContext<OperationsSidepanelContextValue | null>(null);

export function OperationsSidepanelProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const pathname = usePathname();
  const { ctx, entry } = useOperationsContext();
  const data = useOperationsSidepanelData(enabled);

  const activeSection = useMemo(
    () => resolveActiveOperationsSection(pathname, ctx),
    [pathname, ctx],
  );

  const sectionExtras = useOperationsSectionExtras(
    activeSection,
    ctx,
    enabled,
  );

  const value = useMemo(
    () => ({
      ...data,
      ctx,
      entry,
      activeSection,
      sectionExtras,
    }),
    [data, ctx, entry, activeSection, sectionExtras],
  );

  return (
    <OperationsSidepanelContext.Provider value={value}>
      {children}
    </OperationsSidepanelContext.Provider>
  );
}

export function useOperationsSidepanel(): OperationsSidepanelContextValue {
  const value = useContext(OperationsSidepanelContext);
  if (!value) {
    throw new Error(
      'useOperationsSidepanel must be used within OperationsSidepanelProvider',
    );
  }
  return value;
}
