'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import SafeImage from '@/components/ui/SafeImage';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { Home, User, LogOut, Settings, Menu, X, HelpCircle, Package, ShoppingCart, ChevronDown, MessageCircle, Shield, Heart, Lightbulb, LayoutGrid, TrendingUp, Info, Smartphone, Download, Plus, Award, CalendarClock, Bell } from 'lucide-react';
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import CartIcon from '@/components/cart/CartIcon';
import NotificationBell from '@/components/notifications/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { setCartUserId, clearAllCartData } from '@/lib/cart';
import { validateAndCleanSession, setupSessionIsolation, performLogout } from '@/lib/session-cleanup';
import { getDisplayName } from '@/lib/displayName';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserBootstrap } from '@/components/user/UserBootstrapProvider';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { devBadgeLog } from '@/lib/devBadgeLog';
import { cn } from '@/lib/utils';
import { navDebug } from '@/lib/nav-debug';
import { useAppUpdateStatus } from '@/components/app/AppUpdateStatusProvider';
import { resolvePrimaryOperationsHref } from '@/lib/settings/settings-hub';
import {
  ADMIN_WORKSPACE_HREF,
  countEarningRoles,
  primaryDashboardContextFromUser,
  userHasAdminWorkspace,
  userHasEarningsHub,
} from '@/lib/navigation/primary-dashboard';
import { NavbarLegalContactLinks } from '@/components/nav/NavbarLegalContactLinks';
import { useCommsUnread } from '@/hooks/useCommsUnread';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import { useGuestAuthGate } from '@/hooks/useGuestAuthGate';
import { DEALS_PROFILE_PATH } from '@/lib/profile/deals-navigation';

function resolveNavDashboardHref(user: Record<string, unknown> | null | undefined): string | null {
  if (!user) return null;
  const href = resolvePrimaryOperationsHref({
    role: user.role as string | undefined,
    sellerRoles: (user.sellerRoles as string[] | undefined) ?? [],
    hasDeliveryProfile: Boolean(user.hasDeliveryProfile),
    hasAffiliate: Boolean(user.hasAffiliate),
  });
  return href === '/profile' ? null : href;
}

