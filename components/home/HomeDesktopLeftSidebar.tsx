'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import { FeedFiltersPanel } from '@/components/feed/GeoFeed';
import RoleQuickLinksSection from '@/components/navigation/RoleQuickLinksSection';
import { primaryDashboardContextFromUser } from '@/lib/navigation/primary-dashboard';
import {
  HOME_DESKTOP_ENVIRONMENT_LINKS,
  HOME_DESKTOP_MARKETPLACE_LINKS,
} from '@/lib/home/home-desktop-sidebar-ia';
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

export default function HomeDesktopLeftSidebar() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { requireAuthAction, guestAuthPanel } = useGuestAuthGate();
  const [filtersOpen, setFiltersOpen] = useState(true);

  const ctx = session?.user
    ? primaryDashboardContextFromUser(session.user as Record<string, unknown>)
    : null;

  return (
    <>
      <div className="flex flex-col gap-3 pb-3" data-home-sidebar="left-workspace">
        {session?.user ? (
          <RoleQuickLinksSection
            ctx={ctx}
            surface="home"
            max={5}
            compact
          />
        ) : (
          <SidebarSection title={t('homeDorpsplein.quickActionsTitle')}>
            <button
              type="button"
              onClick={() => requireAuthAction('create', '/sell/new')}
              className="flex w-full items-center gap-3 rounded-xl bg-primary-brand px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors text-left"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {t('homePhase1.ctaShare')}
            </button>
          </SidebarSection>
        )}

        {/* 2. Mijn omgeving */}
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

        {/* 3. Marketplace */}
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

        {/* 4. Discovery filters (collapsible, default open) */}
        <section className="hc-dorpsplein-card overflow-hidden" data-home-sidebar="discovery-filters">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
            aria-expanded={filtersOpen}
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
              <FeedFiltersPanel />
            </div>
          ) : null}
        </section>
      </div>
      {guestAuthPanel}
    </>
  );
}
