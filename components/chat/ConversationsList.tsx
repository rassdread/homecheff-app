'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MessageCircle, CheckCheck, Package } from 'lucide-react';
import Image from 'next/image';
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
import {
  CONVERSATION_LIST_ACTIVITY_EVENT,
  sortConversationsByActivity,
  type ConversationListActivityDetail,
} from '@/lib/chat/conversationListSort';

const NATIVE_CONV_LIST_KIND = 'conv_list';
const NATIVE_CONV_LIST_TTL_MS = 10 * 60 * 1000;

interface Conversation {
  id: string;
  title?: string;
  product?: {
    id: string;
    title: string;
    priceCents: number;
    Image: Array<{
      fileUrl: string;
      sortOrder: number;
    }>;
  };
  order?: {
    id: string;
    orderNumber: string | null;
    status: string;
    totalAmount: number;
    createdAt: string;
  };
  lastMessage?: {
    id: string;
    text: string | null;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_SHARE' | 'SYSTEM';
    orderNumber?: string | null;
    createdAt: string;
    readAt?: string | null;
    User: {
      id: string;
      name: string | null;
      username: string | null;
      profileImage: string | null;
      displayFullName?: boolean | null;
      displayNameOption?: string | null;
    };
  } | null;
  participants: Array<{
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  }>;
  otherParticipant?: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
  lastMessageAt: string | null;
  isActive: boolean;
  createdAt: string;
  /** Optioneel; voor toekomstige sortering / defensieve client-logica. */
  updatedAt?: string | null;
}

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  onMessagesRead?: () => void;
}

