'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  listVisibleOperationsTabs,
  resolveActiveOperationsTab,
} from '@/lib/operations/operations-tabs';
import { useOperationsContext } from '@/components/operations/useOperationsContext';
import { cn } from '@/lib/utils';

export default function OperationsSectionNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { ctx } = useOperationsContext();

  if (!ctx) return null;

  const tabs = listVisibleOperationsTabs(ctx);
  const activeTab = resolveActiveOperationsTab(pathname);

  if (tabs.length === 0) return null;

  return (
    <nav
      className="hc-operations-section-nav"
      aria-label={t('operations.sectionNavLabel')}
    >
      <div
        className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        role="tablist"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch
              role="tab"
              aria-selected={active}
              className={cn(
                'shrink-0 snap-start whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition touch-manipulation sm:px-4',
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-emerald-50/80 hover:text-gray-900',
              )}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
