'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Lightbulb, MessageCircle, User, HelpCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();

  // Hide on certain pages (admin, delivery dashboard, etc.)
  const hideOnPaths = ['/admin', '/delivery', '/verkoper', '/login', '/register'];
  const shouldHide = hideOnPaths.some(path => pathname?.startsWith(path));

  if (shouldHide) return null;

  const navItems = [
    {
      label: t('bottomNav.dorpsplein'),
      icon: Home,
      href: '/dorpsplein',
      active: pathname === '/dorpsplein' || pathname === '/',
    },
    {
      label: t('bottomNav.inspiratie'),
      icon: Lightbulb,
      href: '/inspiratie',
      active: pathname?.startsWith('/inspiratie'),
    },
    {
      label: t('bottomNav.messages'),
      icon: MessageCircle,
      href: '/messages',
      active: pathname?.startsWith('/messages'),
    },
    {
      label: t('bottomNav.profile'),
      icon: User,
      href: session?.user ? '/profile' : '/login',
      active: pathname?.startsWith('/profile'),
    },
    {
      label: t('navbar.faq'),
      icon: HelpCircle,
      href: '/faq',
      active: pathname === '/faq',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}











