'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageCircle, CheckCheck, Package } from 'lucide-react';
import UserCircleAvatar from '@/components/ui/UserCircleAvatar';
import { getDisplayName } from '@/lib/displayName';
import { useTranslation } from '@/hooks/useTranslation';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import {
  readConversationsListCache,
  writeConversationsListCache,
} from '@/lib/chat/sessionChatCache';
import {
  readNativePersistedCache,
  writeNativePersistedCache,
} from '@/lib/native/nativePersistedCache';
import { stripReferralNoise } from '@/lib/chat/stripReferralNoise';
import { saveScrollPosition } from '@/lib/appResumeCache';
import { cn } from '@/lib/utils';
import { isNativeAndroid } from '@/lib/native/capacitor';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  CONVERSATION_LIST_ACTIVITY_EVENT,
  sortConversationsByActivity,
  type ConversationListActivityDetail,
} from '@/lib/chat/conversationListSort';
import {
  normalizeConversationList,
  normalizeLastMessage,
  type NormalizedConversationListItem,
} from '@/lib/chat/normalizeConversation';
import { HC_BOTTOM_NAV_SCROLL_PADDING } from '@/lib/layout/bottomNavInset';

const NATIVE_CONV_LIST_KIND = 'conv_list';
const NATIVE_CONV_LIST_TTL_MS = 10 * 60 * 1000;

type Conversation = NormalizedConversationListItem;

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  onMessagesRead?: () => void;
}

/** Native Android: short tap opens chat/profile; drag ≥8px → scroll only (no preventDefault / capture). */
const TAP_MAX_MOVE_PX = 8;
const TAP_MAX_DURATION_MS = 500;

function useBoundedPointerTap(onTap: () => void) {
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const listenersRef = useRef<{
    up: (e: PointerEvent) => void;
    cancel: () => void;
  } | null>(null);

  const removeDocListeners = () => {
    if (typeof document === 'undefined') return;
    const L = listenersRef.current;
    if (L) {
      document.removeEventListener('pointerup', L.up);
      document.removeEventListener('pointercancel', L.cancel);
      listenersRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      removeDocListeners();
      startRef.current = null;
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (typeof document === 'undefined') return;
    removeDocListeners();
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };

    const up = (ev: PointerEvent) => {
      const s = startRef.current;
      removeDocListeners();
      startRef.current = null;
      if (!s) return;
      const dx = ev.clientX - s.x;
      const dy = ev.clientY - s.y;
      if (Math.hypot(dx, dy) >= TAP_MAX_MOVE_PX) return;
      if (Date.now() - s.t > TAP_MAX_DURATION_MS) return;
      onTapRef.current();
    };

    const cancel = () => {
      removeDocListeners();
      startRef.current = null;
    };

    listenersRef.current = { up, cancel };
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', cancel);
  };

  return { onPointerDown };
}

function NativeAndroidConversationRow({
  conversationId,
  rowPad,
  href,
  avatarVisual,
  rowMiddle,
  displayTitle,
  viewProfileLabel,
  onOpenChat,
  logTapDebug,
}: {
  conversationId: string;
  rowPad: string;
  href: string | null;
  avatarVisual: ReactNode;
  rowMiddle: ReactNode;
  displayTitle: string;
  viewProfileLabel: string;
  onOpenChat: () => void;
  logTapDebug: boolean;
}) {
  const router = useRouter();

  const chatTap = useBoundedPointerTap(() => {
    if (logTapDebug) {
      console.info('[hc-conv-native-debug]', 'row bounded tap → open', conversationId);
    }
    onOpenChat();
  });

  const profileTap = useBoundedPointerTap(() => {
    if (!href) return;
    void router.push(href);
  });

  return (
    <div
      className={cn(
        'conversation-row-native flex w-full touch-pan-y select-none items-stretch gap-2 border-b border-gray-100',
        rowPad,
        'sm:px-4'
      )}
    >
      {href ? (
        <div
          className="hc-conversation-avatar-tap flex min-h-[48px] min-w-[48px] shrink-0 touch-pan-y cursor-pointer items-center justify-center rounded-full"
          role="button"
          tabIndex={0}
          aria-label={viewProfileLabel}
          onPointerDown={profileTap.onPointerDown}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              void router.push(href);
            }
          }}
        >
          <span className="relative inline-flex">{avatarVisual}</span>
        </div>
      ) : (
        <div
          className="flex min-h-[48px] min-w-[48px] shrink-0 touch-pan-y items-center justify-center"
          aria-hidden
        >
          {avatarVisual}
        </div>
      )}
      <div
        className="flex min-h-[48px] min-w-0 flex-1 touch-pan-y flex-col justify-center"
        role="button"
        tabIndex={0}
        aria-label={displayTitle}
        onPointerDown={chatTap.onPointerDown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenChat();
          }
        }}
      >
        {rowMiddle}
      </div>
    </div>
  );
}

