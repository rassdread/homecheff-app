'use client';

import { usePathname } from 'next/navigation';
import { Compass, MessageCircle, User, HelpCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { devBadgeLog } from '@/lib/devBadgeLog';

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [messagesUnread, setMessagesUnread] = useState(0);

  const hideOnPaths = ['/admin', '/delivery', '/verkoper', '/login', '/register'];
  const shouldHide = hideOnPaths.some(path => pathname?.startsWith(path));

  const refreshMessagesUnread = useCallback(async () => {
    if (!session?.user?.email) {
      setMessagesUnread(0);
      return;
    }
    try {
      const res = await fetch('/api/messages/unread-count', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!res.ok) return;
      const data = await res.json();
      const c = typeof data.count === 'number' ? data.count : 0;
      setMessagesUnread(c);
      devBadgeLog({
        messagesUnreadCount: c,
        source: 'bottomNav:/api/messages/unread-count',
      });
    } catch {
      /* ignore */
    }
  }, [session?.user?.email]);

  useEffect(() => {
    void refreshMessagesUnread();
  }, [refreshMessagesUnread]);

  useEffect(() => {
    const onUnread = (e: Event) => {
      const d = (e as CustomEvent<{ unreadCount?: number }>).detail;
      if (typeof d?.unreadCount === 'number') {
        setMessagesUnread(d.unreadCount);
      }
    };
    window.addEventListener('unreadCountUpdate', onUnread as EventListener);
    return () =>
      window.removeEventListener('unreadCountUpdate', onUnread as EventListener);
  }, []);

  if (shouldHide) return null;

  const onHome = pathname === '/';

  const navItems = [
    {
      label: t('bottomNav.discoverTab'),
      icon: Compass,
      href: '/#homecheff-feed',
      active: onHome,
      badge: 0,
    },
    {
      label: t('bottomNav.messages'),
      icon: MessageCircle,
      href: '/messages',
      active: pathname?.startsWith('/messages'),
      badge: messagesUnread,
    },
    {
      label: t('bottomNav.profile'),
      icon: User,
      href: session?.user ? '/profile' : '/login',
      active: pathname?.startsWith('/profile'),
      badge: 0,
    },
    {
      label: t('navbar.faq'),
      icon: HelpCircle,
      href: '/faq',
      active: pathname === '/faq',
      badge: 0,
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
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-1 right-[22%] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
