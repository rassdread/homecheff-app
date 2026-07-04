'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  readAppResumeState,
  saveLastRoute,
  saveLastConversationId,
  shouldRestoreRoute,
  isResumeHomeEntry,
  APP_RESUME_SESSION_ROUTE_DONE,
  getScrollStorageKey,
  readScrollPosition,
  saveScrollPosition,
  HOME_FEED_DESKTOP_SCROLL_KEY,
  HOME_FEED_WINDOW_SCROLL_KEY,
} from '@/lib/appResumeCache';

function currentFullPath(pathname: string, search: string): string {
  if (!search) return pathname;
  return search.startsWith('?') ? `${pathname}${search}` : `${pathname}?${search}`;
}

function tryRestoreHomeFeedScroll(
  windowY: number,
  desktopY: number | null,
  attempts: number,
): void {
  if (typeof document === 'undefined') return;
  const desktop = document.getElementById('homecheff-feed-desktop');
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

  if (isDesktop && desktop && desktopY != null && desktopY > 3) {
    desktop.scrollTop = desktopY;
    return;
  }

  if (windowY > 3) {
    window.scrollTo({ top: windowY, behavior: 'instant' as ScrollBehavior });
    return;
  }

  if (attempts <= 0) return;
  window.setTimeout(
    () => tryRestoreHomeFeedScroll(windowY, desktopY, attempts - 1),
    90,
  );
}

function tryRestoreMessagesListScroll(y: number, attempts: number): void {
  if (typeof document === 'undefined') return;
  /** Android native: lijst gebruikt window/document scroll i.p.v. inner scrollport. */
  if (document.querySelector('[data-hc-messages-list-window-scroll="true"]')) {
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
    return;
  }
  const el = document.querySelector<HTMLElement>(
    '[data-hc-app-scroll="messages-list"]'
  );
  if (el) {
    el.scrollTop = y;
    return;
  }
  if (attempts <= 0) return;
  window.setTimeout(() => tryRestoreMessagesListScroll(y, attempts - 1), 90);
}

/**
 * Route + scroll hints voor app/WebView resume. Geen auth-wijzigingen.
 */
export default function AppResumeCoordinator() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const search = searchParams?.toString()
    ? `?${searchParams.toString()}`
    : '';
  const fullPath = currentFullPath(pathname, search);

  const pathRef = useRef(pathname);
  const searchRef = useRef(search);
  pathRef.current = pathname;
  searchRef.current = search;

  const lastScrollKeyRef = useRef<string | null>(null);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Restore (1× per tab) vóór save, zodat cold `/` de opgeslagen route niet overschrijft
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (status === 'authenticated' && isResumeHomeEntry(pathname)) {
      if (!sessionStorage.getItem(APP_RESUME_SESSION_ROUTE_DONE)) {
        const state = readAppResumeState();
        const target = state.lastRoute?.trim();
        if (
          target &&
          shouldRestoreRoute(target) &&
          target !== fullPath &&
          target !== pathname
        ) {
          sessionStorage.setItem(APP_RESUME_SESSION_ROUTE_DONE, '1');
          router.replace(target);
          return;
        }
      }
    }

    if (status === 'authenticated' || status === 'unauthenticated') {
      saveLastRoute(pathname, search);
    }
  }, [status, pathname, search, fullPath, router]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onHide = () => {
      const path = pathRef.current;
      const search = searchRef.current;
      saveLastRoute(path, search);
      try {
        const key = getScrollStorageKey(path, search);
        if (key === 'ui:messages-list') {
          if (document.querySelector('[data-hc-messages-list-window-scroll="true"]')) {
            saveScrollPosition(key, window.scrollY);
          } else {
            const el = document.querySelector<HTMLElement>(
              '[data-hc-app-scroll="messages-list"]'
            );
            if (el) saveScrollPosition(key, el.scrollTop);
          }
        } else if (key) {
          saveScrollPosition(key, window.scrollY);
          if (key === HOME_FEED_WINDOW_SCROLL_KEY) {
            const desktop = document.getElementById('homecheff-feed-desktop');
            if (desktop && desktop.scrollTop > 2) {
              saveScrollPosition(
                HOME_FEED_DESKTOP_SCROLL_KEY,
                desktop.scrollTop,
              );
            }
          }
        }
        if (path === '/messages' || path === '/en/messages') {
          const q = search.startsWith('?') ? search.slice(1) : search;
          const cid = new URLSearchParams(q).get('conversation');
          if (cid) saveLastConversationId(cid);
        }
      } catch {
        /* ignore */
      }
    };
    const vis = () => {
      if (document.visibilityState === 'hidden') onHide();
    };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  // Scroll restore
  useEffect(() => {
    const key = getScrollStorageKey(pathname, search);
    if (!key) {
      lastScrollKeyRef.current = null;
      return;
    }
    if (lastScrollKeyRef.current === key) return;
    const y = readScrollPosition(key);
    if (y == null || y < 4) {
      lastScrollKeyRef.current = key;
      return;
    }
    lastScrollKeyRef.current = key;

    const run = () => {
      if (key === 'ui:messages-list') {
        tryRestoreMessagesListScroll(y, 12);
        return;
      }
      if (key === HOME_FEED_WINDOW_SCROLL_KEY) {
        const desktopY = readScrollPosition(HOME_FEED_DESKTOP_SCROLL_KEY);
        tryRestoreHomeFeedScroll(y, desktopY, 14);
        return;
      }
      window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [pathname, search]);

  // Window scroll save (home + profile); messages-list via ConversationsList
  useEffect(() => {
    const key = getScrollStorageKey(pathname, search);
    if (!key || key === 'ui:messages-list') return;

    const tick = () => {
      if (scrollSaveTimerRef.current != null) return;
      scrollSaveTimerRef.current = window.setTimeout(() => {
        scrollSaveTimerRef.current = null;
        const y = window.scrollY;
        if (y > 2) saveScrollPosition(key, y);
        if (key === HOME_FEED_WINDOW_SCROLL_KEY) {
          const desktop = document.getElementById('homecheff-feed-desktop');
          if (desktop && desktop.scrollTop > 2) {
            saveScrollPosition(HOME_FEED_DESKTOP_SCROLL_KEY, desktop.scrollTop);
          }
        }
      }, 450);
    };

    window.addEventListener('scroll', tick, { passive: true });

    let desktopEl: HTMLElement | null = null;
    let desktopTick: (() => void) | null = null;
    if (key === HOME_FEED_WINDOW_SCROLL_KEY) {
      desktopEl = document.getElementById('homecheff-feed-desktop');
      if (desktopEl) {
        desktopTick = () => {
          if (scrollSaveTimerRef.current != null) return;
          scrollSaveTimerRef.current = window.setTimeout(() => {
            scrollSaveTimerRef.current = null;
            if (desktopEl && desktopEl.scrollTop > 2) {
              saveScrollPosition(HOME_FEED_DESKTOP_SCROLL_KEY, desktopEl.scrollTop);
            }
          }, 450);
        };
        desktopEl.addEventListener('scroll', desktopTick, { passive: true });
      }
    }

    return () => {
      window.removeEventListener('scroll', tick);
      if (desktopEl && desktopTick) {
        desktopEl.removeEventListener('scroll', desktopTick);
      }
      if (scrollSaveTimerRef.current != null) {
        clearTimeout(scrollSaveTimerRef.current);
        scrollSaveTimerRef.current = null;
      }
    };
  }, [pathname, search]);

  return null;
}
