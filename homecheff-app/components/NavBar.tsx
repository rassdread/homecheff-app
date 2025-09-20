'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { Home, User, LogOut, Settings, Menu, X, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export default function NavBar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user =
    session && 'user' in session
      ? (session.user as typeof session['user'] & { image?: string })
      : undefined;

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
                  <Button variant="ghost" className="text-gray-700 hover:text-emerald-600">
                    Inloggen
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Aanmelden
                  </Button>
                </Link>
              </>
            )}

            {user && (
              <>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt="Profielfoto"
                      width={32}
                      height={32}
                      className="rounded-full border-2 border-emerald-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Profiel
                  </span>
                </Link>
                <Link href="/verkoper/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={async () => {
                    await signOut({ callbackUrl: '/' });
                    window.location.href = '/';
                  }}
                  className="text-gray-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
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
                    <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-emerald-600">
                      Inloggen
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      Aanmelden
                    </Button>
                  </Link>
                </>
              )}

              {user && (
                <>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt="Profielfoto"
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-emerald-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      Profiel
                    </span>
                  </Link>
                  <Link href="/verkoper/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={async () => {
                      await signOut({ callbackUrl: '/' });
                      window.location.href = '/';
                    }}
                    className="w-full justify-start text-gray-500 hover:text-red-600"
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
