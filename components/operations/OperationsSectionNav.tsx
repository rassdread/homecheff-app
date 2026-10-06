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
              prefetch={false}
              role="tab"
              aria-selected={active}
              onClick={(event) => {
                event.preventDefault();
                window.location.assign(tab.href);
              }}
              className={cn(
                'inline-flex min-h-[44px] shrink-0 snap-start touch-manipulation items-center whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition sm:px-4',
                active
                  ? 'hc-nav-selected'
                  : 'hc-nav-item',
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
