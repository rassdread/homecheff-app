'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Award,
  CalendarClock,
  ChevronDown,
  Heart,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Palette,
  Rocket,
  Settings,
  Shield,
  Store,
  User,
} from 'lucide-react';
import {
  ECOSYSTEM_PANEL_HEADING,
  ECOSYSTEM_PRODUCTS,
  ecosystemProductHref,
  type EcosystemProductId,
} from '@/lib/ecosystem-navigation/contract';
import { trackEcosystemProductClick } from '@/lib/ecosystem-navigation/analytics';
import { MY_HOMECHEFF_HUB_PATH } from '@/lib/navigation/my-homecheff-hub';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { NavbarLegalContactLinks } from '@/components/nav/NavbarLegalContactLinks';
import { getDisplayName } from '@/lib/displayName';
import { DEALS_PROFILE_PATH } from '@/lib/profile/deals-navigation';

type Props = {
  currentProduct: EcosystemProductId;
  displayUser: { name?: string | null; username?: string | null; email?: string | null } | null;
  unreadCount: number;
  showAdminLink: boolean;
  adminHref: string;
  rowClassName: string;
  onNavigate: () => void;
  onLogout: () => void | Promise<void>;
  /** When true, hide Berichten (already on bottom nav) */
  hideMessages?: boolean;
  /**
   * Desktop profile dropdown keeps legal/info inline.
   * Mobile hamburger mounts a single canonical NavbarLegalContactLinks below — set false there.
   */
  includeLegalLinks?: boolean;
};

/**
 * Simplified account menu IA:
 * Dashboard | Meer van HomeCheff (submenu) | Account personal | Help | Logout
 * Work modules (verkopen/bezorging/verdiensten/affiliate) live on Dashboard — not top-level.
 */
