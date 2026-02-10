'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { Home, User, LogOut, Settings, Menu, X, HelpCircle, Package, ShoppingCart, ChevronDown, MessageCircle, Shield, Heart, Lightbulb, LayoutGrid, Gift, TrendingUp, DollarSign } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import CartIcon from '@/components/cart/CartIcon';
import NotificationBell from '@/components/notifications/NotificationBell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { setCartUserId, clearAllCartData } from '@/lib/cart';
import { clearAllUserData, validateAndCleanSession, setupSessionIsolation, forceSessionReset, clearNextAuthData } from '@/lib/session-cleanup';
import { getDisplayName } from '@/lib/displayName';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from '@/hooks/useTranslation';

export default function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState<{ image?: string; profileImage?: string; name?: string; username?: string } | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const { totalItems: cartItemCount } = useCart();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const user =
    session && 'user' in session
      ? (session.user as typeof session['user'] & { image?: string })
      : undefined;

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isProfileDropdownOpen && profileButtonRef.current && typeof window !== 'undefined') {
      const updatePosition = () => {
        if (profileButtonRef.current) {
          const rect = profileButtonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
          });
        }
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isProfileDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current && 
        !profileDropdownRef.current.contains(event.target as Node) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch('/api/profile/me');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Sync cart with user ID for isolation and validate session
  useEffect(() => {
    // Debug session state

    // Setup session isolation to prevent data leakage
    setupSessionIsolation();
    
    // Validate session integrity
    validateAndCleanSession();

    if (session?.user?.email) {
      // Use email as user identifier for cart isolation
      setCartUserId(session.user.email);
      // Fetch unread count
      fetchUnreadCount();
      // Fetch user profile data
      fetchUserProfile();
    } else {
      // No session - clear all user data to prevent data leakage
      setCartUserId(null);
      clearNextAuthData();
      setUnreadCount(0);
      setUserProfile(null);
    }
  }, [session, status, user]);

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    if (!session?.user?.email) return;
    
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = async () => {
    // Clear all user data and NextAuth data for complete session isolation
    clearAllUserData();
    clearNextAuthData();
    
    // Sign out and force complete session reset
    await signOut({ redirect: false });
    forceSessionReset();
  };

  return (
    <header className="w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm lg:sticky lg:top-0 z-[100] border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo - responsive voor mobiel */}
          <div className="flex-shrink-0 min-w-0">
            <Logo size="md" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => router.push('/dorpsplein')}
            >
              <Home className="w-4 h-4" />
              <span>{t('navbar.dorpsplein')}</span>
            </Button>
            
            <Link href="/inspiratie">
              <Button variant="ghost" className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>{t('navbar.inspiratie')}</span>
              </Button>
            </Link>
            
            <Link href="/faq">
              <Button variant="ghost" className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>{t('navbar.faq')}</span>
              </Button>
            </Link>

            <Link href="/werken-bij">
              <Button variant="ghost" className="flex items-center space-x-2">
                <span>{t('navbar.werkenBij')}</span>
              </Button>
            </Link>

            <LanguageSwitcher />

            {status === 'unauthenticated' && !user && (
              <>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand bg-transparent text-gray-700 hover:bg-primary-50 hover:text-primary-brand cursor-pointer hover:shadow-sm no-underline"
                >
                  {t('navbar.login')}
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-brand bg-primary-brand text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer no-underline"
                >
                  {t('navbar.register')}
                </Link>
              </>
            )}

            {user && (
              <>
                <CartIcon />
                <NotificationBell />
                
                {/* Profile Dropdown */}
                <div className="relative z-[100]" ref={profileDropdownRef}>
                  <button
                    ref={profileButtonRef}
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    {(userProfile?.profileImage || userProfile?.image || user?.image) ? (
                      <SafeImage
                        src={userProfile?.profileImage || userProfile?.image || user?.image || ''}
                        alt="Profielfoto"
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
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isProfileDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div 
                      ref={dropdownMenuRef}
                      className="fixed md:fixed right-4 md:right-auto top-[4.5rem] md:top-auto md:mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999] animate-in slide-in-from-top-2 duration-200"
                      style={typeof window !== 'undefined' && window.innerWidth >= 768 ? {
                        position: 'fixed',
                        top: `${dropdownPosition.top}px`,
                        right: `${dropdownPosition.right}px`,
                        zIndex: 9999
                      } : {
                        zIndex: 9999
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
                      
                      {/* Verdiensten - Gecombineerd overzicht */}
                      <Link 
                        href="/verdiensten" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Mijn Verdiensten</span>
                      </Link>
                      
                      <Link 
                        href="/orders" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        <span>{t('navbar.orders')}</span>
                      </Link>

                      {/* Privacy Instellingen */}
                      <Link 
                        href="/profile/privacy" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        <span>{t('navbar.privacy')}</span>
                      </Link>
                      
                      {/* Dynamic Dashboard Links - Based on roles */}
                      {/* Admin Dashboard - Show for ADMIN/SUPERADMIN role OR if user has adminRoles */}
                      {(((user as any)?.role === 'ADMIN' || (user as any)?.role === 'SUPERADMIN') || ((user as any)?.adminRoles && (user as any)?.adminRoles.length > 0)) && (
                        <Link 
                          href="/admin" 
                          prefetch={true}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            router.prefetch('/admin');
                          }}
                        >
                          <Shield className="w-4 h-4" />
                          <span>{t('navbar.adminDashboard')}</span>
                        </Link>
                      )}

                      {/* Seller Dashboard - Show if user has seller roles OR is SELLER role OR is ADMIN/SUPERADMIN with seller roles */}
                      {(((user as any)?.sellerRoles?.length > 0 || (user as any)?.role === 'SELLER') || 
                        (((user as any)?.role === 'ADMIN' || (user as any)?.role === 'SUPERADMIN') && (user as any)?.sellerRoles?.length > 0)) && (
                        <>
                          <Link 
                            href="/verkoper/dashboard" 
                            prefetch={true}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-green-600 hover:bg-green-50 transition-colors"
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              router.prefetch('/verkoper/dashboard');
                            }}
                          >
                            <LayoutGrid className="w-4 h-4" />
                            <span>{t('navbar.sellerDashboard')}</span>
                          </Link>
                        </>
                      )}
                      
                      {/* Delivery Dashboard - Show ONLY for DELIVERY role (ambassadors/bezorgers), NOT for sellers */}
                      {((user as any)?.role === 'DELIVERY' || (user as any)?.hasDeliveryProfile) && (
                        <Link 
                          href="/delivery/dashboard" 
                          prefetch={true}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            router.prefetch('/delivery/dashboard');
                          }}
                        >
                          <Package className="w-4 h-4" />
                          <span>{t('navbar.deliveryDashboard')}</span>
                        </Link>
                      )}

                      {/* Affiliate Dashboard - Show if user has affiliate account */}
                      {(user as any)?.hasAffiliate && (
                        <Link 
                          href="/affiliate/dashboard" 
                          prefetch={true}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            router.prefetch('/affiliate/dashboard');
                          }}
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Affiliate Dashboard</span>
                        </Link>
                      )}

                      {/* Multi-role indicator - Show if user has multiple roles/dashboards */}
                      {(
                        (((user as any)?.role === 'ADMIN' || (user as any)?.role === 'SUPERADMIN') && ((user as any)?.sellerRoles?.length > 0 || (user as any)?.hasDeliveryProfile || (user as any)?.hasAffiliate)) ||
                        ((user as any)?.role === 'SELLER' && ((user as any)?.hasDeliveryProfile || (user as any)?.hasAffiliate)) ||
                        ((user as any)?.sellerRoles?.length > 0 && ((user as any)?.hasDeliveryProfile || (user as any)?.hasAffiliate)) ||
                        ((user as any)?.hasDeliveryProfile && (user as any)?.hasAffiliate)
                      ) && (
                        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 mt-2">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {t('navbar.multiRole')}
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        onClick={async () => {
                          setIsProfileDropdownOpen(false);
                          await handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('navbar.logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start flex items-center space-x-2"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/dorpsplein');
                }}
              >
                <Home className="w-4 h-4" />
                <span>{t('navbar.dorpsplein')}</span>
              </Button>
              
              <Link href="/inspiratie" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>{t('navbar.inspiratie')}</span>
                </Button>
              </Link>
              
              <Link href="/faq" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>{t('navbar.faq')}</span>
                </Button>
              </Link>

              <Link href="/werken-bij" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                  <span>{t('navbar.werkenBij')}</span>
                </Button>
              </Link>

              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>

              {user && (
                <>
                  <Link href="/checkout" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 relative">
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t('navbar.cart')}</span>
                      {cartItemCount > 0 && (
                        <span className="ml-auto bg-primary-brand text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  
                  <Link href="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 relative">
                      <MessageCircle className="w-4 h-4" />
                      <span>{t('navbar.messages')}</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                </>
              )}

              {status === 'unauthenticated' && !user && (
                <>
                  <Link href="/login" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-primary-brand" type="button">
                      {t('navbar.login')}
                    </Button>
                  </Link>
                  <Link href="/register" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary-brand hover:bg-primary-700 text-white" type="button">
                      {t('navbar.register')}
                    </Button>
                  </Link>
                </>
              )}

              {user && (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                    {(userProfile?.profileImage || userProfile?.image || user?.image) ? (
                      <SafeImage
                        src={userProfile?.profileImage || userProfile?.image || user?.image || ''}
                        alt="Profielfoto"
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
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{t('navbar.myProfile')}</span>
                      </Button>
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
                  
                  <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>{t('navbar.orders')}</span>
                    </Button>
                  </Link>

                  {/* Multi-role Dashboard Links - Based on user roles */}
                  {/* Admin Dashboard - Show for ADMIN/SUPERADMIN role OR if user has adminRoles */}
                  {(((user as any)?.role === 'ADMIN' || (user as any)?.role === 'SUPERADMIN') || ((user as any)?.adminRoles && (user as any)?.adminRoles.length > 0)) && (
                    <Link 
                      href="/admin" 
                      prefetch={true}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.prefetch('/admin');
                      }}
                    >
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-red-600">
                        <Shield className="w-4 h-4" />
                        <span>{t('navbar.adminDashboard')}</span>
                      </Button>
                    </Link>
                  )}
                  
                  {/* Seller Dashboard - Show if user has seller roles OR is SELLER role */}
                  {((user as any)?.sellerRoles?.length > 0 || (user as any)?.role === 'SELLER') && (
                    <Link 
                      href="/verkoper/dashboard" 
                      prefetch={true}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.prefetch('/verkoper/dashboard');
                      }}
                    >
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-green-600">
                        <LayoutGrid className="w-4 h-4" />
                        <span>{t('navbar.sellerDashboard')}</span>
                      </Button>
                    </Link>
                  )}
                  
                  {/* Delivery Dashboard - Show ONLY for DELIVERY role (ambassadors/bezorgers), NOT for sellers */}
                  {((user as any)?.role === 'DELIVERY' || (user as any)?.hasDeliveryProfile) && (
                    <Link href="/delivery/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-blue-600">
                        <Package className="w-4 h-4" />
                        <span>{t('navbar.deliveryDashboard')}</span>
                      </Button>
                    </Link>
                  )}

                  {/* Affiliate Dashboard - Show if user has affiliate account */}
                  {(user as any)?.hasAffiliate && (
                    <Link href="/affiliate/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>Affiliate Dashboard</span>
                      </Button>
                    </Link>
                  )}

                  {/* Multi-role indicator for mobile - Show if user has multiple roles/dashboards */}
                  {(
                    (((user as any)?.role === 'ADMIN' || (user as any)?.role === 'SUPERADMIN') && ((user as any)?.sellerRoles?.length > 0 || (user as any)?.hasDeliveryProfile || (user as any)?.hasAffiliate)) ||
                    ((user as any)?.role === 'SELLER' && ((user as any)?.hasDeliveryProfile || (user as any)?.hasAffiliate)) ||
                    ((user as any)?.sellerRoles?.length > 0 && ((user as any)?.hasDeliveryProfile || (user as any)?.hasAffiliate)) ||
                    ((user as any)?.hasDeliveryProfile && (user as any)?.hasAffiliate)
                  ) && (
                    <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 mt-2">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {t('navbar.multiRole')}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <Button 
                    variant="ghost" 
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await handleLogout();
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('navbar.logout')}
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
