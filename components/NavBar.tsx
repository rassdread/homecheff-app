'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import SafeImage from '@/components/ui/SafeImage';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import type { EcosystemProductId } from '@/lib/ecosystem-navigation/contract';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { Home, User, LogOut, Menu, X, HelpCircle, ShoppingCart, ChevronDown, MessageCircle, Shield, Heart, Info, Smartphone, Download, Plus, Award, CalendarClock, Bell, Briefcase } from 'lucide-react';
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import CartIcon from '@/components/cart/CartIcon';
import NotificationBell from '@/components/notifications/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { setCartUserId, clearAllCartData } from '@/lib/cart';
import { validateAndCleanSession, setupSessionIsolation, performLogout } from '@/lib/session-cleanup';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserBootstrap } from '@/components/user/UserBootstrapProvider';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { devBadgeLog } from '@/lib/devBadgeLog';
import { cn } from '@/lib/utils';
import { navDebug } from '@/lib/nav-debug';
import { useAppUpdateStatus } from '@/components/app/AppUpdateStatusProvider';
import {
  ADMIN_WORKSPACE_HREF,
  userHasAdminWorkspace,
} from '@/lib/navigation/primary-dashboard';
import { NavbarLegalContactLinks } from '@/components/nav/NavbarLegalContactLinks';
import { OntdekHomeCheffMenu } from '@/components/ecosystem/OntdekHomeCheffMenu';
import { useCommsUnread } from '@/hooks/useCommsUnread';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import { useLandscapeWorkPosture } from '@/components/adaptive-workspace/WorkspaceChromeProvider';
import { DEALS_PROFILE_PATH } from '@/lib/profile/deals-navigation';
import { MY_HOMECHEFF_HUB_PATH } from '@/lib/navigation/my-homecheff-hub';
import {
  careersPath,
  PUBLIC_CAREERS_NAV_TESTID,
  PUBLIC_EARN_CHILD_LINKS,
} from '@/lib/navigation/public-careers-nav';
import SimplifiedAccountMenu from '@/components/navigation/SimplifiedAccountMenu';
import {
  NAVBAR_CLOSE_MENU_EVENT,
  NAVBAR_TOGGLE_MENU_EVENT,
  publishNavbarMobileMenuOpen,
} from '@/lib/nav/navbar-command-bus';
import { useOverlayHistoryBack } from '@/hooks/useOverlayHistoryBack';

