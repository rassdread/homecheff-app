'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { Home, User, LogOut, Settings, Menu, X, HelpCircle, Package, ShoppingCart, ChevronDown, MessageCircle, Shield, Heart, Lightbulb } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import CartIcon from '@/components/cart/CartIcon';
import NotificationBell from '@/components/notifications/NotificationBell';
import { setCartUserId, clearAllCartData } from '@/lib/cart';
import { clearAllUserData, validateAndCleanSession, setupSessionIsolation, forceSessionReset, clearNextAuthData } from '@/lib/session-cleanup';
import { getDisplayName } from '@/lib/displayName';
import { useCart } from '@/hooks/useCart';

export default function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [userProfile, setUserProfile] = useState<{ image?: string; profileImage?: string; name?: string; username?: string } | null>(null);
  const { totalItems: cartItemCount } = useCart();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const user =
    session && 'user' in session
      ? (session.user as typeof session['user'] & { image?: string })
      : undefined;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
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
      setUnreadOrdersCount(0);
      setUserProfile(null);
    }
  }, [session, status, user]);

  // Fetch unread messages and orders count
  const fetchUnreadCount = async () => {
    if (!session?.user?.email) return;
    
    try {
      // Fetch unread messages count
      const messagesResponse = await fetch('/api/messages/unread-count');
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setUnreadCount(messagesData.count || 0);
      }

      // Fetch unread orders count
      const ordersResponse = await fetch('/api/notifications/orders');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const unreadOrders = (ordersData.notifications || []).filter((n: any) => !n.isRead);
        setUnreadOrdersCount(unreadOrders.length);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
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
    <header className="w-full border-b bg-white/95 backdrop-blur-sm shadow-sm lg:sticky lg:top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => router.push('/dorpsplein')}
            >
              <Home className="w-4 h-4" />
              <span>Dorpsplein</span>
            </Button>
            
            <Link href="/inspiratie">
              <Button variant="ghost" className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>Inspiratie</span>
              </Button>
            </Link>
            
            <Link href="/faq">
              <Button variant="ghost" className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>FAQ</span>
              </Button>
            </Link>

            {status === 'unauthenticated' && !user && (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-primary-brand">
                    Inloggen
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary-brand hover:bg-primary-700 text-white">
                    Aanmelden
                  </Button>
                </Link>
              </>
            )}

            {user && (
              <>
                <CartIcon />
                <NotificationBell />
                
                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
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
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[60] animate-in slide-in-from-top-2 duration-200">
                      {/* Profile Link - Different for different roles */}
                      {(user as any)?.role === 'ADMIN' ? (
                        <Link 
                          href="/admin/profile" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Mijn Profiel</span>
                        </Link>
                      ) : (user as any)?.role === 'DELIVERY' ? (
                        <Link 
                          href="/profile" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Mijn Profiel</span>
                        </Link>
                      ) : (user as any)?.role === 'SELLER' ? (
                        <Link 
                          href="/profile" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Mijn Profiel</span>
                        </Link>
                      ) : (
                        <Link 
                          href="/profile" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Mijn Profiel</span>
                        </Link>
                      )}
                      
                      {/* Berichten - Altijd zichtbaar, nu via profiel */}
                      <Link 
                        href="/messages" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors relative"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Berichten</span>
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>
                      
                      {/* Mijn Aankopen - Met notificatie badge */}
                      <Link 
                        href="/orders" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors relative"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        <span>Mijn Aankopen</span>
                        {unreadOrdersCount > 0 && (
                          <span className="ml-auto bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {unreadOrdersCount > 99 ? '99+' : unreadOrdersCount}
                          </span>
                        )}
                      </Link>

                      {/* Privacy Instellingen */}
                      <Link 
                        href="/profile/privacy" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Privacy Instellingen</span>
                      </Link>
                      
                      {/* Dynamic Dashboard Links - Based on roles */}
                      {/* Admin Dashboard - Show for ADMIN role */}
                      {(user as any)?.role === 'ADMIN' && (
                        <Link 
                          href="/admin" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      {/* Seller Dashboard - Show if user has seller roles OR is SELLER role OR is ADMIN with seller roles */}
                      {(((user as any)?.sellerRoles?.length > 0 || (user as any)?.role === 'SELLER') || 
                        ((user as any)?.role === 'ADMIN' && (user as any)?.sellerRoles?.length > 0)) && (
                        <Link 
                          href="/verkoper/dashboard" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-green-600 hover:bg-green-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Verkoper Dashboard</span>
                        </Link>
                      )}
                      
                      {/* Delivery Dashboard - Show if user has delivery role OR is DELIVERY role */}
                      {((user as any)?.role === 'DELIVERY') && (
                        <Link 
                          href="/delivery/dashboard" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Package className="w-4 h-4" />
                          <span>Bezorger Dashboard</span>
                        </Link>
                      )}

                      {/* Multi-role indicator */}
                      {((user as any)?.role === 'ADMIN' && ((user as any)?.sellerRoles?.length > 0 || (user as any)?.role === 'SELLER' || (user as any)?.role === 'DELIVERY')) && (
                        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 mt-2">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Multi-rol gebruiker
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
                        <span>Uitloggen</span>
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
                <span>Dorpsplein</span>
              </Button>
              
              <Link href="/inspiratie" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>Inspiratie</span>
                </Button>
              </Link>
              
              <Link href="/faq" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </Button>
              </Link>

              {user && (
                <>
                  <Link href="/checkout" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 relative">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Winkelwagen</span>
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
                      <span>Berichten</span>
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
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-primary-brand">
                      Inloggen
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary-brand hover:bg-primary-700 text-white">
                      Aanmelden
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
                  
                  {/* Profile Link - Different for different roles */}
                  {(user as any)?.role === 'ADMIN' ? (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-red-600">
                        <User className="w-4 h-4" />
                        <span>Admin Profiel</span>
                      </Button>
                    </Link>
                  ) : (user as any)?.role === 'DELIVERY' ? (
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Mijn Profiel</span>
                      </Button>
                    </Link>
                  ) : (user as any)?.role === 'SELLER' ? (
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Mijn Profiel</span>
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Mijn Profiel</span>
                      </Button>
                    </Link>
                  )}
                  
                  <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 relative">
                      <Package className="w-4 h-4" />
                      <span>Mijn Aankopen</span>
                      {unreadOrdersCount > 0 && (
                        <span className="ml-auto bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                          {unreadOrdersCount > 99 ? '99+' : unreadOrdersCount}
                        </span>
                      )}
                    </Button>
                  </Link>

                  {/* Multi-role Dashboard Links - Based on user roles */}
                  {/* Admin Dashboard - Show for ADMIN role */}
                  {(user as any)?.role === 'ADMIN' && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-red-600">
                        <Shield className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  
                  {/* Seller Dashboard - Show if user has seller roles OR is SELLER role */}
                  {((user as any)?.sellerRoles?.length > 0 || (user as any)?.role === 'SELLER') && (
                    <Link href="/verkoper/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-green-600">
                        <Settings className="w-4 h-4" />
                        <span>Verkoper Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  
                  {/* Delivery Dashboard - Show for DELIVERY role */}
                  {(user as any)?.role === 'DELIVERY' && (
                    <Link href="/delivery/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-blue-600">
                        <Package className="w-4 h-4" />
                        <span>Bezorger Dashboard</span>
                      </Button>
                    </Link>
                  )}

                  {/* Multi-role indicator for mobile */}
                  {((user as any)?.role === 'ADMIN' && ((user as any)?.sellerRoles?.length > 0 || (user as any)?.role === 'SELLER' || (user as any)?.role === 'DELIVERY')) && (
                    <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 mt-2">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Multi-rol gebruiker
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
                    Uitloggen
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
