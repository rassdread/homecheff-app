'use client';

import RoleQuickLinksSection from '@/components/navigation/RoleQuickLinksSection';
import { useOperationsSidepanel } from '@/components/operations/OperationsSidepanelProvider';

/** @deprecated Use RoleQuickLinksSection directly — kept for imports. */
export default function OperationsQuickActions() {
  const { ctx, activeSection, loading } = useOperationsSidepanel();

  if (loading) {
    return (
      <section className="hc-dorpsplein-card animate-pulse px-3 py-3">
        <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <RoleQuickLinksSection
      ctx={ctx}
      surface="operations"
      operationsSection={activeSection}
      max={4}
    />
  );
}