export default function ConversationsList({ onSelectConversation, onMessagesRead }: ConversationsListProps) {
  const { t, language } = useTranslation();
  const router = useRouter();
  const nativeMounted = useIsNativeAppMounted();
  const isDesktopMessages = useMediaQuery('(min-width: 1024px)');
  /** Capacitor smal scherm: geneste scroll (iOS); Android gebruikt body scroll — zie `nativeAndroidListBodyScroll`. */
  const nativeSingleScrollPort = Boolean(nativeMounted && !isDesktopMessages);
  /** Android WebView: geen inner scrollport — pagina/#main-content scrollt (nested scroll faalt). */
  const nativeAndroidListBodyScroll = Boolean(
    nativeSingleScrollPort && isNativeAndroid()
  );
  /** Android native list: volle rij + bounded pointer-tap (geen chevron). */
  const nativeAndroidConversationRows = Boolean(
    nativeSingleScrollPort && isNativeAndroid()
  );
  const { data: session, status: sessionStatus } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** WebView-scroll diagnose: dev standaard; productie alleen met NEXT_PUBLIC_DEBUG_MESSAGES_SCROLL=true. */
  useEffect(() => {
    const debugOn =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_DEBUG_MESSAGES_SCROLL === 'true';
    if (!debugOn) return;
    const el = listScrollRef.current;
    if (!el) return;
    const columnEl = el.closest('.hc-native-messages-list-column') as HTMLElement | null;
    const log = () => {
      const listEl = listScrollRef.current;
      if (!listEl) return;
      const root = listEl.closest('.hc-messages-root');
      const column = listEl.closest('.hc-native-messages-list-column') as HTMLElement | null;
      const scrollPort = listEl;
      const main = document.getElementById('main-content');
      const cs = window.getComputedStyle(listEl);
      const cCol = column ? window.getComputedStyle(column) : null;
      const html = document.documentElement;
      const body = document.body;
      console.debug('[messages-scroll-debug]', {
        rootClientHeight: root?.clientHeight,
        rootScrollHeight: root?.scrollHeight,
        mainClientHeight: main?.clientHeight,
        mainScrollHeight: main?.scrollHeight,
        columnClientHeight: column?.clientHeight,
        columnScrollHeight: column?.scrollHeight,
        columnOverflowY: cCol?.overflowY,
        scrollPortClientHeight: scrollPort.clientHeight,
        scrollPortScrollHeight: scrollPort.scrollHeight,
        listClientHeight: listEl.clientHeight,
        listScrollHeight: listEl.scrollHeight,
        overflowY: cs.overflowY,
        touchAction: cs.touchAction,
        pointerEvents: cs.pointerEvents,
        bodyOverflow: window.getComputedStyle(body).overflowY,
        htmlOverflow: window.getComputedStyle(html).overflowY,
        viewportHeight: window.innerHeight,
        nativeCapacitor: html.classList.contains('hc-native-capacitor'),
      });
    };
    log();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(log) : null;
    ro?.observe(el);
    if (columnEl) ro?.observe(columnEl);
    return () => ro?.disconnect();
  }, [conversations.length, nativeMounted, nativeAndroidListBodyScroll]);

  /** Native Android: scrollport + elementFromPoint (dev of NEXT_PUBLIC_DEBUG_MESSAGES_SCROLL). */
  const touchDebugLastLogRef = useRef(0);
  useEffect(() => {
    const debugOn =
      (process.env.NODE_ENV !== 'production' ||
        process.env.NEXT_PUBLIC_DEBUG_MESSAGES_SCROLL === 'true') &&
      nativeSingleScrollPort &&
      isNativeAndroid() &&
      !nativeAndroidListBodyScroll;
    if (!debugOn) return;
    const el = listScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      console.info('[hc-conv-native-debug]', 'scrollport scroll', { scrollTop: el.scrollTop });
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const now = Date.now();
      if (now - touchDebugLastLogRef.current < 180) return;
      touchDebugLastLogRef.current = now;
      const x = touch.clientX;
      const y = touch.clientY;
      const topEl = document.elementFromPoint(x, y);
      const st = el.scrollTop;
      const tag = topEl?.nodeName ?? '';
      const cls =
        topEl instanceof Element && typeof topEl.className === 'string'
          ? topEl.className
          : '';
      const inScrollport = topEl ? el.contains(topEl) : false;
      requestAnimationFrame(() => {
        console.info('[hc-conv-native-debug]', 'touchmove elementFromPoint', {
          x,
          y,
          tag,
          class: cls.slice(0, 200),
          inScrollport,
          scrollTop: st,
          scrollTopAfterRaf: el.scrollTop,
        });
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [conversations.length, nativeSingleScrollPort, nativeAndroidListBodyScroll]);

  useEffect(() => {
    if (conversations.length === 0) return;
    const key = 'ui:messages-list';

    if (nativeAndroidListBodyScroll) {
      const tick = () => {
        if (scrollSaveTimerRef.current != null) return;
        scrollSaveTimerRef.current = window.setTimeout(() => {
          scrollSaveTimerRef.current = null;
          const y = window.scrollY;
          if (y > 2) {
            try {
              saveScrollPosition(key, y);
            } catch {
              /* ignore */
            }
          }
        }, 450);
      };
      window.addEventListener('scroll', tick, { passive: true });
      return () => {
        window.removeEventListener('scroll', tick);
        if (scrollSaveTimerRef.current != null) {
          clearTimeout(scrollSaveTimerRef.current);
          scrollSaveTimerRef.current = null;
        }
      };
    }

    const el = listScrollRef.current;
    if (!el) return;
    const tick = () => {
      if (scrollSaveTimerRef.current != null) return;
      scrollSaveTimerRef.current = window.setTimeout(() => {
        scrollSaveTimerRef.current = null;
        const y = el.scrollTop;
        if (y > 2) {
          try {
            saveScrollPosition(key, y);
          } catch {
            /* ignore */
          }
        }
      }, 450);
    };
    el.addEventListener('scroll', tick, { passive: true });
    return () => {
      el.removeEventListener('scroll', tick);
      if (scrollSaveTimerRef.current != null) {
        clearTimeout(scrollSaveTimerRef.current);
        scrollSaveTimerRef.current = null;
      }
    };
  }, [conversations.length, nativeAndroidListBodyScroll]);

  const loadConversations = useCallback(async (showLoading: boolean) => {
    if (!userId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const response = await fetch('/api/conversations-fast', {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ConversationsList] ❌ Fast API failed:', response.status, errorText);

        const fallbackResponse = await fetch('/api/conversations', {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!fallbackResponse.ok) {
          throw new Error(`Failed to load conversations: ${fallbackResponse.status}`);
        }

        const fallbackData = await fallbackResponse.json();
        const list = sortConversationsByActivity(
          normalizeConversationList(fallbackData.conversations ?? [])
        );
        setConversations(list);
        writeConversationsListCache(userId, list);
        if (nativeMounted) {
          writeNativePersistedCache(NATIVE_CONV_LIST_KIND, userId, list);
        }
        return;
      }

      const { conversations: fetchedConversations } = await response.json();

      const sorted = sortConversationsByActivity(
        normalizeConversationList(fetchedConversations ?? [])
      );
      setConversations(sorted);
      writeConversationsListCache(userId, sorted);
      if (nativeMounted) {
        writeNativePersistedCache(
          NATIVE_CONV_LIST_KIND,
          userId,
          sorted
        );
      }
    } catch (error) {
      console.error('[ConversationsList] ❌ Critical error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, nativeMounted]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus !== 'authenticated' || !userId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    let cached = readConversationsListCache<Conversation>(userId);
    if (nativeMounted && cached.length === 0) {
      const persisted = readNativePersistedCache<Conversation[]>(
        NATIVE_CONV_LIST_KIND,
        userId,
        NATIVE_CONV_LIST_TTL_MS
      );
      if (persisted?.length) cached = persisted;
    }
    setConversations(
      sortConversationsByActivity(normalizeConversationList(cached))
    );
    setIsLoading(cached.length === 0);
    void loadConversations(cached.length === 0);
  }, [sessionStatus, userId, loadConversations, nativeMounted]);

  // Altijd lijst verversen bij read/unread-events — ook op /messages zonder onMessagesRead-prop.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRefresh = () => {
      void loadConversations(false);
    };

    const handleUnreadCountUpdate = () => {
      void loadConversations(false);
    };

    window.addEventListener('messagesRead', handleRefresh);
    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate);

    return () => {
      window.removeEventListener('messagesRead', handleRefresh);
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate);
    };
  }, [loadConversations]);

  /** Open thread: nieuw bericht (zenden/ontvangen) → direct bovenaan sorteren. */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onActivity = (ev: Event) => {
      const e = ev as CustomEvent<ConversationListActivityDetail>;
      const d = e.detail;
      if (!d?.conversationId || !d.lastMessage) return;

      const lmNorm = normalizeLastMessage(d.lastMessage);
      if (!lmNorm) {
        void loadConversations(false);
        return;
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === d.conversationId);
        if (idx === -1) {
          void loadConversations(false);
          return prev;
        }
        const merged = prev.map((c) =>
          c.id !== d.conversationId
            ? c
            : {
                ...c,
                lastMessageAt: d.lastMessageAt ?? lmNorm.createdAt,
                lastMessage: lmNorm,
              }
        );
        const sorted = sortConversationsByActivity(merged);
        const safe = normalizeConversationList(sorted);
        writeConversationsListCache(userId, safe);
        if (nativeMounted) {
          writeNativePersistedCache(NATIVE_CONV_LIST_KIND, userId, safe);
        }
        return safe;
      });
    };

    window.addEventListener(CONVERSATION_LIST_ACTIVITY_EVENT, onActivity as EventListener);
    return () => {
      window.removeEventListener(CONVERSATION_LIST_ACTIVITY_EVENT, onActivity as EventListener);
    };
  }, [loadConversations, nativeMounted, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshFromLifecycle = () => {
      void loadConversations(false);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshFromLifecycle();
      }
    };
    const onPageShow = (_event: PageTransitionEvent) => {
      refreshFromLifecycle();
    };
    window.addEventListener('focus', refreshFromLifecycle);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', refreshFromLifecycle);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadConversations]);

  /** Tijdstip voor rij (defensief: API kan lastMessageAt tijdelijk missen). */
  const listActivityTimestamp = (c: Conversation): string | null =>
    c.lastMessageAt ?? c.lastMessage?.createdAt ?? c.updatedAt ?? c.createdAt ?? null;

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (!Number.isFinite(date.getTime())) return '';

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('messages.timeJustNow');
    if (diffInMinutes < 60) return t('messages.timeMinutesShort', { count: diffInMinutes });
    if (diffInMinutes < 1440) {
      return t('messages.timeHoursShort', { count: Math.floor(diffInMinutes / 60) });
    }

    return date.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getLastMessagePreview = (lastMessage: Conversation['lastMessage']) => {
    if (!lastMessage) return 'Nog geen berichten';
    
    if (lastMessage.messageType === 'IMAGE') {
      return '📷 Foto';
    } else if (lastMessage.messageType === 'FILE') {
      return '📎 Bestand';
    } else if (lastMessage.messageType === 'SYSTEM' || lastMessage.messageType === 'PROPOSAL_SYSTEM') {
      return lastMessage.text || 'Systeembericht';
    } else if (lastMessage.messageType === 'PROPOSAL') {
      return '📋 Voorstel';
    }
    
    return lastMessage.text || 'Bericht';
  };

  const getLastMessageSender = (lastMessage: Conversation['lastMessage'], currentUser: any) => {
    if (!lastMessage || !lastMessage.User) return '';
    
    const currentUserId = currentUser?.id || '';
    const isOwn = lastMessage.User.id === currentUserId;
    
    if (isOwn) return t('messages.previewYouPrefix');
    
    // Show sender name for received messages in preview
    const senderName = getDisplayName(lastMessage.User);
    return senderName ? `${senderName}: ` : '';
  };

  // Get current user for checking message ownership
  const getCurrentUserId = () => {
    return (session?.user as any)?.id || '';
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?limit=1`,
        {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (response.ok) {
        if (onMessagesRead) {
          onMessagesRead();
        }
        try {
          const countRes = await fetch('/api/messages/unread-count', {
            cache: 'no-store',
            credentials: 'include',
          });
          const countData = countRes.ok ? await countRes.json() : {};
          if (typeof countData.count === 'number') {
            window.dispatchEvent(
              new CustomEvent('unreadCountUpdate', {
                detail: { unreadCount: countData.count },
              })
            );
          }
        } catch {
          /* ignore */
        }
        window.dispatchEvent(
          new CustomEvent('messagesRead', {
            detail: { conversationId },
          })
        );
      } else {
        void loadConversations(false);
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      void loadConversations(false);
    }
  };

  const listShellPad = nativeMounted ? 'p-3' : 'p-4';

  /** Mobiel web + native iOS scrollport: extra ruimte onder laatste rij (tabbalk zit buiten dit vlak of al in parent-budget). */
  const listScrollPadBottom =
    'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]';
  /** Native iOS scrollport: zelfde kleine inset als web inner list. */
  const listScrollPadNative =
    'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]';
  /** Android native: document/#main-content scroll — reserveer tabbalk + safe-area onder de lijst. */
  const listBodyScrollPadBottom = HC_BOTTOM_NAV_SCROLL_PADDING;

  const searchChrome = (
    <div
      className={`shrink-0 border-b border-gray-200 bg-gray-50 ${nativeMounted ? 'px-3 py-2' : 'p-4'}`}
    >
      <div className="relative">
        <input
          type="text"
          placeholder={t('messages.searchConversationsPlaceholder')}
          className="w-full min-h-[44px] rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
        />
        <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );

  if (isLoading && conversations.length === 0) {
    const skeletonRows = [0, 1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex min-h-[52px] items-center gap-3 border-b border-gray-100 py-2"
      >
        <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex justify-between gap-2">
            <div className="h-3.5 w-28 rounded bg-gray-200" />
            <div className="h-3 w-10 rounded bg-gray-100" />
          </div>
          <div className="h-3 w-full rounded bg-gray-100" />
        </div>
      </div>
    ));

    if (nativeAndroidListBodyScroll) {
      return (
        <div
          ref={listScrollRef}
          className="flex flex-col animate-pulse"
          data-hc-messages-list-window-scroll="true"
          data-hc-app-scroll="messages-list"
          aria-busy
        >
          <div className="hc-native-conversations-scrollport flex flex-col">
            {searchChrome}
            <div
              className={cn(
                'hc-conversations-list-scroll flex flex-col space-y-2',
                listShellPad,
                listBodyScrollPadBottom
              )}
            >
              {skeletonRows}
            </div>
          </div>
          <p className="shrink-0 px-3 pb-2 pt-1 text-center text-sm text-gray-500">
            {t('messages.loadingConversations')}
          </p>
        </div>
      );
    }

    if (nativeSingleScrollPort) {
      return (
        <div
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden animate-pulse"
          aria-busy
        >
          <div
            ref={listScrollRef}
            data-hc-app-scroll="messages-list"
            className="hc-native-conversations-scrollport flex min-h-0 flex-1 flex-col overflow-y-scroll touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch]"
          >
            {searchChrome}
            <div
              className={cn(
                'hc-conversations-list-scroll flex flex-col space-y-2',
                listShellPad,
                listScrollPadNative
              )}
            >
              {skeletonRows}
            </div>
            <p className="shrink-0 px-3 pb-2 pt-1 text-center text-sm text-gray-500">
              {t('messages.loadingConversations')}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex min-h-0 flex-col animate-pulse',
          'h-full flex-1 lg:h-full',
          'max-lg:min-h-0 max-lg:flex-1',
          listShellPad,
          nativeMounted ? 'max-lg:overflow-hidden lg:overflow-hidden' : 'overflow-hidden'
        )}
        aria-busy
      >
        <div
          ref={listScrollRef}
          className={cn(
            'hc-conversations-list-scroll min-h-0 flex-1 touch-pan-y space-y-2 overscroll-y-contain [-webkit-overflow-scrolling:touch]',
            'overflow-y-auto',
            'lg:overflow-y-scroll',
            listScrollPadBottom
          )}
        >
          {skeletonRows}
        </div>
        <p className="shrink-0 pt-2 text-center text-sm text-gray-500">
          {t('messages.loadingConversations')}
        </p>
      </div>
    );
  }

    if (conversations.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-8 text-gray-500',
          nativeAndroidListBodyScroll && HC_BOTTOM_NAV_SCROLL_PADDING
        )}
      >
        <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">{t('messages.noConversationsYet')}</p>
        <p className="text-sm">{t('messages.startConversation')}</p>
      </div>
    );
  }

  const openConversation = (conversation: Conversation) => {
    const uid = getCurrentUserId();
    const lm = conversation.lastMessage;
    if (
      lm &&
      lm.User?.id &&
      lm.User.id !== uid &&
      !lm.readAt
    ) {
      const nowIso = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) =>
          c.id !== conversation.id || !c.lastMessage
            ? c
            : {
                ...c,
                lastMessage: { ...c.lastMessage, readAt: nowIso },
              }
        )
      );
    }
    onSelectConversation(conversation);
    void markConversationAsRead(conversation.id);
  };

  const primaryParticipant = (c: Conversation) =>
    c.otherParticipant || c.participants?.[0];

  const profileHrefFor = (c: Conversation): string | null => {
    const p = primaryParticipant(c);
    const u = p?.username?.trim();
    return u ? `/user/${encodeURIComponent(u)}` : null;
  };

  const displayTitle = (c: Conversation) => {
    const p = primaryParticipant(c);
    return p ? getDisplayName(p) : c.title || 'Gesprek';
  };

  const previewLine = (c: Conversation): string => {
    const lm = c.lastMessage;
    if (!lm) return t('messages.conversationStarted');
    const prefix = getLastMessageSender(lm, session?.user);
    let body = getLastMessagePreview(lm);
    if (lm.messageType === 'TEXT' && lm.text) {
      body = stripReferralNoise(lm.text, t('messages.previewTextFallback'));
    }
    return `${prefix}${body}`;
  };

  const rowUnread = (c: Conversation) =>
    Boolean(
      c.lastMessage &&
        c.lastMessage.User?.id &&
        c.lastMessage.User.id !== getCurrentUserId() &&
        !c.lastMessage.readAt
    );

  const avatarVisual = (c: Conversation) => {
    const p = primaryParticipant(c);
    if (c.product?.Image?.[0]) {
      return (
        <UserCircleAvatar
          src={c.product.Image[0].fileUrl}
          alt={c.product?.title || t('common.dish')}
          size="lg"
        />
      );
    }
    if (p?.profileImage) {
      return (
        <UserCircleAvatar
          src={p.profileImage}
          alt={getDisplayName(p)}
          size="lg"
          nameForInitial={getDisplayName(p)}
        />
      );
    }
    if (c.order) {
      return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Package className="h-6 w-6 text-blue-600" aria-hidden />
        </div>
      );
    }
    return (
      <UserCircleAvatar
        src={null}
        alt={displayTitle(c)}
        size="lg"
        nameForInitial={displayTitle(c)}
      />
    );
  };

  const logNativeConvRowBoundedTap =
    nativeAndroidConversationRows &&
    (process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_DEBUG_MESSAGES_SCROLL === 'true');

  const renderConversationRows = () =>
    conversations.map((conversation) => {
      const href = profileHrefFor(conversation);
      const unread = rowUnread(conversation);
      const lm = conversation.lastMessage;
      const rowPad = nativeMounted ? 'px-2 py-1' : 'px-3 py-1.5';

      const rowMiddle = (
        <div className="flex min-h-[48px] min-w-0 flex-1 touch-pan-y flex-col justify-center gap-0.5 rounded-lg py-2 pl-1 pr-2 text-left">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-medium text-gray-900">
              {displayTitle(conversation)}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {unread && (
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600"
                  aria-label={t('messages.unreadLabel')}
                />
              )}
              <time
                className="whitespace-nowrap text-[11px] tabular-nums text-gray-400"
                dateTime={listActivityTimestamp(conversation) ?? undefined}
              >
                {formatTime(listActivityTimestamp(conversation))}
              </time>
            </span>
          </div>

          {(conversation.product || conversation.order) && (
            <div className="flex min-w-0 flex-wrap gap-1">
              {conversation.product && (
                <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                  <Package className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                  <span className="truncate">{conversation.product.title}</span>
                </span>
              )}
              {conversation.order && (
                <span className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  {t('messages.orderLabel')}
                  {conversation.order.orderNumber
                    ? ` #${conversation.order.orderNumber}`
                    : ''}
                </span>
              )}
            </div>
          )}

          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-xs leading-snug text-gray-500">
              {previewLine(conversation)}
            </p>
            {lm?.User?.id === getCurrentUserId() && (
              <CheckCheck
                className={`h-4 w-4 shrink-0 ${
                  lm.readAt ? 'text-blue-500' : 'text-gray-400'
                }`}
                aria-hidden
              />
            )}
          </div>
        </div>
      );

      if (nativeAndroidConversationRows) {
        return (
          <NativeAndroidConversationRow
            key={conversation.id}
            conversationId={conversation.id}
            rowPad={rowPad}
            href={href}
            avatarVisual={avatarVisual(conversation)}
            rowMiddle={rowMiddle}
            displayTitle={displayTitle(conversation)}
            viewProfileLabel={t('messages.viewProfile', {
              name: displayTitle(conversation),
            })}
            onOpenChat={() => openConversation(conversation)}
            logTapDebug={logNativeConvRowBoundedTap}
          />
        );
      }

      return (
        <div
          key={conversation.id}
          className={`conversation-row flex cursor-pointer select-none items-stretch gap-2 border-b border-gray-100 transition-colors hover:bg-gray-50 active:bg-gray-100 ${rowPad} sm:px-4`}
          onClick={() => openConversation(conversation)}
        >
          {href ? (
            <div
              className="hc-conversation-avatar-tap flex min-h-[48px] min-w-[48px] shrink-0 cursor-pointer select-none items-center justify-center rounded-full"
              aria-label={`${t('common.viewProfile')}: ${displayTitle(conversation)}`}
              onClick={(e) => {
                e.stopPropagation();
                void router.push(href);
              }}
            >
              <span className="relative inline-flex">{avatarVisual(conversation)}</span>
            </div>
          ) : (
            <div
              className="conversation-row flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center"
              aria-hidden
            >
              {avatarVisual(conversation)}
            </div>
          )}
          {rowMiddle}
        </div>
      );
    });

  return nativeAndroidListBodyScroll ? (
    <div
      ref={listScrollRef}
      className="flex flex-col"
      data-hc-messages-list-window-scroll="true"
      data-hc-app-scroll="messages-list"
    >
      <div className="hc-native-conversations-scrollport flex flex-col">
        {searchChrome}
        <div
          className={cn(
            'hc-conversations-list-scroll flex flex-col',
            listShellPad,
            listBodyScrollPadBottom
          )}
        >
          {renderConversationRows()}
        </div>
      </div>
    </div>
  ) : nativeSingleScrollPort ? (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={listScrollRef}
        data-hc-app-scroll="messages-list"
        className="hc-native-conversations-scrollport flex min-h-0 flex-1 flex-col overflow-y-scroll touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch]"
      >
        {searchChrome}
        <div
          className={cn(
            'hc-conversations-list-scroll flex flex-col',
            listShellPad,
            listScrollPadNative
          )}
        >
          {renderConversationRows()}
        </div>
      </div>
    </div>
  ) : (
    <div
      className={cn(
        'flex min-h-0 flex-col',
        'h-full flex-1 lg:h-full',
        'max-lg:min-h-0 max-lg:flex-1'
      )}
    >
      {searchChrome}
      <div
        ref={listScrollRef}
        data-hc-app-scroll="messages-list"
        className={cn(
          'hc-conversations-list-scroll min-h-0 flex-1 touch-pan-y overscroll-y-contain [-webkit-overflow-scrolling:touch]',
          'overflow-y-auto',
          'lg:overflow-y-scroll',
          listScrollPadBottom
        )}
      >
        {renderConversationRows()}
      </div>
    </div>
  );
}