export default function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const appUpdateStatus = useAppUpdateStatus();
  const { profile: bootstrapProfile, ensureProfile } = useUserBootstrap();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { count: unreadCount } = useCommsUnread(status === 'authenticated');
  const { openCreateFlow } = useCreateFlow();
  const { requireAuthAction, guestAuthPanel } = useGuestAuthGate();
  const [sellerOrdersUnread, setSellerOrdersUnread] = useState(0);
  const [userProfile, setUserProfile] = useState<{ image?: string; profileImage?: string; name?: string; username?: string } | null>(null);
  const hasFetchedProfileRef = useRef(false);
  const DROPDOWN_WIDTH = 224;
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
  const nativeShell = useIsNativeAppMounted();

  /** Geen geneste <Link><Button> — één klikbaar element voor WebView/touch. */
  const mobileNavRowClass = cn(
    'inline-flex w-full min-h-[44px] items-center justify-start gap-2 rounded-2xl px-3 py-3 text-base font-medium',
    'text-gray-700 transition-colors hover:bg-gray-50 touch-manipulation select-none',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand'
  );

  /**
   * Desktop text nav (xl+ only). Compact lg–xl uses menu + primary actions
   * so labels never clip inside overflow-hidden.
   */
  const desktopNavGhostClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-2xl font-medium transition-all duration-200',
    'px-2.5 py-2 text-sm gap-1.5',
    '2xl:px-5 2xl:py-2.5 2xl:text-base 2xl:gap-2',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
    'bg-transparent text-primary-brand hover:bg-primary-50 hover:shadow-sm touch-manipulation select-none whitespace-nowrap'
  );

  /** Primary create CTA — lives outside the flexible nav so it never clips. */
  const createCtaClass = cn(
    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl font-medium transition-all duration-200',
    'whitespace-nowrap touch-manipulation select-none',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
    'bg-primary-brand text-white hover:bg-primary-700 hover:text-white',
    'min-h-[40px] px-3 py-2 text-sm',
    'xl:min-h-[44px] xl:px-4 xl:py-2.5',
    '2xl:px-5 2xl:py-3 2xl:text-base',
  );

  /** Guest auth CTAs — altijd zichtbaar, buiten de inkrimpende nav (md–lg overflow-fix). */
  const guestAuthLoginClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-xl font-medium transition-colors touch-manipulation no-underline whitespace-nowrap',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
    'bg-transparent text-gray-700 hover:bg-primary-50 hover:text-primary-brand',
    'min-h-[40px] px-2.5 py-2 text-xs min-[400px]:px-3 min-[400px]:text-sm',
    'sm:min-h-[44px] sm:px-3.5 sm:py-2.5 sm:text-sm',
    'lg:rounded-2xl lg:px-4 lg:py-2.5 lg:text-sm',
    'xl:px-6 xl:py-3 xl:text-base',
  );
  const guestAuthRegisterClass = cn(
    'inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-all touch-manipulation no-underline whitespace-nowrap',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand',
    'bg-primary-brand text-white hover:bg-primary-700',
    'shadow-sm hover:shadow-md',
    'xl:shadow-lg xl:hover:shadow-xl xl:hover:-translate-y-0.5',
    'min-h-[40px] px-2.5 py-2 text-xs min-[400px]:px-3 min-[400px]:text-sm',
    'sm:min-h-[44px] sm:px-3.5 sm:py-2.5 sm:text-sm',
    'lg:rounded-2xl lg:px-4 lg:py-2.5 lg:text-sm',
    'xl:px-6 xl:py-3 xl:text-base',
  );

  const user =
    session && 'user' in session
      ? (session.user as typeof session['user'] & { image?: string })
      : undefined;

  const navMenuUser = user
    ? ({ ...(user as Record<string, unknown>), ...(bootstrapProfile ?? {}) } as Record<string, unknown>)
    : null;
  const dashboardHref = resolveNavDashboardHref(navMenuUser);
  const showAdminLink = userHasAdminWorkspace(navMenuUser);
  const earningsHubCtx = primaryDashboardContextFromUser(navMenuUser);
  const showCombinedEarningsLink =
    earningsHubCtx != null &&
    userHasEarningsHub(earningsHubCtx) &&
    countEarningRoles(earningsHubCtx) >= 2;

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

  // Close compact menu when crossing into full desktop nav (xl)
  useEffect(() => {
    function handleResize() {
      if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      className={`w-full max-w-[100vw] overflow-x-clip border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm lg:sticky lg:top-0 z-[100] border-gray-200 dark:border-gray-800 ${
        nativeShell ? 'pt-[env(safe-area-inset-top,0px)]' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-5 xl:px-6 2xl:px-8 relative min-w-0">
        <div className="flex items-center h-16 min-w-0 gap-1 sm:gap-1.5 xl:gap-2">
          {/* Logo — icon until 2xl; full wordmark when space is abundant */}
          <div className="flex shrink-0 items-center">
            <div className="2xl:hidden">
              <Logo size="md" showText={false} />
            </div>
            <div className="hidden 2xl:block">
              <Logo size="md" />
            </div>
          </div>

          {/*
            Secondary text navigation — xl+ only.
            Below xl, compact chrome keeps CTA/account/menu fully visible (no overflow clipping).
          */}
          <nav
            className="hidden xl:flex items-center justify-center gap-0.5 2xl:gap-1 min-w-0 flex-1"
            aria-label="Hoofdnavigatie"
          >
            <Link
              href="/"
              prefetch={false}
              className={desktopNavGhostClass}
              onClick={() => navDebug('navbar:desktop', { href: '/' })}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>{t('navbar.home')}</span>
            </Link>
            <Link
              href="/werken-bij"
              prefetch={false}
              className={cn(desktopNavGhostClass, 'hidden 2xl:inline-flex')}
              onClick={() => navDebug('navbar:desktop', { href: '/werken-bij' })}
            >
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>{t('navbar.werkenBij')}</span>
            </Link>
            <Link
              href={user ? '/messages' : '/login'}
              prefetch={false}
              className={cn(desktopNavGhostClass, 'relative')}
              onClick={() =>
                navDebug('navbar:desktop', { href: user ? '/messages' : '/login' })
              }
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{t('navbar.messages')}</span>
              {user && unreadCount > 0 ? (
                <span className="absolute -top-0.5 right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </Link>
          </nav>

          {/* Primary actions: never clipped; menu covers secondary links below xl */}
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
            <div className="hidden xl:block shrink-0">
              <LanguageSwitcher />
            </div>
            <button
              type="button"
              className={cn(
                createCtaClass,
                // Authenticated: show from lg (compact chrome). Guests: from xl (login/register already primary).
                user ? 'hidden lg:inline-flex' : 'hidden xl:inline-flex',
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
              <span>{t('homePhase1.ctaShare')}</span>
            </button>

            {(status === 'unauthenticated' || status === 'loading') && !user && (
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
              <div className="hidden lg:flex items-center shrink-0 gap-0.5 xl:gap-1">
                <CartIcon />
                <div className="relative z-[110] shrink-0">
                  <NotificationBell />
                </div>

                {/* Profile Dropdown */}
                <div className="relative z-[100] shrink-0" ref={profileDropdownRef}>
                  <button
                    ref={profileButtonRef}
                    type="button"
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-1.5 xl:gap-2 px-1.5 xl:px-2 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 shrink-0"
                    aria-expanded={isProfileDropdownOpen}
                    aria-haspopup="menu"
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
                    <span className="hidden 2xl:inline text-sm font-medium text-gray-700 max-w-[9rem] truncate">
                      {userProfile ? getDisplayName(userProfile) : getDisplayName(user)}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
                        isProfileDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* Dropdown Menu – via portal zodat overflow header geen invloed heeft */}
                  {portalContainer && isProfileDropdownOpen && createPortal(
                    <div 
                      ref={dropdownMenuRef}
                      className={`pointer-events-auto fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 overflow-y-auto z-[99999] ${
                        dropdownPosition.openAbove 
                          ? 'animate-in slide-in-from-bottom-2 duration-200' 
                          : 'animate-in slide-in-from-top-2 duration-200'
                      }`}
                      style={{
                        top: typeof window !== 'undefined' && window.innerWidth < 768 ? 56 : dropdownPosition.top,
                        right: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : dropdownPosition.right,
                        left: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 'auto',
                        width: typeof window !== 'undefined' && window.innerWidth < 768 ? 'calc(100vw - 32px)' : DROPDOWN_WIDTH,
                        maxHeight: typeof window !== 'undefined' ? `calc(100vh - ${dropdownPosition.top}px - 24px)` : 'none'
                      }}
                    >
                      {/* Profile Link - Always goes to normal profile page */}
                      {user ? (
                        <Link 
                          href="/profile" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>{t('navbar.myProfile')}</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            router.push('/login');
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                        >
                          <User className="w-4 h-4" />
                          <span>{t('navbar.myProfile')}</span>
                        </button>
                      )}
                      
                      {/* Berichten - Altijd zichtbaar, nu via profiel */}
                      <Link 
                        href="/messages" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors relative"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{t('navbar.messages')}</span>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>

                      {/* Mijn Afspraken — unified operations hub (UX-FIN-2.1) */}
                      <Link
                        href={DEALS_PROFILE_PATH}
                        prefetch={false}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <CalendarClock className="w-4 h-4" />
                        <span>{t('navbar.agreements')}</span>
                      </Link>

                      {/* Bestellingen — buyer orders (UX-FIN-2.3) */}
                      <Link
                        href="/orders"
                        prefetch={false}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        <span>{t('navbar.orders')}</span>
                      </Link>

                      {/* Favorieten (UX-FIN-2.2) */}
                      <Link
                        href="/favorites"
                        prefetch={false}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Heart className="w-4 h-4" />
                        <span>{t('navbar.favorites')}</span>
                      </Link>

                      <Link
                        href="/mijn-hcp"
                        prefetch={false}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Award className="w-4 h-4" />
                        <span>{t('bottomNav.reputationTab')}</span>
                      </Link>

                      {dashboardHref ? (
                        <Link
                          href={dashboardHref}
                          prefetch={false}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span>{t('navbar.dashboard') || 'Dashboard'}</span>
                        </Link>
                      ) : null}

                      {showCombinedEarningsLink ? (
                        <Link
                          href="/verdiensten"
                          prefetch={false}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>{t('navbar.combinedEarnings')}</span>
                        </Link>
                      ) : null}

                      {showAdminLink ? (
                        <Link
                          href={ADMIN_WORKSPACE_HREF}
                          prefetch={false}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-violet-700 hover:bg-violet-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          <span>{t('navbar.admin')}</span>
                        </Link>
                      ) : null}

                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t('navigation.settings') || 'Instellingen'}</span>
                      </Link>

                      <NavbarLegalContactLinks
                        variant="dropdown"
                        onNavigate={() => setIsProfileDropdownOpen(false)}
                      />

                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        onClick={async () => {
                          setIsProfileDropdownOpen(false);
                          await handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('navbar.logout')}</span>
                      </button>
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

        {/* Compact / mobile navigation (< xl) — covers tablet + narrow laptop */}
        {isMobileMenuOpen && (
          <div id="navbar-mobile-menu" className="xl:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                prefetch={false}
                className={mobileNavRowClass}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navDebug('navbar:mobile', { href: '/' });
                }}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>{t('navbar.home')}</span>
              </Link>

              <button
                type="button"
                className={cn(
                  mobileNavRowClass,
                  'justify-center bg-primary-brand font-semibold text-white hover:bg-primary-700 hover:text-white',
                )}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (user) {
                    openCreateFlow();
                  } else {
                    requireAuthAction('create', '/sell/new');
                  }
                  navDebug('navbar:mobile', { action: 'create' });
                }}
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden />
                <span>{t('homePhase1.ctaShare')}</span>
              </button>

              {appUpdateStatus.showPlayMigrationStrip ? (
                <button
                  type="button"
                  className={cn(
                    mobileNavRowClass,
                    'border border-emerald-200 bg-emerald-50/95 text-emerald-950 font-medium'
                  )}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
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
                href="/werken-bij"
                prefetch={false}
                className={mobileNavRowClass}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navDebug('navbar:mobile', { href: '/werken-bij' });
                }}
              >
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>{t('navbar.werkenBij')}</span>
              </Link>

              <Link
                href="/app"
                prefetch={false}
                className={mobileNavRowClass}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navDebug('navbar:mobile', { href: '/app' });
                }}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>{t('navbar.androidBeta')}</span>
              </Link>

              <Link
                href={user ? '/profile' : '/login'}
                prefetch={false}
                className={mobileNavRowClass}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navDebug('navbar:mobile', { href: user ? '/profile' : '/login' });
                }}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>{t('bottomNav.profile')}</span>
              </Link>

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

                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                    {(userProfile?.profileImage || userProfile?.image || user?.image) ? (
                      <SafeImage
                        src={userProfile?.profileImage || userProfile?.image || user?.image || ''}
                        alt={t("navbar.profileImage")}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-primary-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-brand" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                      {userProfile ? getDisplayName(userProfile) : getDisplayName(user)}
                    </span>
                  </div>
                  
                  {/* Profile Link - Always goes to normal profile page */}
                  {user ? (
                    <Link
                      href="/profile"
                      prefetch={false}
                      className={mobileNavRowClass}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navDebug('navbar:mobile', { href: '/profile' });
                      }}
                    >
                      <User className="w-4 h-4 shrink-0" />
                      <span>{t('navbar.myProfile')}</span>
                    </Link>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start flex items-center space-x-2"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push('/login');
                      }}
                    >
                      <User className="w-4 h-4" />
                      <span>{t('navbar.myProfile')}</span>
                    </Button>
                  )}
                  
                  <Link
                    href="/messages"
                    prefetch={false}
                    className={cn(mobileNavRowClass, 'relative')}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: '/messages' });
                    }}
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>{t('navbar.messages')}</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Mijn Afspraken — unified operations hub (UX-FIN-2.1) */}
                  <Link
                    href={DEALS_PROFILE_PATH}
                    prefetch={false}
                    className={mobileNavRowClass}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: DEALS_PROFILE_PATH });
                    }}
                  >
                    <CalendarClock className="w-4 h-4 shrink-0" />
                    <span>{t('navbar.agreements')}</span>
                  </Link>

                  {/* Bestellingen — buyer orders (UX-FIN-2.3) */}
                  <Link
                    href="/orders"
                    prefetch={false}
                    className={mobileNavRowClass}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: '/orders' });
                    }}
                  >
                    <Package className="w-4 h-4 shrink-0" />
                    <span>{t('navbar.orders')}</span>
                  </Link>

                  {/* Favorieten (UX-FIN-2.2) */}
                  <Link
                    href="/favorites"
                    prefetch={false}
                    className={mobileNavRowClass}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: '/favorites' });
                    }}
                  >
                    <Heart className="w-4 h-4 shrink-0" />
                    <span>{t('navbar.favorites')}</span>
                  </Link>

                  {/* Meldingen — mobile access (desktop uses NotificationBell) (UX-FIN-2.4) */}
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

                  {dashboardHref ? (
                    <Link
                      href={dashboardHref}
                      prefetch={false}
                      className={cn(mobileNavRowClass, 'text-emerald-700 hover:bg-emerald-50')}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navDebug('navbar:mobile', { href: dashboardHref });
                      }}
                    >
                      <LayoutGrid className="w-4 h-4 shrink-0" />
                      <span>{t('navbar.dashboard') || 'Dashboard'}</span>
                    </Link>
                  ) : null}

                  {showCombinedEarningsLink ? (
                    <Link
                      href="/verdiensten"
                      prefetch={false}
                      className={mobileNavRowClass}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navDebug('navbar:mobile', { href: '/verdiensten' });
                      }}
                    >
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span>{t('navbar.combinedEarnings')}</span>
                    </Link>
                  ) : null}

                  {showAdminLink ? (
                    <Link
                      href={ADMIN_WORKSPACE_HREF}
                      prefetch={false}
                      className={cn(mobileNavRowClass, 'text-violet-700 hover:bg-violet-50')}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navDebug('navbar:mobile', { href: ADMIN_WORKSPACE_HREF });
                      }}
                    >
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>{t('navbar.admin')}</span>
                    </Link>
                  ) : null}

                  <Link
                    href="/settings"
                    prefetch={false}
                    className={mobileNavRowClass}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navDebug('navbar:mobile', { href: '/settings' });
                    }}
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>{t('navigation.settings') || 'Instellingen'}</span>
                  </Link>

                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <Button 
                    variant="ghost" 
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await handleLogout();
                    }}
                    className="w-full min-h-[44px] justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('navbar.logout')}
                  </Button>
                </>
              )}

              <NavbarLegalContactLinks
                variant="mobile"
                mobileNavRowClass={mobileNavRowClass}
                onNavigate={() => {
                  setIsMobileMenuOpen(false);
                }}
              />
            </nav>
          </div>
        )}
      </div>
      {guestAuthPanel}
    </header>
  );
}
