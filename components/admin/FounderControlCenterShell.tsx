'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ChevronRight, Menu, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  type AdminDomainId,
  type AdminTabDef,
  type AdminTabId,
  buildAdminTabHref,
  getDomainDefinition,
  getStandaloneRoutesForDomain,
  getTabsForDomain,
  getVisibleDomains,
  STANDALONE_ADMIN_ROUTES,
} from '@/lib/founder-control-center/navigation';

interface FounderControlCenterShellProps {
  activeDomainId: AdminDomainId;
  activeTabId: AdminTabId;
  allowedTabIds: string[];
  isSuperAdmin: boolean;
  onDomainChange: (domainId: AdminDomainId) => void;
  onTabChange: (tabId: AdminTabId) => void;
  mobileNavOpen: boolean;
  onMobileNavToggle: (open: boolean) => void;
  children: React.ReactNode;
}

function label(
  t: (key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t(key);
  return v && v !== key ? v : fallback;
}

export default function FounderControlCenterShell({
  activeDomainId,
  activeTabId,
  allowedTabIds,
  isSuperAdmin,
  onDomainChange,
  onTabChange,
  mobileNavOpen,
  onMobileNavToggle,
  children,
}: FounderControlCenterShellProps) {
  const { t } = useTranslation();

  const visibleDomains = useMemo(
    () => getVisibleDomains(allowedTabIds, isSuperAdmin),
    [allowedTabIds, isSuperAdmin],
  );

  const domainTabs = useMemo(
    () => getTabsForDomain(activeDomainId, allowedTabIds),
    [activeDomainId, allowedTabIds],
  );

  const standaloneInDomain = useMemo(
    () => getStandaloneRoutesForDomain(activeDomainId, isSuperAdmin),
    [activeDomainId, isSuperAdmin],
  );

  const activeTabDef = domainTabs.find((tab) => tab.id === activeTabId);
  const activeDomainDef = getDomainDefinition(activeDomainId);

  const domainSidebar = (
    <nav className="space-y-1" aria-label={label(t, 'admin.fcc.domainsNav', 'Admin domains')}>
      {visibleDomains.map((domain) => {
        const isActive = domain.id === activeDomainId;
        const tabCount = getTabsForDomain(domain.id, allowedTabIds).length;
        const standaloneCount = getStandaloneRoutesForDomain(domain.id, isSuperAdmin).length;
        return (
          <button
            key={domain.id}
            type="button"
            onClick={() => {
              onDomainChange(domain.id);
              onMobileNavToggle(false);
            }}
            className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
              isActive
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'text-gray-700 hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>
                {domain.emoji}
              </span>
              <span className="text-sm font-medium">
                {label(t, domain.labelKey, domain.fallbackLabel)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 pl-7">
              {tabCount + standaloneCount}{' '}
              {label(t, 'admin.fcc.toolsCount', 'tools')}
            </p>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                {label(t, 'admin.fcc.badge', 'Founder Control Center')}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {label(t, 'admin.fcc.title', 'HomeCheff operations')}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5 hidden sm:block">
                {label(t, 'admin.fcc.subtitle', 'Operate the platform from one place')}
              </p>
            </div>
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-600"
              onClick={() => onMobileNavToggle(!mobileNavOpen)}
              aria-label={label(t, 'admin.fcc.toggleNav', 'Toggle navigation')}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav
            className="mt-3 flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500"
            aria-label="Breadcrumb"
          >
            <span className="text-gray-900 font-medium">
              {label(t, 'admin.fcc.badge', 'Founder Control Center')}
            </span>
            {activeDomainDef ? (
              <>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                <span className={activeTabDef ? '' : 'text-gray-900 font-medium'}>
                  {activeDomainDef.emoji}{' '}
                  {label(t, activeDomainDef.labelKey, activeDomainDef.fallbackLabel)}
                </span>
              </>
            ) : null}
            {activeTabDef ? (
              <>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-gray-900 font-medium">
                  {label(t, activeTabDef.labelKey, activeTabDef.fallbackLabel)}
                </span>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 lg:gap-8">
          <aside
            className={`${
              mobileNavOpen ? 'block' : 'hidden'
            } lg:block w-full lg:w-56 flex-shrink-0`}
          >
            <div className="bg-white rounded-xl border shadow-sm p-3 lg:sticky lg:top-28">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-2 mb-2">
                {label(t, 'admin.fcc.domainsNav', 'Domains')}
              </p>
              {domainSidebar}
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-4">
            {activeDomainDef ? (
              <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeDomainDef.emoji}{' '}
                  {label(t, activeDomainDef.labelKey, activeDomainDef.fallbackLabel)}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {label(t, activeDomainDef.descriptionKey, activeDomainDef.fallbackDescription)}
                </p>
              </div>
            ) : null}

            {domainTabs.length > 0 ? (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <nav
                  className="flex flex-wrap gap-1 p-2 border-b bg-gray-50/80"
                  aria-label={label(t, 'admin.fcc.sectionNav', 'Section navigation')}
                >
                  {domainTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeTabId;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-white hover:text-gray-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {label(t, tab.labelKey, tab.fallbackLabel)}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ) : null}

            {standaloneInDomain.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {standaloneInDomain.map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:border-emerald-300 hover:text-emerald-800"
                  >
                    {label(t, route.labelKey, route.fallbackLabel)} →
                  </Link>
                ))}
              </div>
            ) : null}

            <div>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

/** Quick links for command center — all standalone routes. */
export function FounderQuickLinks({
  isSuperAdmin,
  t,
}: {
  isSuperAdmin: boolean;
  t: (key: string) => string;
}) {
  const routes = STANDALONE_ADMIN_ROUTES.filter((r) => !r.superAdminOnly || isSuperAdmin);
  if (routes.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        {label(t, 'admin.fcc.quickLinks', 'Deep tools')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {routes.map((route) => (
          <Link
            key={route.path}
            href={route.path}
            className="text-xs sm:text-sm text-emerald-700 hover:underline"
          >
            {label(t, route.labelKey, route.fallbackLabel)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export type { AdminTabDef };
