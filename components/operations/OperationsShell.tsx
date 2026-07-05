'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutPanelLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import OperationsSectionNav from '@/components/operations/OperationsSectionNav';
import OperationsSidepanel from '@/components/operations/OperationsSidepanel';
import OperationsInlineStrip from '@/components/operations/OperationsInlineStrip';
import OperationsOverviewDrawer from '@/components/operations/OperationsOverviewDrawer';
import { OperationsSidepanelProvider } from '@/components/operations/OperationsSidepanelProvider';
import { useOperationsContext } from '@/components/operations/useOperationsContext';
import { isBottomNavigationHidden } from '@/lib/bottomNavRoutes';
import { cn } from '@/lib/utils';

export type OperationsShellProps = {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  breadcrumbLabel?: string;
  quickActions?: ReactNode;
  headerEnd?: ReactNode;
  /** Override auto sidepanel; pass null to hide */
  rightSlot?: ReactNode | null;
  contentClassName?: string;
  hideSectionNav?: boolean;
  fullBleed?: boolean;
  /** Disable sidepanel entirely on this page */
  hideSidepanel?: boolean;
};

function useSidepanelEnabled(hideSidepanel: boolean): boolean {
  const pathname = usePathname();
  const { entry } = useOperationsContext();

  return useMemo(() => {
    if (hideSidepanel) return false;
    if (!entry.hasOperationsAccess) return false;
    if (pathname?.startsWith('/admin')) return false;
    return true;
  }, [hideSidepanel, entry.hasOperationsAccess, pathname]);
}

export default function OperationsShell({
  children,
  pageTitle,
  pageSubtitle,
  breadcrumbLabel,
  quickActions,
  headerEnd,
  rightSlot,
  contentClassName,
  hideSectionNav = false,
  fullBleed = false,
  hideSidepanel = false,
}: OperationsShellProps) {
  const { tOr } = useTranslation();
  const pathname = usePathname();
  const bottomNavHidden = isBottomNavigationHidden(pathname);
  const sidepanelEnabled = useSidepanelEnabled(hideSidepanel);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewVariant, setOverviewVariant] = useState<'drawer' | 'sheet'>(
    'drawer',
  );

  const showPageHeader =
    Boolean(pageTitle) ||
    Boolean(pageSubtitle) ||
    Boolean(quickActions) ||
    Boolean(headerEnd);

  const overviewLabel = tOr(
    'operations.sidepanel.overview',
    'Overview',
    'Overzicht',
  );

  const resolvedRightSlot =
    rightSlot === null
      ? null
      : rightSlot ?? (sidepanelEnabled ? <OperationsSidepanel /> : null);

  const openOverview = (variant: 'drawer' | 'sheet') => {
    setOverviewVariant(variant);
    setOverviewOpen(true);
  };

  return (
    <OperationsSidepanelProvider enabled={sidepanelEnabled}>
      <div className="hc-operations-page min-h-screen">
        <div
          className={cn(
            'hc-operations-shell mx-auto w-full max-w-7xl',
            !fullBleed &&
              !bottomNavHidden &&
              'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]',
            fullBleed && 'pb-[env(safe-area-inset-bottom,0px)]',
          )}
        >
          <header
            className="hc-operations-shell-header sticky z-20 border-b border-gray-200/80 bg-[#faf8f4]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#faf8f4]/90"
            style={{
              top: 'max(3.5rem, calc(env(safe-area-inset-top, 0px) + 3rem))',
            }}
          >
            <div className="px-4 pt-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {tOr('operations.workspaceLabel', 'Operations', 'Operations')}
                  </span>
                  {breadcrumbLabel ? (
                    <>
                      <span className="text-xs text-gray-400" aria-hidden>
                        ›
                      </span>
                      <span className="truncate text-xs font-medium text-gray-600">
                        {breadcrumbLabel}
                      </span>
                    </>
                  ) : null}
                </div>

                {sidepanelEnabled ? (
                  <button
                    type="button"
                    onClick={() => openOverview('drawer')}
                    className="hidden min-h-[36px] items-center gap-1.5 rounded-xl border border-emerald-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 sm:inline-flex lg:hidden"
                  >
                    <LayoutPanelLeft className="h-3.5 w-3.5" aria-hidden />
                    {overviewLabel}
                  </button>
                ) : null}
              </div>

              {!hideSectionNav ? (
                <div className="mt-2 pb-3">
                  <OperationsSectionNav />
                </div>
              ) : null}
            </div>
          </header>

          <div className="flex w-full">
            <div className="min-w-0 flex-1">
              {showPageHeader ? (
                <div className="border-b border-gray-200/60 bg-white/70 px-4 py-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {pageTitle ? (
                        <h1 className="hc-section-title text-xl font-bold text-gray-900 sm:text-2xl">
                          {pageTitle}
                        </h1>
                      ) : null}
                      {pageSubtitle ? (
                        <p className="mt-1 text-sm text-gray-600 sm:text-base">
                          {pageSubtitle}
                        </p>
                      ) : null}
                    </div>
                    {(quickActions || headerEnd) && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {quickActions}
                        {headerEnd}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div
                className={cn(
                  'px-4 py-6 sm:px-6 lg:px-8',
                  contentClassName,
                )}
              >
                {sidepanelEnabled ? (
                  <div className="mb-4 sm:hidden">
                    <OperationsInlineStrip
                      onOpenOverview={() => openOverview('sheet')}
                    />
                  </div>
                ) : null}
                {children}
              </div>
            </div>

            {resolvedRightSlot ? (
              <aside className="hidden w-[min(360px,100%)] shrink-0 border-l border-gray-200/80 lg:block">
                {resolvedRightSlot}
              </aside>
            ) : null}
          </div>
        </div>

        {sidepanelEnabled ? (
          <OperationsOverviewDrawer
            open={overviewOpen}
            onClose={() => setOverviewOpen(false)}
            variant={overviewVariant}
          />
        ) : null}
      </div>
    </OperationsSidepanelProvider>
  );
}