export default function SimplifiedAccountMenu({
  currentProduct,
  displayUser,
  unreadCount,
  showAdminLink,
  adminHref,
  rowClassName,
  onNavigate,
  onLogout,
  hideMessages = false,
  includeLegalLinks = true,
}: Props) {
  const { t, language } = useTranslation();
  const isNl = language === 'nl';
  const [moreOpen, setMoreOpen] = useState(false);
  const fullName = displayUser ? getDisplayName(displayUser) : '';

  // Ecosystem products for switcher — Affiliate operational hub is on Dashboard
  const switchProducts = ECOSYSTEM_PRODUCTS.filter((p) => p.id !== 'affiliate');

  return (
    <div className="py-1" role="menu">
      {fullName ? (
        <div className="px-4 py-2 border-b border-gray-100 mb-1">
          <p className="text-sm font-semibold text-gray-900 break-words whitespace-normal">{fullName}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {isNl ? 'Ingelogd bij HomeCheff' : 'Signed in to HomeCheff'}
          </p>
        </div>
      ) : null}

      <Link
        href={MY_HOMECHEFF_HUB_PATH}
        prefetch={false}
        className={cn(rowClassName, 'font-semibold text-emerald-900 hover:bg-emerald-50')}
        onClick={onNavigate}
        role="menuitem"
      >
        <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
        <span>{isNl ? 'Dashboard' : 'Dashboard'}</span>
      </Link>

      <div className="border-t border-gray-100 my-1" />

      <button
        type="button"
        className={cn(rowClassName, 'w-full text-left')}
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen((v) => !v)}
      >
        <Store className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">{ECOSYSTEM_PANEL_HEADING}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', moreOpen && 'rotate-180')}
          aria-hidden
        />
      </button>

      {moreOpen ? (
        <div className="pb-1" role="group" aria-label={ECOSYSTEM_PANEL_HEADING}>
          {switchProducts.map((product) => {
            const Icon =
              product.id === 'homecheff' ? Store : product.id === 'studio' ? Palette : Rocket;
            const isCurrent = product.id === currentProduct;
            const href = ecosystemProductHref(product, 'account_menu');
            const label =
              product.id === 'homecheff'
                ? isNl
                  ? 'Marketplace'
                  : 'Marketplace'
                : product.id === 'studio'
                  ? 'Studio'
                  : 'Growth';
            const support =
              product.id === 'homecheff'
                ? isNl
                  ? 'Kopen, verkopen en delen in je buurt'
                  : 'Buy, sell and share locally'
                : product.id === 'studio'
                  ? isNl
                    ? 'Maak content en media'
                    : 'Create content and media'
                  : isNl
                    ? 'Vind en werk met zakelijke leads'
                    : 'Find and work business leads';

            if (isCurrent) {
              return (
                <div
                  key={product.id}
                  className={cn(rowClassName, 'pl-8 cursor-default bg-emerald-50/70 text-emerald-950')}
                  aria-current="page"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-[11px] text-emerald-800/80 font-normal">{support}</span>
                  </span>
                </div>
              );
            }

            return (
              <a
                key={product.id}
                href={href}
                className={cn(rowClassName, 'pl-8')}
                onClick={() => {
                  trackEcosystemProductClick({
                    sourceProduct: currentProduct,
                    targetProduct: product.id,
                    authenticated: true,
                    surface: 'account_menu',
                  });
                  onNavigate();
                }}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-[11px] text-gray-500 font-normal">{support}</span>
                </span>
              </a>
            );
          })}
        </div>
      ) : null}

      <div className="border-t border-gray-100 my-1" />

      <p className="px-4 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {isNl ? 'Account' : 'Account'}
      </p>

      <Link href="/profile" prefetch={false} className={rowClassName} onClick={onNavigate} role="menuitem">
        <User className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('navbar.myProfile') || (isNl ? 'Mijn profiel' : 'My profile')}</span>
      </Link>

      {!hideMessages ? (
        <Link
          href="/messages"
          prefetch={false}
          className={cn(rowClassName, 'relative')}
          onClick={onNavigate}
          role="menuitem"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t('navbar.messages') || (isNl ? 'Berichten' : 'Messages')}</span>
          {unreadCount > 0 ? (
            <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Link>
      ) : null}

      <Link href="/favorites" prefetch={false} className={rowClassName} onClick={onNavigate} role="menuitem">
        <Heart className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('navbar.favorites') || (isNl ? 'Favorieten' : 'Favorites')}</span>
      </Link>

      <Link href="/mijn-hcp" prefetch={false} className={rowClassName} onClick={onNavigate} role="menuitem">
        <Award className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('bottomNav.reputationTab') || (isNl ? 'Reputatie' : 'Reputation')}</span>
      </Link>

      <Link
        href={DEALS_PROFILE_PATH}
        prefetch={false}
        className={rowClassName}
        onClick={onNavigate}
        role="menuitem"
      >
        <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('navbar.agreements') || (isNl ? 'Mijn afspraken' : 'My appointments')}</span>
      </Link>

      <Link href="/settings" prefetch={false} className={rowClassName} onClick={onNavigate} role="menuitem">
        <Settings className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('navbar.settings') || (isNl ? 'Instellingen' : 'Settings')}</span>
      </Link>

      {showAdminLink ? (
        <Link
          href={adminHref}
          prefetch={false}
          className={cn(rowClassName, 'text-violet-700 hover:bg-violet-50')}
          onClick={onNavigate}
          role="menuitem"
        >
          <Shield className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t('navbar.admin') || 'Admin'}</span>
        </Link>
      ) : null}

      <div className="border-t border-gray-100 my-1" />

      {includeLegalLinks ? (
        <NavbarLegalContactLinks variant="dropdown" onNavigate={onNavigate} />
      ) : null}

      {includeLegalLinks ? <div className="border-t border-gray-100 my-1" /> : null}

      <button
        type="button"
        onClick={() => void onLogout()}
        className={cn(rowClassName, 'w-full text-left text-red-600 hover:bg-red-50 min-h-[44px]')}
        role="menuitem"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        <span>{t('navbar.logout') || (isNl ? 'Uitloggen' : 'Log out')}</span>
      </button>
    </div>
  );
}
