'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import {
  FeedFiltersPanel,
  useHasFeedFiltersPanel,
} from '@/components/feed/GeoFeed';
import { useWorkspaceFeedPresentationBridge } from '@/components/adaptive-workspace/WorkspaceFeedPresentationBridge';
import RoleQuickLinksSection from '@/components/navigation/RoleQuickLinksSection';
import { primaryDashboardContextFromUser } from '@/lib/navigation/primary-dashboard';
import {
  HOME_DESKTOP_ENVIRONMENT_LINKS,
  HOME_DESKTOP_MARKETPLACE_LINKS,
} from '@/lib/home/home-desktop-sidebar-ia';
import { subscribePlaceInputFocusRequest } from '@/lib/feed/place-input-focus-request';
import { cn } from '@/lib/utils';

function SidebarSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('hc-dorpsplein-card px-3 py-3', className)}>
      <h3 className="hc-section-title mb-2 text-sm">{title}</h3>
      {children}
    </section>
  );
}

function DiscoveryFiltersSection() {
  const { t } = useTranslation();
  const hasFiltersPanel = useHasFeedFiltersPanel();
  const bridge = useWorkspaceFeedPresentationBridge();
  const railPortalMode = Boolean(bridge?.startRailActive);
  /** Stable setter ref — bridge object identity must not clear the portal host. */
  const setFilterHostRef = useRef(bridge?.setFilterHost);
  setFilterHostRef.current = bridge?.setFilterHost;
  /** Launch-critical: place/postcode field must be reachable without hunting a closed disclosure. */
  const [filtersOpen, setFiltersOpen] = useState(true);

  const bindFilterHost = useCallback((el: HTMLDivElement | null) => {
    setFilterHostRef.current?.(el);
  }, []);

  useEffect(() => {
    if (!railPortalMode) return;
    return () => {
      // Clear only when leaving rail-portal mode / unmount — not on bridge identity churn.
      setFilterHostRef.current?.(null);
    };
  }, [railPortalMode]);

  useEffect(() => {
    if (railPortalMode) {
      return subscribePlaceInputFocusRequest(() => {
        const host = document.querySelector<HTMLElement>(
          '[data-wx-filter-portal-host]',
        );
        host?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const rail = host?.closest('aside, [data-home-sidebar="left-workspace"]');
        if (rail instanceof HTMLElement) {
          const place = rail.querySelector<HTMLElement>(
            '#feed-sidebar-place-input, [data-testid="feed-place-input"]',
          );
          place?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
    return subscribePlaceInputFocusRequest(() => {
      setFiltersOpen(true);
    });
  }, [railPortalMode]);

  if (!hasFiltersPanel) return null;

  /** WX 1C: when start rail owns filters, keep them persistently visible (no hollow collapse). */
  if (railPortalMode) {
    return (
      <section
        className="hc-dorpsplein-card overflow-hidden"
        data-home-sidebar="discovery-filters"
        data-wx-rail-filters="1"
      >
        <div className="px-3 py-3">
          <h3 className="hc-section-title text-sm">
            {t('feed.discoverFiltersHeading')}
          </h3>
        </div>
        <div className="border-t border-gray-100 px-1 pb-2 pt-1">
          <div
            ref={bindFilterHost}
            data-wx-filter-portal-host=""
            className="min-w-0"
          />
        </div>
      </section>
    );
  }

  return (
    <section
      className="hc-dorpsplein-card overflow-hidden"
      data-home-sidebar="discovery-filters"
      data-hc-filters-open={filtersOpen ? '1' : '0'}
    >
      <button
        type="button"
        onClick={() => setFiltersOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
        aria-expanded={filtersOpen}
        data-testid="discovery-filters-toggle"
      >
        <span className="hc-section-title text-sm">{t('feed.discoverFiltersHeading')}</span>
        {filtersOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        )}
      </button>
      {filtersOpen ? (
        <div className="border-t border-gray-100 px-1 pb-2 pt-1">
          <p className="mx-2 mb-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-2.5 py-2 text-[11px] font-medium leading-snug text-emerald-900">
            {t('marketplace.discovery.usp.tagline')}
          </p>
          <FeedFiltersPanel />
        </div>
      ) : null}
    </section>
  );
}

export default function HomeDesktopLeftSidebar() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { requireAuthAction, guestAuthPanel } = useGuestAuthGate();

  const ctx = session?.user
    ? primaryDashboardContextFromUser(session.user as Record<string, unknown>)
    : null;

  return (
    <>
      <div className="flex flex-col gap-2.5 pb-2" data-home-sidebar="left-workspace">
        {session?.user ? (
          <RoleQuickLinksSection
            ctx={ctx}
            surface="home"
            max={5}
            compact
          />
        ) : (
          <SidebarSection title={t('homeDorpsplein.quickActionsTitle')}>
            {/* WX 1C.1 — secondary shortcut only; NavBar owns the primary Create CTA. */}
            <button
              type="button"
              data-wx-create-secondary=""
              onClick={() => requireAuthAction('create', '/sell/new')}
              className="flex w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50 transition-colors text-left overflow-visible"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 whitespace-normal leading-snug">{t('homePhase1.ctaShare')}</span>
            </button>
          </SidebarSection>
        )}

        {session?.user ? (
          <SidebarSection title={t('home.desktop.myEnvironmentTitle')}>
            <nav className="grid gap-1" aria-label={t('home.desktop.myEnvironmentTitle')}>
              {HOME_DESKTOP_ENVIRONMENT_LINKS.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50/60 hover:text-primary-brand transition-colors"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </SidebarSection>
        ) : null}

        <SidebarSection title={t('home.desktop.marketplaceNavTitle')}>
          <nav className="grid gap-1" aria-label={t('home.desktop.marketplaceNavTitle')}>
            {HOME_DESKTOP_MARKETPLACE_LINKS.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50/60 hover:text-primary-brand transition-colors"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </SidebarSection>

        <DiscoveryFiltersSection />
      </div>
      {guestAuthPanel}
    </>
  );
}