export default function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const ecosystemCurrentProduct: EcosystemProductId =
    pathname?.startsWith('/affiliate') || pathname?.startsWith('/verdiensten')
      ? 'affiliate'
      : 'homecheff';
  const { t, language } = useTranslation();
  const careersHref = careersPath('hub', language);
  const appUpdateStatus = useAppUpdateStatus();
  const { profile: bootstrapProfile, ensureProfile } = useUserBootstrap();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { count: unreadCount } = useCommsUnread(status === 'authenticated');
  const { openCreateFlow } = useCreateFlow();
  const { requireAuthAction, guestAuthPanel } = useGuestAuthGate();
  const landscapeWork = useLandscapeWorkPosture();
  /** Short mobile landscape only — never compact tall/desktop landscape chrome. */
  const shortLandscapeChrome = landscapeWork.shortChromeCompact;
  /**
   * WX 1B.4.1 — homepage short landscape: suppress white navbar layout height.
   * Listing/profile keep a usable navbar. Menu panel stays mounted via overlay.
   */
  const suppressNavbarChrome =
    shortLandscapeChrome && (pathname === '/' || pathname === '');
  /** WX 1C.1 — when bottom nav collapses, Create must remain in command chrome. */
  const showLandscapeCreate =
    landscapeWork.bottomNavCollapsed && !suppressNavbarChrome;
  /** Portrait/tablet: bottom tabs cover primary destinations — avoid duplicating them in the drawer. */
  const bottomNavReachable = !landscapeWork.bottomNavCollapsed;
  const [sellerOrdersUnread, setSellerOrdersUnread] = useState(0);
  const [userProfile, setUserProfile] = useState<{ image?: string; profileImage?: string; name?: string; username?: string } | null>(null);
  const hasFetchedProfileRef = useRef(false);
  const DROPDOWN_WIDTH = 280;
  const DROPDOWN_MARGIN = 16;
  const [dropdownPosition, setDropdownPosition] = useState({ top: 56, right: 16, openAbove: false });
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);
  const { totalItems: cartItemCount } = useCart();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Eigen portal-container (div in body) zodat createPortal altijd een geldig DOM-element krijgt
  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return;
    const el = document.createElement('div');
    el.id = 'navbar-dropdown-portal-root';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    portalContainerRef.current = el;
    setPortalContainer(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
      portalContainerRef.current = null;
    };
  }, []);

  /** WX 1B.4: Escape closes below-xl hamburger (landscape path preservation). */
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  /** WX 1B.4.1 — work bar menu toggles the same NavBar mobile menu owner. */
  useEffect(() => {
    const onToggle = () => setIsMobileMenuOpen((open) => !open);
    const onClose = () => setIsMobileMenuOpen(false);
    window.addEventListener(NAVBAR_TOGGLE_MENU_EVENT, onToggle);
    window.addEventListener(NAVBAR_CLOSE_MENU_EVENT, onClose);
    return () => {
      window.removeEventListener(NAVBAR_TOGGLE_MENU_EVENT, onToggle);
      window.removeEventListener(NAVBAR_CLOSE_MENU_EVENT, onClose);
    };
  }, []);

  useEffect(() => {
    publishNavbarMobileMenuOpen(isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  useOverlayHistoryBack('navbar-mobile-menu', isMobileMenuOpen, () => {
    setIsMobileMenuOpen(false);
  });

  /** Keep keyboard focus inside the scrollport on short viewports. */
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const el = document.getElementById('navbar-mobile-menu');
    if (!el) return;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };
    el.addEventListener('focusin', onFocusIn);
    return () => el.removeEventListener('focusin', onFocusIn);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const root = document.documentElement;
    if (suppressNavbarChrome) {
      root.dataset.wxNavbarSuppressed = '1';
    } else {
      delete root.dataset.wxNavbarSuppressed;
    }
    return () => {
      delete root.dataset.wxNavbarSuppressed;
    };
  }, [suppressNavbarChrome]);

  /** Close overlay menu when leaving homepage short-landscape suppression. */
  useEffect(() => {
    if (!suppressNavbarChrome) return;
    return () => setIsMobileMenuOpen(false);
  }, [suppressNavbarChrome]);

  const nativeShell = useIsNativeAppMounted();
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  /** Geen geneste <Link><Button> — één klikbaar element voor WebView/touch. */
  const mobileNavRowClass = cn(
    'inline-flex w-full min-h-[44px] items-center justify-start gap-2 rounded-2xl px-3 py-3 text-base font-medium',
    'text-gray-700 transition-colors hover:bg-gray-50 touch-manipulation select-none',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand'
  );

  /** Desktop top-nav: denser lg–xl so labels never clip (WX 1A.1 / WDL P6). */
  const desktopNavGhostClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-xl font-medium transition-all duration-200',
    'gap-1 px-1.5 py-2 text-[13px] leading-none',
    'xl:gap-1.5 xl:px-2.5 xl:py-2.5 xl:text-sm',
    '2xl:gap-2 2xl:px-3',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
    'bg-transparent text-primary-brand hover:bg-primary-50 hover:shadow-sm touch-manipulation select-none whitespace-nowrap'
  );
  /** Icons cost ~20px each; hide below xl so Dutch labels stay fully readable at lg. */
  const desktopNavIconClass = 'hidden xl:inline-block w-4 h-4 shrink-0';

  /** Guest auth CTAs — altijd zichtbaar; denser at lg so primary nav labels stay readable. */
  const guestAuthLoginClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-xl font-medium transition-colors touch-manipulation no-underline whitespace-nowrap',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
    'bg-transparent text-gray-700 hover:bg-primary-50 hover:text-primary-brand',
    'min-h-[40px] px-2.5 py-2 text-xs min-[400px]:px-3 min-[400px]:text-sm',
    'sm:min-h-[44px] sm:px-3.5 sm:py-2.5 sm:text-sm',
    'lg:rounded-xl lg:px-2.5 lg:py-2 lg:text-[13px] lg:min-h-0',
    'xl:rounded-2xl xl:px-4 xl:py-2.5 xl:text-sm',
  );
  const guestAuthRegisterClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-all touch-manipulation no-underline whitespace-nowrap',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
    'bg-primary-brand text-white hover:bg-primary-700',
    'shadow-sm hover:shadow-md',
    'xl:shadow-lg xl:hover:shadow-xl xl:hover:-translate-y-0.5',
    'min-h-[40px] px-2.5 py-2 text-xs min-[400px]:px-3 min-[400px]:text-sm',
    'sm:min-h-[44px] sm:px-3.5 sm:py-2.5 sm:text-sm',
    'lg:rounded-xl lg:px-2.5 lg:py-2 lg:text-[13px] lg:min-h-0',
    'xl:rounded-2xl xl:px-4 xl:py-2.5 xl:text-sm',
  );

  const user =
    session && 'user' in session
      ? (session.user as typeof session['user'] & { image?: string })
      : undefined;

  const handleMobileCreate = useCallback(() => {
    closeMobileMenu();
    if (user) {
      openCreateFlow();
    } else {
      requireAuthAction('create', '/sell/new');
    }
    navDebug('navbar:mobile', { action: 'create' });
  }, [closeMobileMenu, openCreateFlow, requireAuthAction, user]);

  const navMenuUser = user
    ? ({ ...(user as Record<string, unknown>), ...(bootstrapProfile ?? {}) } as Record<string, unknown>)
    : null;
  const showAdminLink = userHasAdminWorkspace(navMenuUser);

  // Bereken dropdown-positie binnen viewport (niet buiten beeld)
  const updateDropdownPosition = () => {
    if (profileButtonRef.current && typeof window !== 'undefined') {
      const rect = profileButtonRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768;
      // Geschatte hoogte dropdown (menu-items + padding)
      const estimatedHeight = 420;
      const gap = 8;

      if (isMobile) {
        setDropdownPosition({ top: 56, right: 16, openAbove: false });
        return;
      }

      // Horizontaal: rechterrand dropdown = rechterrand knop, maar binnen viewport
      let right = vw - rect.right;
      const leftEdge = vw - right - DROPDOWN_WIDTH;
      if (leftEdge < DROPDOWN_MARGIN) {
        right = vw - DROPDOWN_MARGIN - DROPDOWN_WIDTH;
      }
      if (right < DROPDOWN_MARGIN) {
        right = DROPDOWN_MARGIN;
      }

      // Verticaal: onder knop, tenzij dat buiten beeld valt → dan boven knop
      let top = rect.bottom + gap;
      const openAbove = top + estimatedHeight > vh - DROPDOWN_MARGIN;
      if (openAbove) {
        top = rect.top - gap - estimatedHeight;
        if (top < DROPDOWN_MARGIN) top = DROPDOWN_MARGIN;
      } else if (top < DROPDOWN_MARGIN) {
        top = DROPDOWN_MARGIN;
      }

      setDropdownPosition({ top, right, openAbove });
    }
  };
  useLayoutEffect(() => {
    if (isProfileDropdownOpen) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition, true);
      };
    }
  }, [isProfileDropdownOpen]);

  // Close dropdown when clicking outside (button of portaled menu)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isButton = profileButtonRef.current?.contains(target);
      const isInsideMenu = dropdownMenuRef.current?.contains(target);
      if (!isButton && !isInsideMenu) {
        setIsProfileDropdownOpen(false);
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [isProfileDropdownOpen]);

  // Fetch user profile data on demand (e.g. dropdown open), not during first paint.
  const fetchUserProfile = useCallback(async () => {
    const data = await ensureProfile();
    if (data) {
      setUserProfile(data);
      hasFetchedProfileRef.current = true;
    }
  }, [ensureProfile]);

  // Verkoper order-meldingen (orange badge bij verkoper-dashboardlink)
  const fetchSellerOrdersUnread = useCallback(async (source: string = 'unknown') => {
    if (!session?.user?.email) return;

    const u = user as Record<string, unknown> | undefined;
    const roles = u?.sellerRoles as unknown[] | undefined;
    const isSeller =
      (Array.isArray(roles) && roles.length > 0) ||
      u?.role === 'SELLER' ||
      ((u?.role === 'ADMIN' || u?.role === 'SUPERADMIN') &&
        Array.isArray(roles) &&
        roles.length > 0);
    if (!isSeller) {
      setSellerOrdersUnread(0);
      devBadgeLog({
        messagesUnreadCount: unreadCount,
        notificationsUnreadCount: undefined,
        sellerOrderBadgeCount: 0,
        source: `${source}:seller:—`,
      });
      return;
    }
    try {
      const res = await fetch('/api/notifications/orders', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        const sellerUnread =
          typeof data.sellerUnreadCount === 'number' ? data.sellerUnreadCount : 0;
        setSellerOrdersUnread(sellerUnread);
        devBadgeLog({
          messagesUnreadCount: unreadCount,
          notificationsUnreadCount: undefined,
          sellerOrderBadgeCount: sellerUnread,
          source: `${source}:seller:/api/notifications/orders`,
        });
      }
    } catch {
      /* silent */
    }
  }, [session?.user?.email, user, unreadCount]);

  // Sync cart with user ID for isolation and validate session
  useEffect(() => {
    // Debug session state

    // Setup session isolation to prevent data leakage
    setupSessionIsolation();
    
    // Validate session integrity
    validateAndCleanSession();

    if (session?.user?.email) {
      setCartUserId(session.user.email);
      void fetchSellerOrdersUnread('session-change');
    } else {
      setCartUserId(null);
      setSellerOrdersUnread(0);
      setUserProfile(null);
      hasFetchedProfileRef.current = false;
    }
  }, [session, status, user, fetchSellerOrdersUnread]);

  useEffect(() => {
    if (bootstrapProfile) {
      setUserProfile(bootstrapProfile);
      hasFetchedProfileRef.current = true;
    }
  }, [bootstrapProfile]);

  useEffect(() => {
    if (isProfileDropdownOpen && !hasFetchedProfileRef.current) {
      fetchUserProfile();
    }
  }, [isProfileDropdownOpen, fetchUserProfile]);

  const handleLogout = async () => {
    // performLogout() doet: lokale cleanup → POST /api/auth/force-logout (wist alle cookie-varianten
    // server-side, incl. host-only, .homecheff.eu, __Secure-/__Host- prefixes en chunked .0/.1) →
    // NextAuth signOut zonder redirect → hard navigation. Dit lost het Safari-probleem op waarbij
    // het oude sessie-cookie bleef staan na een gewone signOut.
    await performLogout('/');
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const onNotif = () => void fetchSellerOrdersUnread('notificationsUpdated');
    const onFocus = () => void fetchSellerOrdersUnread('focus');
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchSellerOrdersUnread('visibilitychange');
      }
    };
    const onPageShow = (event: PageTransitionEvent) =>
      void fetchSellerOrdersUnread(event.persisted ? 'pageshow:bfcache' : 'pageshow');
    try {
      window.addEventListener('notificationsUpdated', onNotif);
      window.addEventListener('focus', onFocus);
      window.addEventListener('pageshow', onPageShow);
      document.addEventListener('visibilitychange', onVisibility);
    } catch (e) {
      console.warn('[NavBar] seller badge listeners attach failed', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return () => {
      try {
        window.removeEventListener('notificationsUpdated', onNotif);
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('pageshow', onPageShow);
        document.removeEventListener('visibilitychange', onVisibility);
      } catch {
        /* ignore */
      }
    };
  }, [fetchSellerOrdersUnread]);

  return (
    <header
      data-wx-navbar=""
      data-wx-short-landscape={shortLandscapeChrome ? '1' : '0'}
      data-wx-navbar-suppressed={suppressNavbarChrome ? '1' : '0'}
      className={cn(
        'w-full max-w-[100vw] overflow-x-clip border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm lg:sticky lg:top-0 z-[100] border-gray-200 dark:border-gray-800',
        nativeShell ? 'pt-[env(safe-area-inset-top,0px)]' : '',
        suppressNavbarChrome &&
          'h-0 min-h-0 overflow-visible border-0 p-0 shadow-none bg-transparent backdrop-blur-none',
        // Escape feed/workspace paint order while the landscape panel is open.
        suppressNavbarChrome && isMobileMenuOpen && '!z-[300]',
      )}
    >
      <div
        data-wx-navbar-row=""
        className={cn(
          'max-w-7xl 2xl:max-w-screen-2xl mx-auto relative min-w-0',
          shortLandscapeChrome ? 'px-2.5 sm:px-3' : 'px-3 sm:px-5 lg:px-6 xl:px-8',
          suppressNavbarChrome && 'hidden',
        )}
        aria-hidden={suppressNavbarChrome}
      >
        <div
          className={cn(
            'flex items-center justify-between min-w-0 gap-1 sm:gap-2 overflow-hidden',
            shortLandscapeChrome ? 'h-12' : 'h-16',
          )}
        >
          {/* Logo — icoon tot xl, volledig merk xl+; never steal nav label space */}
          <div className="flex shrink-0 items-center min-w-0">
            <div className="xl:hidden">
              <Logo size={shortLandscapeChrome ? 'sm' : 'md'} showText={false} />
            </div>
            <div className="hidden xl:block">
              <Logo size="md" />
            </div>
          </div>

          {/* Desktop Navigation — WX 1A.1: shrink-0 cluster; never flex-shrink/clip labels */}
          <nav
            data-wx-desktop-nav=""
            className="hidden xl:flex items-center gap-0.5 xl:gap-1 shrink-0 overflow-visible"
          >
            <Link
              href="/"
              prefetch={false}
              className={desktopNavGhostClass}
              onClick={() => navDebug('navbar:desktop', { href: '/' })}
            >
              <Home className={desktopNavIconClass} aria-hidden />
              <span className="whitespace-nowrap">{t('navbar.home')}</span>
            </Link>
            <Link
              href={careersHref}
              prefetch={false}
              data-hc-public-careers-nav=""
              data-testid={PUBLIC_CAREERS_NAV_TESTID}
              className={desktopNavGhostClass}
              onClick={() => navDebug('navbar:desktop', { href: careersHref })}
            >
              <Briefcase className={desktopNavIconClass} aria-hidden />
              <span className="whitespace-nowrap">{t('navbar.werkenBij')}</span>
            </Link>
            {/* Account destinations only exist for signed-in users; guests get Inloggen/Aanmelden. */}
            {user ? (
              <Link
                href={MY_HOMECHEFF_HUB_PATH}
                prefetch={false}
                data-wx-desktop-account-nav="hub"
                className={desktopNavGhostClass}
                onClick={() => navDebug('navbar:desktop', { href: MY_HOMECHEFF_HUB_PATH })}
              >
                <User className={desktopNavIconClass} aria-hidden />
                <span className="whitespace-nowrap">{t('myHomeCheffHub.nav.hubShort')}</span>
              </Link>
            ) : null}

            {/* xl+ desktop: replaces bottom nav tabs (tablet keeps bottom nav until xl). */}
            <div className="hidden xl:flex items-center gap-0.5 shrink-0">
              {user ? (
                <>
                  <Link
                    href="/messages"
                    prefetch={false}
                    data-wx-desktop-account-nav="messages"
                    className={cn(desktopNavGhostClass, 'relative')}
                    onClick={() => navDebug('navbar:desktop', { href: '/messages' })}
                  >
                    <MessageCircle className={desktopNavIconClass} aria-hidden />
                    <span className="whitespace-nowrap">{t('navbar.messages')}</span>
                    {unreadCount > 0 ? (
                      <span className="absolute -top-0.5 right-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                  <Link
                    href="/mijn-hcp"
                    prefetch={false}
                    data-wx-desktop-account-nav="reputation"
                    className={desktopNavGhostClass}
                    onClick={() => navDebug('navbar:desktop', { href: '/mijn-hcp' })}
                  >
                    <Award className={desktopNavIconClass} aria-hidden />
                    <span className="whitespace-nowrap">{t('bottomNav.reputationTab')}</span>
                  </Link>
                </>
              ) : null}
              {/* WX 1A.1 / WDL P6 — primary action; never truncate */}
              <button
                type="button"
                data-wx-primary-action=""
                className={cn(
                  'inline-flex shrink-0 items-center justify-center gap-1',
                  'rounded-xl px-2.5 py-2 xl:gap-1.5 xl:px-3.5 xl:py-2.5',
                  'text-[13px] xl:text-sm font-bold whitespace-nowrap leading-none',
                  'bg-primary-brand text-white hover:bg-primary-700',
                  'shadow-sm hover:shadow-md',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
                  'touch-manipulation select-none',
                )}
                onClick={() => {
                  if (user) {
                    openCreateFlow();
                  } else {
                    requireAuthAction('create', '/sell/new');
                  }
                  navDebug('navbar:desktop', { action: 'create' });
                }}
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{t('homePhase1.ctaShare')}</span>
              </button>
            </div>
          </nav>

          {/* Rechtercluster: utility (taal, Ontdek) then auth/profile; hamburger < xl */}
          <div
            data-wx-header-utility=""
            className="ml-auto flex items-center justify-end gap-1 sm:gap-1.5 shrink-0 pl-1 min-w-0 overflow-x-clip"
          >
            {/* WX 1C.1 P0 — Landscape Create invariant (xl+ already has desktop primary). */}
            {showLandscapeCreate ? (
              <button
                type="button"
                data-wx-primary-action=""
                data-wx-landscape-create=""
                className={cn(
                  'xl:hidden inline-flex shrink-0 items-center justify-center gap-1',
                  shortLandscapeChrome
                    ? 'rounded-lg px-2 py-1.5 min-h-[36px] text-xs'
                    : 'rounded-xl px-2.5 py-2 min-h-[40px] text-[13px]',
                  'font-bold whitespace-nowrap leading-none',
                  'bg-primary-brand text-white hover:bg-primary-700',
                  'shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-brand',
                  'touch-manipulation select-none',
                )}
                onClick={() => {
                  if (user) {
                    openCreateFlow();
                  } else {
                    requireAuthAction('create', '/sell/new');
                  }
                  navDebug('navbar:landscape-create', { action: 'create' });
                }}
                aria-label={t('homePhase1.ctaShare')}
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden />
                <span className="hidden min-[380px]:inline whitespace-nowrap">
                  {t('homePhase1.ctaShare')}
                </span>
              </button>
            ) : null}
            <div className="hidden xl:block shrink-0" data-wx-header-language="">
              <LanguageSwitcher compact />
            </div>
            {/* Ecosystem discovery — only from 2xl, where the widened row leaves room next to auth. */}
            <div className="hidden 2xl:block shrink-0">
              <OntdekHomeCheffMenu
                currentProduct={ecosystemCurrentProduct}
                authenticated={status === 'authenticated'}
                surface="header"
                variant="compact"
                showCurrentModule={false}
              />
            </div>
            {status === 'loading' && !user ? (
              <div
                className="hidden xl:flex shrink-0 items-center gap-2"
                aria-busy="true"
                aria-label="Sessie laden"
              >
                <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
              </div>
            ) : null}
            {status === 'unauthenticated' && !user && (
              <>
                <Link
                  href="/login"
                  prefetch={false}
                  className={guestAuthLoginClass}
                  onClick={() => navDebug('navbar:auth-cta', { href: '/login' })}
                >
                  {t('navbar.login')}
                </Link>
                <Link
                  href="/register"
                  prefetch={false}
                  className={guestAuthRegisterClass}
                  onClick={() => navDebug('navbar:auth-cta', { href: '/register' })}
                >
                  {t('navbar.register')}
                </Link>
              </>
            )}

            {user && (
              <div className="hidden xl:flex items-center flex-shrink-0 min-w-0 gap-1">
                <CartIcon />
                <div className="relative z-[110] shrink-0">
                  <NotificationBell />
                </div>

                {/* Profile Dropdown */}
                <div className="relative z-[100] min-w-0" ref={profileDropdownRef}>
                  <button
                    ref={profileButtonRef}
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 min-w-0 max-w-full"
                  >
                    {(userProfile?.profileImage || userProfile?.image || user?.image) ? (
                      <SafeImage
                        src={userProfile?.profileImage || userProfile?.image || user?.image || ''}
                        alt={t("navbar.profileImage")}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-primary-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-brand" />
                      </div>
                    )}
                    {/* Avatar-only in header chrome — never clip a half-visible username.
                        Full name is shown inside the account menu. */}
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isProfileDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* Dropdown Menu – via portal zodat overflow header geen invloed heeft */}
                  {portalContainer && isProfileDropdownOpen && createPortal(
                    <div 
                      ref={dropdownMenuRef}
                      className={`pointer-events-auto fixed w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 overflow-y-auto z-[99999] ${
                        dropdownPosition.openAbove 
                          ? 'animate-in slide-in-from-bottom-2 duration-200' 
                          : 'animate-in slide-in-from-top-2 duration-200'
                      }`}
                      style={{
                        top: typeof window !== 'undefined' && window.innerWidth < 768 ? 56 : dropdownPosition.top,
                        right: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : dropdownPosition.right,
                        left: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 'auto',
                        width: typeof window !== 'undefined' && window.innerWidth < 768 ? 'calc(100vw - 32px)' : DROPDOWN_WIDTH,
                        maxHeight: typeof window !== 'undefined' ? `calc(100dvh - ${dropdownPosition.top}px - 24px)` : 'none'
                      }}
                    >
                      <SimplifiedAccountMenu
                        currentProduct={ecosystemCurrentProduct}
                        displayUser={userProfile ?? user}
                        unreadCount={unreadCount}
                        showAdminLink={showAdminLink}
                        adminHref={ADMIN_WORKSPACE_HREF}
                        rowClassName="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onNavigate={() => setIsProfileDropdownOpen(false)}
                        onLogout={async () => {
                          setIsProfileDropdownOpen(false);
                          await handleLogout();
                        }}
                      />
                    </div>,
                    portalContainer
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-gray-100 transition-colors touch-manipulation shrink-0"
              aria-expanded={isMobileMenuOpen}
              aria-controls="navbar-mobile-menu"
              aria-label={isMobileMenuOpen ? t('buttons.close') : 'Menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

        {/* Compact / mobile navigation (< xl). Always an independently scrollable
            overlay so short viewports and document-owned-scroll shells cannot clip
            essential items. Short landscape portals above the suppressed header. */}
        {isMobileMenuOpen &&
          (() => {
            const panel = (
          <div
            id="navbar-mobile-menu"
            data-wx-landscape-menu={suppressNavbarChrome ? '1' : '0'}
            className={cn(
              'xl:hidden border-t border-gray-200 py-4 bg-white dark:bg-gray-900',
              'overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]',
              suppressNavbarChrome
                ? 'hc-wx-landscape-menu-panel !flex fixed inset-x-0 top-[3.25rem] z-[99990] max-h-[calc(100dvh-3.25rem)] shadow-lg border-b pointer-events-auto pb-[max(1rem,env(safe-area-inset-bottom,0px))]'
                : cn(
                    'fixed inset-x-0 z-[200] max-w-7xl mx-auto px-3 sm:px-5 shadow-lg',
                    'top-[var(--hc-top-nav-height,4rem)]',
                    bottomNavReachable
                      ? 'max-h-[calc(100dvh-var(--hc-top-nav-height,4rem)-var(--hc-bottom-nav-offset,5.25rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+5.5rem))]'
                      : 'max-h-[calc(100dvh-var(--hc-top-nav-height,4rem)-env(safe-area-inset-bottom,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
                  ),
            )}
          >
            <nav className="flex flex-col space-y-2" aria-label={t('navbar.mobileMenuAria')}>
              <Link
                href="/"
                prefetch={false}
                className={mobileNavRowClass}
                onClick={() => {
                  closeMobileMenu();
                  navDebug('navbar:mobile', { href: '/' });
                }}
              >
                <Home className="w-4 h-4 shrink-0" aria-hidden />
                <span>{t('navbar.home')}</span>
              </Link>
              <Link
                href={careersHref}
                prefetch={false}
                data-hc-public-careers-nav=""
                data-testid={`${PUBLIC_CAREERS_NAV_TESTID}-mobile`}
                className={mobileNavRowClass}
                onClick={() => {
                  closeMobileMenu();
                  navDebug('navbar:mobile', { href: careersHref });
                }}
              >
                <Briefcase className="w-4 h-4 shrink-0" aria-hidden />
                <span>{t('navbar.werkenBij')}</span>
              </Link>

              {/* Primary create — hidden when bottom nav (+) is visible */}
              {!bottomNavReachable ? (
                <button
                  type="button"
                  data-wx-mobile-create=""
                  data-wx-primary-action-mobile=""
                  className={cn(
                    mobileNavRowClass,
                    'bg-primary-brand font-semibold text-white hover:bg-primary-700 hover:text-white',
                  )}
                  onClick={handleMobileCreate}
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden />
                  <span>{t('homePhase1.ctaShare')}</span>
                </button>
              ) : null}

              {!bottomNavReachable && user ? (
                <Link
                  href="/mijn-hcp"
                  prefetch={false}
                  data-wx-mobile-mijn-hcp=""
                  className={cn(
                    mobileNavRowClass,
                    pathname === '/mijn-hcp' && 'bg-primary-50 text-primary-brand',
                  )}
                  onClick={() => {
                    closeMobileMenu();
                    navDebug('navbar:mobile', { href: '/mijn-hcp', destination: 'mijn-hcp' });
                  }}
                >
                  <Award className="w-4 h-4 shrink-0" aria-hidden />
                  <span>{t('bottomNav.reputationTab')}</span>
                </Link>
              ) : null}

              {appUpdateStatus.showPlayMigrationStrip ? (
                <button
                  type="button"
                  className={cn(
                    mobileNavRowClass,
                    'border border-emerald-200 bg-emerald-50/95 text-emerald-950 font-medium'
                  )}
                  onClick={() => {
                    closeMobileMenu();
                    void appUpdateStatus.openPlayStore();
                    navDebug('navbar:mobile', { action: 'play-migration-reminder' });
                  }}
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden />
                  <span className="flex min-w-0 flex-col text-left">
                    <span>{t('playMigration.stripTitle')}</span>
                    <span className="text-xs font-normal text-emerald-900/85 line-clamp-2">
                      {t('playMigration.stripHint')}
                    </span>
                  </span>
                </button>
              ) : null}

              <Link
                href="/app"
                prefetch={false}
                className={mobileNavRowClass}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navDebug('navbar:mobile', { href: '/app' });
                }}
              >
                <Smartphone className="w-4 h-4 shrink-0" aria-hidden />
                <span>{t('navbar.androidBeta')}</span>
              </Link>

              {!bottomNavReachable && user ? (
                <Link
                  href="/profile"
                  prefetch={false}
                  className={mobileNavRowClass}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navDebug('navbar:mobile', { href: '/profile' });
                  }}
                >
                  <User className="w-4 h-4 shrink-0" aria-hidden />
                  <span>{t('bottomNav.profile')}</span>
                </Link>
              ) : null}

              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>

              {status === 'unauthenticated' && !user && (
                <>
                  <Link
                    href="/login"
                    prefetch={false}
                    className={cn(mobileNavRowClass, 'text-gray-700 hover:text-primary-brand')}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: '/login' });
                    }}
                  >
                    {t('navbar.login')}
                  </Link>
                  <Link
                    href="/register"
                    prefetch={false}
                    className={cn(
                      mobileNavRowClass,
                      'justify-center bg-primary-brand font-semibold text-white hover:bg-primary-700 hover:text-white'
                    )}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: '/register' });
                    }}
                  >
                    {t('navbar.register')}
                  </Link>
                </>
              )}

              {user && (
                <>
                  <Link
                    href="/checkout"
                    prefetch={false}
                    className={cn(mobileNavRowClass, 'relative')}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: '/checkout' });
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    <span>{t('navbar.cart')}</span>
                    {cartItemCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary-brand px-1 text-xs text-white">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>

                  <SimplifiedAccountMenu
                    currentProduct={ecosystemCurrentProduct}
                    displayUser={userProfile ?? user}
                    unreadCount={unreadCount}
                    showAdminLink={showAdminLink}
                    adminHref={ADMIN_WORKSPACE_HREF}
                    rowClassName={mobileNavRowClass}
                    hideMessages={bottomNavReachable}
                    includeLegalLinks={false}
                    onNavigate={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { section: 'account-menu' });
                    }}
                    onLogout={async () => {
                      setIsMobileMenuOpen(false);
                      await handleLogout();
                    }}
                  />

                  <Link
                    href="/notifications"
                    prefetch={false}
                    className={mobileNavRowClass}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: '/notifications' });
                    }}
                  >
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>{t('navbar.notifications')}</span>
                  </Link>
                </>
              )}

              <div className="my-2 border-t border-gray-200" />
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {t('navbar.earnWithHomecheff')}
              </p>
              {PUBLIC_EARN_CHILD_LINKS.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  prefetch={false}
                  className={mobileNavRowClass}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navDebug('navbar:mobile', { href: link.href, earnChild: link.id });
                  }}
                >
                  <span>{t(link.labelKey)}</span>
                </Link>
              ))}

              {!user ? (
                <div className="px-1 py-1">
                  <OntdekHomeCheffMenu
                    currentProduct={ecosystemCurrentProduct}
                    authenticated={false}
                    surface="mobile_menu"
                    variant="inline"
                  />
                </div>
              ) : null}

              {/* Canonical Over HomeCheff / legal — once per mobile menu (not also inside account). */}
              <NavbarLegalContactLinks
                variant="mobile"
                mobileNavRowClass={mobileNavRowClass}
                onNavigate={() => {
                  setIsMobileMenuOpen(false);
                }}
              />
            </nav>
          </div>
            );
            if (typeof document !== 'undefined') {
              return createPortal(panel, document.body);
            }
            return panel;
          })()}
      {guestAuthPanel}
    </header>
  );
}
