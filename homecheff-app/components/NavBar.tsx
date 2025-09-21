'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { Home, User, LogOut, Settings, Menu, X, HelpCircle, Package, ShoppingCart, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import CartIcon from '@/components/cart/CartIcon';
import { setCartUserId, clearAllCartData } from '@/lib/cart';
import { clearAllUserData, validateAndCleanSession } from '@/lib/session-cleanup';

export default function NavBar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
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

  // Sync cart with user ID for isolation and validate session
  useEffect(() => {
    // Validate session integrity
    validateAndCleanSession();

    if (session?.user?.email) {
      // Use email as user identifier for cart isolation
      setCartUserId(session.user.email);
    } else {
      setCartUserId(null);
    }
  }, [session]);

  const handleLogout = async () => {
    // Clear all user data for complete session isolation
    clearAllUserData();
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="w-full border-b bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Button>
            </Link>
            
            <Link href="/faq">
              <Button variant="ghost" className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>FAQ</span>
              </Button>
            </Link>

            {status !== 'loading' && !user && (
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
                
                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
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
                    <span className="text-sm font-medium text-gray-700">
                      {user.name || 'Profiel'}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isProfileDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Mijn Profiel</span>
                      </Link>
                      
                      <Link 
                        href="/orders" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        <span>Mijn Bestellingen</span>
                      </Link>
                      
                      <Link 
                        href="/favorites" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Mijn Fans</span>
                      </Link>
                      
                      <Link 
                        href="/verkoper/dashboard" 
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Verkoper Dashboard</span>
                      </Link>
                      
                      {/* Admin Dashboard Link - Only for Admins */}
                      {(user as any)?.role === 'ADMIN' && (
                        <Link 
                          href="/admin" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      
                      {/* Delivery Dashboard Link - Only for Delivery Users */}
                      {((user as any)?.role === 'USER' || (user as any)?.deliveryProfile) && (
                        <Link 
                          href="/delivery/dashboard" 
                          className="flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Package className="w-4 h-4" />
                          <span>Bezorger Dashboard</span>
                        </Link>
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
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Button>
              </Link>
              
              <Link href="/faq" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </Button>
              </Link>

              {status !== 'loading' && !user && (
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
                    {user.image ? (
                      <Image
                        src={user.image}
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
                    <span className="text-sm font-medium text-gray-700">
                      {user.name || 'Profiel'}
                    </span>
                  </div>
                  
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Mijn Profiel</span>
                    </Button>
                  </Link>
                  
                  <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>Mijn Bestellingen</span>
                    </Button>
                  </Link>
                  
                  <Link href="/favorites" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Mijn Fans</span>
                    </Button>
                  </Link>
                  
                  <Link href="/verkoper/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Verkoper Dashboard</span>
                    </Button>
                  </Link>
                  
                  {/* Delivery Dashboard Link - Only for Delivery Users */}
                  {((user as any)?.role === 'USER' || (user as any)?.deliveryProfile) && (
                    <Link href="/delivery/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start flex items-center space-x-2 text-blue-600">
                        <Package className="w-4 h-4" />
                        <span>Bezorger Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <Button 
                    variant="ghost" 
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await signOut({ callbackUrl: '/' });
                      window.location.href = '/';
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