export default function ConversationsList({ onSelectConversation, onMessagesRead }: ConversationsListProps) {
  const { t } = useTranslation();
  const nativeMounted = useIsNativeAppMounted();
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
  }, [conversations.length, nativeMounted]);

  /** Dev: rode/groene/blauwe outlines + touch/scroll logs (alleen Android native shell). */
  useEffect(() => {
    const debugOn =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_DEBUG_MESSAGES_SCROLL === 'true';
    if (!debugOn || !nativeMounted || !isNativeAndroid()) return;
    const el = listScrollRef.current;
    if (!el) return;
    const html = document.documentElement;
    html.classList.add('hc-messages-scroll-debug');

    /** Scrollport = lijstcontainer (.hc-conversations-list-scroll), niet de buitenkolom. */
    const scrollPort = el;
    let lastEp = 0;
    const onTouchStart = (e: TouchEvent) => {
      const tgt = e.target instanceof Element ? e.target : null;
      console.debug('[messages-touch]', 'touchstart', {
        targetTag: tgt?.tagName,
        scrollTop: scrollPort.scrollTop,
      });
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const now = Date.now();
      if (now - lastEp < 180) return;
      lastEp = now;
      const top = document.elementFromPoint(t.clientX, t.clientY);
      const moveTarget = e.target instanceof Element ? e.target : null;
      console.debug('[messages-touch]', 'touchmove', {
        x: Math.round(t.clientX),
        y: Math.round(t.clientY),
        moveTargetTag: moveTarget?.tagName,
        elementFromPointTag: top?.tagName,
        topClass: typeof (top as HTMLElement)?.className === 'string' ? (top as HTMLElement).className : '',
        scrollTop: scrollPort.scrollTop,
      });
    };
    const onScroll = () => {
      console.debug('[messages-touch]', 'scroll', {
        scrollTop: scrollPort.scrollTop,
        port: 'list-scroll',
      });
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    scrollPort.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      html.classList.remove('hc-messages-scroll-debug');
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      scrollPort.removeEventListener('scroll', onScroll);
    };
  }, [conversations.length, nativeMounted]);

  useEffect(() => {
    const el = listScrollRef.current;
    if (!el || conversations.length === 0) return;
    const key = 'ui:messages-list';
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
  }, [conversations.length]);

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
        const list = sortConversationsByActivity(fallbackData.conversations || []);
        setConversations(list);
        writeConversationsListCache(userId, list);
        if (nativeMounted) {
          writeNativePersistedCache(NATIVE_CONV_LIST_KIND, userId, list);
        }
        return;
      }

      const { conversations: fetchedConversations } = await response.json();

      const sorted = sortConversationsByActivity(fetchedConversations ?? []);
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
    setConversations(sortConversationsByActivity(cached));
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

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === d.conversationId);
        if (idx === -1) {
          void loadConversations(false);
          return prev;
        }
        const lm = d.lastMessage;
        const merged = prev.map((c) =>
          c.id !== d.conversationId
            ? c
            : {
                ...c,
                lastMessageAt: d.lastMessageAt,
                lastMessage: {
                  id: lm.id,
                  text: lm.text,
                  messageType: lm.messageType as NonNullable<
                    Conversation['lastMessage']
                  >['messageType'],
                  orderNumber: lm.orderNumber,
                  createdAt: lm.createdAt,
                  readAt: lm.readAt ?? null,
                  User: {
                    id: lm.User.id,
                    name: lm.User.name ?? null,
                    username: lm.User.username ?? null,
                    profileImage: lm.User.profileImage ?? null,
                    displayFullName: lm.User.displayFullName ?? null,
                    displayNameOption: lm.User.displayNameOption ?? null,
                  },
                },
              }
        );
        const sorted = sortConversationsByActivity(merged);
        writeConversationsListCache(userId, sorted);
        if (nativeMounted) {
          writeNativePersistedCache(NATIVE_CONV_LIST_KIND, userId, sorted);
        }
        return sorted;
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

    if (diffInMinutes < 1) return 'Nu';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}u`;
    
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getLastMessagePreview = (lastMessage: Conversation['lastMessage']) => {
    if (!lastMessage) return 'Nog geen berichten';
    
    if (lastMessage.messageType === 'IMAGE') {
      return '📷 Foto';
    } else if (lastMessage.messageType === 'FILE') {
      return '📎 Bestand';
    } else if (lastMessage.messageType === 'SYSTEM') {
      return lastMessage.text || 'Systeembericht';
    }
    
    return lastMessage.text || 'Bericht';
  };

  const getLastMessageSender = (lastMessage: Conversation['lastMessage'], currentUser: any) => {
    if (!lastMessage || !lastMessage.User) return '';
    
    const currentUserId = currentUser?.id || '';
    const isOwn = lastMessage.User.id === currentUserId;
    
    if (isOwn) return 'Jij: ';
    
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

  /** Ruimte onder laatste rij (safe area); root-hoogte trekt bottom-nav al af via globals. */
  const listScrollPadBottom = 'pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.75rem))]';

  if (isLoading && conversations.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col animate-pulse',
          listShellPad,
          nativeMounted ? 'max-lg:overflow-hidden lg:overflow-hidden' : 'overflow-hidden'
        )}
        aria-busy
      >
        <div
          ref={listScrollRef}
          className="hc-conversations-list-scroll min-h-0 flex-1 touch-pan-y space-y-2 overflow-y-scroll overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
          ))}
        </div>
        <p className="shrink-0 pt-2 text-center text-sm text-gray-500">
          {t('messages.loadingConversations')}
        </p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">Nog geen gesprekken</p>
        <p className="text-sm">Start een gesprek door een product te bekijken!</p>
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
    if (!lm) return 'Gesprek gestart';
    const prefix = getLastMessageSender(lm, session?.user);
    let body = getLastMessagePreview(lm);
    if (lm.messageType === 'TEXT' && lm.text) {
      body = stripReferralNoise(lm.text, 'Bericht');
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
        <Image
          src={c.product.Image[0].fileUrl}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
      );
    }
    if (p?.profileImage) {
      return (
        <Image
          src={p.profileImage}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
      );
    }
    if (c.order) {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Package className="h-6 w-6 text-blue-600" aria-hidden />
        </div>
      );
    }
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
        <span className="text-sm font-bold text-white">
          {(p?.name || p?.username || c.title || 'G').charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        className={`shrink-0 border-b border-gray-200 bg-gray-50 ${nativeMounted ? 'px-3 py-2' : 'p-4'}`}
      >
        <div className="relative">
          <input
            type="text"
            placeholder={t('messages.searchConversationsPlaceholder')}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          />
          <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div
        ref={listScrollRef}
        data-hc-app-scroll="messages-list"
        className={cn(
          'hc-conversations-list-scroll min-h-0 flex-1 touch-pan-y overflow-y-scroll overscroll-y-contain [-webkit-overflow-scrolling:touch]',
          !nativeMounted && 'max-md:max-h-[calc(100dvh-9.75rem-env(safe-area-inset-bottom,0px))]',
          listScrollPadBottom
        )}
      >
        {conversations.map((conversation) => {
          const href = profileHrefFor(conversation);
          const unread = rowUnread(conversation);
          const lm = conversation.lastMessage;

          return (
            <div
              key={conversation.id}
              className={`flex items-stretch gap-2 border-b border-gray-100 ${nativeMounted ? 'px-2 py-1' : 'px-3 py-1.5'} sm:px-4`}
            >
              {href ? (
                <Link
                  href={href}
                  className="flex min-h-[48px] min-w-[48px] shrink-0 touch-manipulation select-none items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
                  aria-label={`${t('common.viewProfile')}: ${displayTitle(conversation)}`}
                  scroll={false}
                >
                  <span className="relative inline-flex">{avatarVisual(conversation)}</span>
                </Link>
              ) : (
                <div
                  className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center"
                  aria-hidden
                >
                  {avatarVisual(conversation)}
                </div>
              )}

              <div
                role="button"
                tabIndex={0}
                onClick={() => openConversation(conversation)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openConversation(conversation);
                  }
                }}
                className="hc-conversation-row-tap flex min-h-[48px] min-w-0 flex-1 touch-manipulation select-none flex-col justify-center gap-0.5 rounded-lg py-2 pl-1 pr-2 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {displayTitle(conversation)}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {unread && (
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600"
                        aria-label="Ongelezen"
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
                        Order
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
