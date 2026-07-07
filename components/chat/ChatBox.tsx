'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Send,
  Loader2,
  Trash2,
  RefreshCw,
  BadgeCheck,
  ClipboardList,
} from 'lucide-react';
import UserCircleAvatar from '@/components/ui/UserCircleAvatar';
import Link from 'next/link';
import { getDisplayName } from '@/lib/displayName';
import { getPusherClient } from '@/lib/pusher';
import EmojiPickerButton from './EmojiPicker';
import { useTranslation } from '@/hooks/useTranslation';
import { mergePusherChatMessage } from '@/lib/chat/mergePusherChatMessage';
import { dispatchConversationListActivity } from '@/lib/chat/conversationListSort';
import { mergeServerChatMessages } from '@/lib/chat/mergeServerChatMessages';
import {
  normalizeChatThreadMessage,
  normalizeChatThreadMessageList,
  normalizeRelationshipContext,
} from '@/lib/chat/normalizeConversation';
import { reportMessagingDiagnostic } from '@/lib/chat/messagingDiagnostics';
import {
  readMessagesCache,
  writeMessagesCache,
} from '@/lib/chat/sessionChatCache';
import { readNativePersistedCache } from '@/lib/native/nativePersistedCache';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { pushAndroidBackHandler } from '@/lib/native/androidCreateFlowBack';
import { saveLastConversationId } from '@/lib/appResumeCache';
import { cn } from '@/lib/utils';
import ConversationContextHeader from './ConversationContextHeader';
import type { ResolvedConversationHeader } from '@/lib/communication/resolveConversationHeader';
import ChatThreadMessageRow from './ChatThreadMessageRow';
import CreateProposalSheet from './proposals/CreateProposalSheet';
import ReportContentButton from '@/components/reporting/ReportContentButton';
import type { ChatThreadMessage } from './chatThreadTypes';
import type {
  CommunityOrderDTO,
  ProposalDTO,
} from '@/lib/proposals/proposal-types';

export interface ChatBoxProps {
  conversationId: string;
  otherParticipant: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
    /** Verkoper met geverifieerd bezorgprofiel (optioneel, van conversation-API). */
    sellerVerified?: boolean | null;
  };
  onBack?: () => void;
  /** Profiel/mobiel: handmatig verversen + gesprek wissen. */
  showConversationTools?: boolean;
  /** bv. `/messages/[id]`: terug altijd tonen, ook op desktop */
  showBackOnDesktop?: boolean;
  /** Lichte context vanuit gesprek-API (geen presence-tracking). */
  relationshipContext?: {
    youFollowThem: boolean;
    theyFollowYou: boolean;
    messageCount: number;
    productTitle?: string | null;
    productCategory?: string | null;
  } | null;
  /** Context-first header (product/order/general). */
  contextHeader?: ResolvedConversationHeader | null;
  /** Open CreateProposalSheet once when landing from a proposal CTA deep-link. */
  initialOpenProposal?: boolean;
  /** Called after proposal sheet was auto-opened (e.g. to clear URL param). */
  onProposalSheetAutoOpened?: () => void;
}

export default function ChatBox({
  conversationId,
  otherParticipant,
  onBack,
  showConversationTools = false,
  showBackOnDesktop = false,
  relationshipContext = null,
  contextHeader = null,
  initialOpenProposal = false,
  onProposalSheetAutoOpened,
}: ChatBoxProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [pusherConnected, setPusherConnected] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [proposalsById, setProposalsById] = useState<Record<string, ProposalDTO>>({});
  const [communityOrdersByProposalId, setCommunityOrdersByProposalId] = useState<
    Record<string, CommunityOrderDTO>
  >({});
  const [deliveryRequestsByProposalId, setDeliveryRequestsByProposalId] = useState<
    Record<string, import('@/lib/delivery/delivery-marketplace-types').DeliveryRequestDTO>
  >({});
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const proposalAutoOpenedRef = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const hasMoreOlderRef = useRef(false);
  const oldestLoadedPageRef = useRef(1);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  /** Pusher "typing cleared" timer: opruimen bij unmount om setState na unmount te vermijden (mobile/WebView). */
  const pusherTypingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pusherRef = useRef<any>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  /** Monotoon per hydrate-run: trage fetches na gesprekswissel of effect-restart worden genegeerd. */
  const conversationEpochRef = useRef(0);
  /** Aborteren van lopende send bij unmount (geen state-updates van trage POST). */
  const sendFlightRef = useRef<AbortController | null>(null);
  /** Pusher effect generation: events van een vorig subscribe-blok negeren tot unsubscribe klaar is. */
  const pusherUiGenRef = useRef(0);
  /** REST online-status run id: overschrijf geen state van een vorige effect-run. */
  const statusPollRunIdRef = useRef(0);
  const nativeMounted = useIsNativeAppMounted();
  const { data: session } = useSession();

  const peerId = (otherParticipant?.id ?? '').trim();

  const loadProposals = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/proposals`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        proposals?: ProposalDTO[];
        communityOrders?: CommunityOrderDTO[];
        deliveryRequestsByProposalId?: Record<
          string,
          import('@/lib/delivery/delivery-marketplace-types').DeliveryRequestDTO
        >;
      };
      const map: Record<string, ProposalDTO> = {};
      for (const p of data.proposals ?? []) {
        map[p.id] = p;
      }
      const orderMap: Record<string, CommunityOrderDTO> = {};
      for (const o of data.communityOrders ?? []) {
        orderMap[o.proposalId] = o;
      }
      setProposalsById(map);
      setCommunityOrdersByProposalId(orderMap);
      setDeliveryRequestsByProposalId(data.deliveryRequestsByProposalId ?? {});
    } catch {
      /* non-fatal */
    }
  }, [conversationId]);

  useEffect(() => {
    if (!initialOpenProposal || proposalAutoOpenedRef.current || isLoading) {
      return;
    }
    proposalAutoOpenedRef.current = true;
    setShowCreateProposal(true);
    onProposalSheetAutoOpened?.();
  }, [initialOpenProposal, isLoading, onProposalSheetAutoOpened]);

  const handleProposalUpdated = useCallback(
    (
      proposal: ProposalDTO,
      extra?: {
        communityOrder?: CommunityOrderDTO;
        nextAction?: import('@/lib/proposals/proposal-accept-routing').ProposalNextAction;
        checkoutUrl?: string | null;
        deliveryRequest?: import('@/lib/delivery/delivery-marketplace-types').DeliveryRequestDTO | null;
      },
    ) => {
      setProposalsById((prev) => ({ ...prev, [proposal.id]: proposal }));
      if (extra?.communityOrder) {
        setCommunityOrdersByProposalId((prev) => ({
          ...prev,
          [proposal.id]: extra.communityOrder!,
        }));
      }
      if (extra?.deliveryRequest) {
        setDeliveryRequestsByProposalId((prev) => ({
          ...prev,
          [proposal.id]: extra.deliveryRequest!,
        }));
      }
    },
    [],
  );

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    return () => {
      sendFlightRef.current?.abort();
      sendFlightRef.current = null;
    };
  }, []);

  /** Android hardware back: match UI “terug naar berichten” — never pop to another thread. */
  useEffect(() => {
    if (!onBack || !nativeMounted) return;
    return pushAndroidBackHandler(() => {
      onBack();
      return true;
    });
  }, [onBack, nativeMounted]);

  useEffect(() => {
    if (!conversationId) return;
    try {
      saveLastConversationId(conversationId);
    } catch {
      /* ignore */
    }
  }, [conversationId]);

  const scrollToBottomSoon = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  const updateNearBottom = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const threshold = 160;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    isNearBottomRef.current = true;
  }, []);

  /** Sync thread naar session cache (zelfde bron als hydrate); mag nooit crashen. */
  const persistThreadMsgs = useCallback(
    (msgs: ChatThreadMessage[]) => {
      if (!conversationId) return;
      try {
        writeMessagesCache(conversationId, msgs, currentUserId || null);
      } catch {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ChatBox] writeMessagesCache failed (non-fatal)');
        }
      }
    },
    [conversationId, currentUserId]
  );

  // Current user: JWT sessie bevat id — voorkomt extra roundtrip naar /api/profile/me
  useEffect(() => {
    const sid = (session?.user as { id?: string } | undefined)?.id;
    if (sid) {
      setCurrentUserId(sid);
      return;
    }
    const fetchUser = async () => {
      if (!session?.user?.email) return;
      try {
        const res = await fetch('/api/profile/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.id) setCurrentUserId(data.user.id);
        }
      } catch {
        /* ignore */
      }
    };
    void fetchUser();
  }, [session]);

  /**
   * messages-fast markeert niet als gelezen; deze sync roept dezelfde GET aan als de lijst
   * (updateMany readAt) zodat deep links en thread zonder list-klik toch de DB bijwerken.
   */
  const syncReadReceiptsWithServer = useCallback(
    async (cid: string) => {
      if (!cid || !currentUserId) return;
      try {
        const r = await fetch(`/api/conversations/${cid}/messages?limit=1`, {
          cache: 'no-store',
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!r.ok) return;
        const nowIso = new Date().toISOString();
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.senderId !== currentUserId && !m.readAt
              ? { ...m, readAt: nowIso }
              : m
          );
          queueMicrotask(() => {
            persistThreadMsgs(next);
          });
          return next;
        });
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
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        window.dispatchEvent(
          new CustomEvent('messagesRead', {
            detail: { conversationId: cid },
          })
        );
      } catch {
        /* ignore */
      }
    },
    [currentUserId, persistThreadMsgs]
  );

  const loadMessages = useCallback(
    async (
      isInitialLoad = false,
      signal?: AbortSignal,
      requestEpoch?: number
    ) => {
      const cid = conversationId;
      if (!cid) return;

      const epochAtStart =
        requestEpoch !== undefined
          ? requestEpoch
          : conversationEpochRef.current;
      const stale = () =>
        signal?.aborted ||
        epochAtStart !== conversationEpochRef.current;

      try {
        const res = await fetch(
          `/api/conversations/${cid}/messages-fast?limit=50`,
          {
            cache: 'no-store',
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
            signal,
          }
        );

        if (stale()) return;

        if (res.ok) {
          let data: { messages?: ChatThreadMessage[]; hasMore?: boolean };
          try {
            data = await res.json();
          } catch {
            if (stale()) return;
            setIsLoading(false);
            return;
          }
          if (stale()) return;

          const newMessages = normalizeChatThreadMessageList(data.messages);
          if (isInitialLoad) {
            setMessages(newMessages);
            persistThreadMsgs(newMessages);
            oldestLoadedPageRef.current = 1;
            hasMoreOlderRef.current = Boolean(data.hasMore);
            void syncReadReceiptsWithServer(cid);
          } else {
            setMessages((prev) => {
              if (epochAtStart !== conversationEpochRef.current) return prev;
              const merged = mergeServerChatMessages(prev, newMessages);
              if (
                merged.length === prev.length &&
                merged.every(
                  (m, i) =>
                    m.id === prev[i]?.id &&
                    m.readAt === prev[i]?.readAt &&
                    m.deliveredAt === prev[i]?.deliveredAt
                )
              ) {
                return prev;
              }
              persistThreadMsgs(merged);
              return merged;
            });
          }

          if (stale()) return;
          setIsLoading(false);
          if (isInitialLoad) {
            requestAnimationFrame(() => {
              scrollToBottomInstant();
            });
          } else if (isNearBottomRef.current) {
            scrollToBottomSoon('smooth');
          }
        } else {
          const fallbackRes = await fetch(
            `/api/conversations/${cid}/messages?limit=50`,
            {
              cache: 'no-store',
              credentials: 'include',
              headers: { 'Cache-Control': 'no-cache' },
              signal,
            }
          );
          if (stale()) return;
          if (fallbackRes.ok) {
            let fallbackData: { messages?: ChatThreadMessage[] };
            try {
              fallbackData = await fallbackRes.json();
            } catch {
              if (stale()) return;
              setIsLoading(false);
              return;
            }
            if (stale()) return;

            const list = normalizeChatThreadMessageList(fallbackData.messages);
            if (isInitialLoad) {
              setMessages(list);
              persistThreadMsgs(list);
              oldestLoadedPageRef.current = 1;
              hasMoreOlderRef.current = list.length >= 50;
              void syncReadReceiptsWithServer(cid);
            } else {
              setMessages((prev) => {
                if (epochAtStart !== conversationEpochRef.current) return prev;
                const merged = mergeServerChatMessages(prev, list);
                persistThreadMsgs(merged);
                return merged;
              });
            }
          }
          if (stale()) return;
          setIsLoading(false);
          if (isInitialLoad) {
            requestAnimationFrame(() => {
              scrollToBottomInstant();
            });
          } else if (isNearBottomRef.current) {
            scrollToBottomSoon('smooth');
          }
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        if (epochAtStart !== conversationEpochRef.current) {
          return;
        }
        setIsLoading(false);
      }
    },
    [
      conversationId,
      scrollToBottomSoon,
      scrollToBottomInstant,
      persistThreadMsgs,
      syncReadReceiptsWithServer,
    ]
  );

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreOlderRef.current) return;
    const el = messagesScrollRef.current;
    if (!el) return;
    const cid = conversationId;
    if (!cid) return;
    const epochSnap = conversationEpochRef.current;
    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;
    const nextPage = oldestLoadedPageRef.current + 1;
    setLoadingOlder(true);
    try {
      const res = await fetch(
        `/api/conversations/${cid}/messages-fast?limit=50&page=${nextPage}`,
        {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }
      );
      if (!res.ok) return;
      let data: { messages?: ChatThreadMessage[]; hasMore?: boolean };
      try {
        data = await res.json();
      } catch {
        return;
      }
      if (epochSnap !== conversationEpochRef.current) return;
      const older = normalizeChatThreadMessageList(data.messages);
      if (older.length === 0) {
        hasMoreOlderRef.current = false;
        return;
      }
      oldestLoadedPageRef.current = nextPage;
      hasMoreOlderRef.current = Boolean(data.hasMore);
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const prepend = older.filter((m) => !seen.has(m.id));
        const merged = [...prepend, ...prev];
        persistThreadMsgs(merged);
        return merged;
      });
      requestAnimationFrame(() => {
        if (epochSnap !== conversationEpochRef.current) return;
        const sc = messagesScrollRef.current;
        if (!sc) return;
        const delta = sc.scrollHeight - prevScrollHeight;
        sc.scrollTop = prevScrollTop + delta;
        updateNearBottom();
      });
    } catch {
      /* ignore */
    } finally {
      setLoadingOlder(false);
    }
  }, [
    conversationId,
    loadingOlder,
    persistThreadMsgs,
    updateNearBottom,
  ]);

  /** Lijst op /messages: zelfde CustomEvent als ConversationsList (alleen browser). */
  const notifyConversationListActivity = useCallback(
    (cid: string, msg: ChatThreadMessage) => {
      if (!cid || !msg?.id) return;
      const createdAt =
        typeof msg.createdAt === 'string' && msg.createdAt.trim()
          ? msg.createdAt
          : new Date().toISOString();
      const uid = msg.User?.id ?? msg.senderId;
      if (!uid) return;
      dispatchConversationListActivity({
        conversationId: cid,
        lastMessageAt: createdAt,
        lastMessage: {
          id: msg.id,
          text: msg.text ?? null,
          messageType: String(msg.messageType ?? 'TEXT'),
          createdAt,
          readAt: msg.readAt ?? null,
          orderNumber: msg.orderNumber ?? null,
          senderId: msg.senderId,
          User: {
            id: uid,
            name: msg.User?.name ?? null,
            username: msg.User?.username ?? null,
            profileImage: msg.User?.profileImage ?? null,
            displayFullName: msg.User?.displayFullName ?? null,
            displayNameOption: msg.User?.displayNameOption ?? null,
          },
        },
      });
    },
    []
  );

  // Hydrate uit sessionStorage + eerste fetch (geen dubbele initial door Pusher-toggle)
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    conversationEpochRef.current += 1;
    const epoch = conversationEpochRef.current;
    hasMoreOlderRef.current = false;
    oldestLoadedPageRef.current = 1;
    isNearBottomRef.current = true;

    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    let cached = currentUserId
      ? readMessagesCache<ChatThreadMessage>(conversationId, currentUserId)
      : [];
    if (
      cached.length === 0 &&
      nativeMounted &&
      currentUserId
    ) {
      const persisted = readNativePersistedCache<ChatThreadMessage[]>(
        `conv_msgs_${conversationId}`,
        currentUserId,
        8 * 60 * 1000
      );
      if (persisted?.length) cached = persisted;
    }
    if (cached.length > 0) {
      setMessages(normalizeChatThreadMessageList(cached));
      setIsLoading(false);
    } else {
      setMessages([]);
      setIsLoading(true);
    }

    void loadMessages(true, ac.signal, epoch);

    return () => {
      ac.abort();
    };
  }, [conversationId, currentUserId, loadMessages, nativeMounted]);

  // Setup Pusher real-time
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const boundGen = ++pusherUiGenRef.current;
    const pusher = getPusherClient();
    if (!pusher) {
      console.warn('⚠️ Pusher not available');
      return;
    }
    
    pusherRef.current = pusher;
    const channel = pusher.subscribe(`conversation-${conversationId}`);
    
    // Connection events
    channel.bind('pusher:subscription_succeeded', () => {
      if (boundGen !== pusherUiGenRef.current) return;
      setPusherConnected(true);
    });
    
    channel.bind('pusher:subscription_error', (error: any) => {
      if (boundGen !== pusherUiGenRef.current) return;
      console.error('❌ Pusher error:', error);
      setPusherConnected(false);
    });
    
    channel.bind('new-message', (data: unknown) => {
      if (boundGen !== pusherUiGenRef.current) return;
      const normalized = normalizeChatThreadMessage(data);
      if (!normalized) {
        reportMessagingDiagnostic('pusher_msg_rejected', { reason: 'normalize' });
        return;
      }
      const epochSnap = conversationEpochRef.current;
      const fromSelf = normalized.senderId === currentUserId;
      setMessages((prev) => {
        if (boundGen !== pusherUiGenRef.current) return prev;
        if (epochSnap !== conversationEpochRef.current) return prev;
        const next = mergePusherChatMessage(prev, normalized);
        queueMicrotask(() => {
          if (boundGen !== pusherUiGenRef.current) return;
          if (epochSnap !== conversationEpochRef.current) return;
          persistThreadMsgs(next);
        });
        return next;
      });
      if (boundGen !== pusherUiGenRef.current) return;
      if (epochSnap !== conversationEpochRef.current) return;
      if (fromSelf || isNearBottomRef.current) {
        scrollToBottomSoon();
      }
      notifyConversationListActivity(conversationId, normalized);
    });

    channel.bind('proposal-updated', (data: {
      proposal?: ProposalDTO;
    }) => {
      if (boundGen !== pusherUiGenRef.current) return;
      if (!data?.proposal?.id) return;
      const epochSnap = conversationEpochRef.current;
      setProposalsById((prev) => {
        if (boundGen !== pusherUiGenRef.current) return prev;
        if (epochSnap !== conversationEpochRef.current) return prev;
        return { ...prev, [data.proposal!.id]: data.proposal! };
      });
    });
    
    // Typing indicator
    channel.bind('user-typing', (data: { userId: string; isTyping?: boolean; typing?: boolean }) => {
      if (boundGen !== pusherUiGenRef.current) return;
      if (data.userId !== currentUserId) {
        const epochSnap = conversationEpochRef.current;
        const active = data.isTyping ?? data.typing ?? false;
        setOtherUserTyping(active);

        if (active) {
          if (pusherTypingClearRef.current) {
            clearTimeout(pusherTypingClearRef.current);
            pusherTypingClearRef.current = null;
          }
          pusherTypingClearRef.current = setTimeout(() => {
            pusherTypingClearRef.current = null;
            if (boundGen !== pusherUiGenRef.current) return;
            if (epochSnap !== conversationEpochRef.current) return;
            setOtherUserTyping(false);
          }, 3000);
        }
      }
    });
    
    // Online status
    channel.bind('user-online', (data: { userId: string; online: boolean; lastSeenAt?: string }) => {
      if (boundGen !== pusherUiGenRef.current) return;
      if (!peerId || data.userId !== peerId) return;
      const epochSnap = conversationEpochRef.current;
      const online = data.online;
      const seen = data.lastSeenAt;
      queueMicrotask(() => {
        if (boundGen !== pusherUiGenRef.current) return;
        if (epochSnap !== conversationEpochRef.current) return;
        setIsOnline(online);
        if (seen) {
          setLastSeenAt(seen);
        }
      });
    });
    
    return () => {
      if (pusherTypingClearRef.current) {
        clearTimeout(pusherTypingClearRef.current);
        pusherTypingClearRef.current = null;
      }
      if (pusher) {
        pusher.unsubscribe(`conversation-${conversationId}`);
      }
    };
  }, [
    conversationId,
    currentUserId,
    peerId,
    persistThreadMsgs,
    scrollToBottomSoon,
    nativeMounted,
    notifyConversationListActivity,
  ]);

  useEffect(() => {
    if (!conversationId || !currentUserId || !peerId) return;
    const ac = new AbortController();
    const epochAtStart = conversationEpochRef.current;
    const runId = ++statusPollRunIdRef.current;

    void (async () => {
      try {
        const response = await fetch(
          `/api/users/online-status?userId=${encodeURIComponent(peerId)}`,
          { signal: ac.signal }
        );
        if (ac.signal.aborted) return;
        if (runId !== statusPollRunIdRef.current) return;
        if (epochAtStart !== conversationEpochRef.current) return;
        if (!response.ok) return;
        let data: { isOnline?: boolean; lastSeenAt?: string | null };
        try {
          data = await response.json();
        } catch {
          return;
        }
        if (ac.signal.aborted) return;
        if (runId !== statusPollRunIdRef.current) return;
        if (epochAtStart !== conversationEpochRef.current) return;
        setIsOnline(!!data.isOnline);
        setLastSeenAt(data.lastSeenAt ?? null);
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        console.error('Error loading user status:', error);
      }
    })();

    return () => ac.abort();
  }, [conversationId, currentUserId, peerId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const ms = pusherConnected ? 45000 : 8000;
    const id = setInterval(() => {
      void loadMessages(false, undefined, conversationEpochRef.current);
    }, ms);
    return () => clearInterval(id);
  }, [conversationId, currentUserId, pusherConnected, loadMessages]);

  const handleMessagesScroll = useCallback(() => {
    updateNearBottom();
    const el = messagesScrollRef.current;
    if (!el || loadingOlder || !hasMoreOlderRef.current) return;
    if (el.scrollTop < 90) {
      void loadOlderMessages();
    }
  }, [updateNearBottom, loadingOlder, loadOlderMessages]);

  useEffect(() => {
    if (isLoading) return;
    updateNearBottom();
  }, [messages.length, isLoading, updateNearBottom]);

  // Handle typing
  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Emit typing event
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      
      // Send typing event via API
      fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: true })
      }).catch(console.error);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: false })
      }).catch(console.error);
    }, 2000);
  };

  // Send message with optimistic UI
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    setIsTyping(false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Create optimistic message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatThreadMessage = {
      id: tempId,
      text,
      messageType: 'TEXT',
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      User: {
        id: currentUserId,
        name: session?.user?.name ?? null,
        username: (session?.user as { username?: string })?.username ?? null,
        profileImage: session?.user?.image ?? null,
        displayFullName: null,
        displayNameOption: null,
      },
    };
    
    // Add optimistic message immediately to UI
    setMessages(prev => [...prev, optimisticMessage]);
    
    requestAnimationFrame(() => {
      scrollToBottomInstant();
    });
    
    sendFlightRef.current?.abort();
    const sendAc = new AbortController();
    sendFlightRef.current = sendAc;
    const epochAtSend = conversationEpochRef.current;

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, messageType: 'TEXT' }),
        signal: sendAc.signal,
      });

      if (sendAc.signal.aborted) return;
      if (epochAtSend !== conversationEpochRef.current) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        return;
      }

      if (res.ok) {
        let data: { message?: ChatThreadMessage };
        try {
          data = await res.json();
        } catch {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          setNewMessage(text);
          alert(t('chat.couldNotSend'));
          return;
        }

        if (sendAc.signal.aborted) return;
        if (epochAtSend !== conversationEpochRef.current) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          return;
        }

        const normalizedReal = normalizeChatThreadMessage(data.message);
        if (!normalizedReal) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          setNewMessage(text);
          alert(t('chat.couldNotSend'));
          return;
        }

        setMessages((prev) => {
          const next = prev.map((msg) =>
            msg.id === tempId ? normalizedReal : msg
          );
          persistThreadMsgs(next);
          return next;
        });
        notifyConversationListActivity(conversationId, normalizedReal);
        scrollToBottomSoon();
      } else {
        if (sendAc.signal.aborted) return;
        if (epochAtSend !== conversationEpochRef.current) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          return;
        }
        console.error('❌ Failed to send:', res.status);

        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setNewMessage(text);
        alert(t('chat.couldNotSend'));
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }
      if (epochAtSend !== conversationEpochRef.current) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        return;
      }
      console.error('❌ Error sending:', error);

      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(text);
      alert(t('errors.sendError'));
    } finally {
      if (sendFlightRef.current === sendAc) {
        sendFlightRef.current = null;
      }
      setIsSending(false);
    }
  };

  const handleManualReload = () => {
    void loadMessages(true, undefined, conversationEpochRef.current);
  };

  const handleDeleteConversation = async () => {
    if (!confirm(t('errors.confirmDeleteConversation'))) return;
    try {
      const response = await fetch(`/api/conversations/${conversationId}/delete`, {
        method: 'DELETE',
      });
      if (response.ok) {
        if (onBack) onBack();
        else window.location.href = '/messages';
      } else {
        throw new Error('delete failed');
      }
    } catch {
      alert(t('errors.clearConversationError'));
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const peerProfileHref = otherParticipant.username?.trim()
    ? `/user/${encodeURIComponent(otherParticipant.username)}`
    : null;

  const formatLastSeen = (date: string) => {
    const now = new Date();
    const lastSeen = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'zojuist';
    if (diffInMinutes < 60) return `${diffInMinutes} min geleden`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} uur geleden`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} dag${diffInDays > 1 ? 'en' : ''} geleden`;
    
    return lastSeen.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short'
    });
  };

  const showBackButton = Boolean(onBack);
  const backButtonCompactClass =
    showBackOnDesktop || nativeMounted ? '' : 'lg:hidden';

  const relationshipHintLine = (() => {
    const rel = normalizeRelationshipContext(relationshipContext);
    if (!rel) return '';
    const bits: string[] = [];
    const youFollowThem = rel.youFollowThem;
    const theyFollowYou = rel.theyFollowYou;
    const messageCount = rel.messageCount;
    const productTitle = rel.productTitle;
    const productCategory = rel.productCategory;
    if (youFollowThem && theyFollowYou) {
      bits.push(t('chat.relationship.mutualFollow'));
    } else {
      if (youFollowThem) bits.push(t('chat.relationship.youFollowCreator'));
      if (theyFollowYou) bits.push(t('chat.relationship.followsYouBack'));
    }
    if (Number.isFinite(messageCount) && messageCount >= 2) {
      bits.push(t('chat.relationship.continuedConversation'));
    }
    if (productCategory?.trim()) {
      const human = String(productCategory)
        .trim()
        .replace(/_/g, ' ')
        .toLowerCase();
      bits.push(t('chat.relationship.productCategory', { category: human }));
    } else if (productTitle?.trim()) {
      const short = productTitle.trim().slice(0, 48);
      bits.push(t('chat.relationship.aboutListing', { title: short }));
    }
    return bits.filter(Boolean).join(' · ');
  })();

  const displayName = getDisplayName(otherParticipant);
  const showPresence = isOnline !== undefined;
  const presenceTitleSuffix =
    otherUserTyping || !showPresence
      ? null
      : isOnline
        ? t('chat.presenceOnline')
        : pusherConnected
          ? t('chat.presenceLive')
          : null;
  const lastSeenSingleLine =
    !otherUserTyping && showPresence && !isOnline && lastSeenAt
      ? t('chat.lastSeenFull', { time: formatLastSeen(lastSeenAt) })
      : null;
  const offlineOnlyLine =
    !otherUserTyping && showPresence && !isOnline && !lastSeenAt && !pusherConnected
      ? t('chat.presenceOffline')
      : null;

  const peerDetailsColumn = (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <div className="flex min-w-0 items-baseline gap-1.5">
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-gray-900">
          {displayName}
        </h2>
        {otherParticipant.sellerVerified ? (
          <BadgeCheck
            className="h-4 w-4 shrink-0 translate-y-px text-emerald-600"
            aria-label={t('profilePage.sidebar.verified')}
          />
        ) : null}
        {presenceTitleSuffix ? (
          <span
            className={`shrink-0 whitespace-nowrap text-xs font-medium ${
              isOnline ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            · {presenceTitleSuffix}
          </span>
        ) : null}
      </div>
      {otherUserTyping ? (
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-blue-600">
          <span className="flex shrink-0 gap-1" aria-hidden>
            <span
              className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </span>
          <span className="min-w-0 truncate">{t('chat.isTyping')}</span>
        </div>
      ) : lastSeenSingleLine ? (
        <p className="min-w-0 truncate text-xs text-gray-500">{lastSeenSingleLine}</p>
      ) : offlineOnlyLine ? (
        <p className="min-w-0 truncate text-xs text-gray-500">{offlineOnlyLine}</p>
      ) : null}
      {relationshipHintLine ? (
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
          {relationshipHintLine}
        </p>
      ) : null}
    </div>
  );

  return (
    <div
      className={`flex flex-col h-full min-h-0 bg-[#f4f6f8] hc-native-chat-root ${
        nativeMounted ? 'hc-native-chat-root-native' : ''
      }`}
    >
      {/* Header: max-lg = terug-rij + peer; lg+ split = icoon-terug + peer; lg+ thread = terug + peer */}
      <div
        className={cn(
          'hc-chat-header flex shrink-0 flex-col border-b border-gray-200/90 bg-white/95 shadow-sm backdrop-blur-md',
          'supports-[padding:max(0px,1px)]:pt-[max(0.25rem,env(safe-area-inset-top,0px))]',
          'px-3 py-1 sm:px-4 lg:flex-row lg:items-center lg:gap-2 lg:py-2'
        )}
      >
        {showBackButton && onBack ? (
          <div className="flex w-full min-w-0 border-b border-gray-100/80 pb-1 lg:hidden">
            <button
              type="button"
              onClick={onBack}
              className="-mx-1 inline-flex min-h-[44px] w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100/80 touch-manipulation"
              aria-label={t('messages.backToConversations')}
            >
              <ArrowLeft className="h-5 w-5 shrink-0 text-gray-800" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{t('messages.backToConversations')}</span>
            </button>
          </div>
        ) : null}

        <div
          className={cn(
            'flex min-w-0 flex-1 items-start gap-2 sm:gap-3 lg:items-center',
            showBackButton && onBack ? 'pt-1 lg:min-h-0 lg:pt-0' : 'pt-0.5 lg:pt-0'
          )}
        >
          {showBackButton && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={`mt-0.5 hidden min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full px-2 hover:bg-gray-100/90 lg:inline-flex ${backButtonCompactClass}`}
              aria-label={t('messages.backToConversations')}
            >
              <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
              {showBackOnDesktop ? (
                <span className="max-w-[11rem] truncate text-sm font-semibold text-gray-900 xl:max-w-[16rem]">
                  {t('messages.backToConversations')}
                </span>
              ) : null}
            </button>
          ) : null}

          {peerProfileHref ? (
            <Link
              href={peerProfileHref}
              prefetch={false}
              scroll={false}
              className="flex min-h-0 min-w-0 flex-1 touch-pan-y items-start gap-3 rounded-lg py-0.5 outline-none select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 lg:min-h-[44px] lg:items-center"
            >
              <UserCircleAvatar
                src={otherParticipant.profileImage}
                alt={displayName}
                size="lg"
                nameForInitial={displayName}
              />
              {peerDetailsColumn}
            </Link>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 items-start gap-3 py-0.5 lg:min-h-[44px] lg:items-center">
              <UserCircleAvatar
                src={otherParticipant.profileImage}
                alt={displayName}
                size="lg"
                nameForInitial={displayName}
              />
              {peerDetailsColumn}
            </div>
          )}

          {showConversationTools ? (
            <div className="ml-auto flex shrink-0 items-center gap-1 self-start lg:self-center">
              {peerId ? (
                <ReportContentButton
                  entityId={peerId}
                  entityType="USER"
                  entityTitle={displayName}
                  size="sm"
                  className="!px-2 !py-2"
                />
              ) : null}
              <button
                type="button"
                onClick={() => handleManualReload()}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title={t('messages.reloadMessages')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConversation()}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title={t('common.clearConversation')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <ConversationContextHeader header={contextHeader} />

      {/* Messages — enige scrollzone */}
      <div
        ref={messagesScrollRef}
        onScroll={handleMessagesScroll}
        className="hc-native-chat-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[#eef1f4] px-3 py-2 touch-pan-y sm:px-4 sm:py-3"
      >
        {loadingOlder ? (
          <div className="flex shrink-0 justify-center py-2" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" aria-hidden />
          </div>
        ) : null}
        {isLoading ? (
          <div className="space-y-4 py-2" aria-busy>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`h-11 rounded-2xl bg-gray-200 animate-pulse ${
                    i % 2 === 0 ? 'w-[72%]' : 'w-[55%]'
                  }`}
                />
              </div>
            ))}
            <div className="flex justify-center pt-4">
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <div className="mb-4 text-5xl">💬</div>
            <p>{t('messages.noMessages')}</p>
            <p className="text-sm">{t('messages.sendFirstMessage')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <ChatThreadMessageRow
                key={msg.id}
                msg={msg}
                currentUserId={currentUserId}
                formatTime={formatTime}
                proposal={
                  msg.proposalId ? proposalsById[msg.proposalId] ?? null : null
                }
                communityOrder={
                  msg.proposalId
                    ? communityOrdersByProposalId[msg.proposalId] ?? null
                    : null
                }
                deliveryRequest={
                  msg.proposalId
                    ? deliveryRequestsByProposalId[msg.proposalId] ?? null
                    : null
                }
                onProposalUpdated={handleProposalUpdated}
              />
            ))}
            <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className={`hc-native-chat-composer shrink-0 border-t border-gray-200/90 bg-white/95 px-3 backdrop-blur-md sm:px-4 ${
          nativeMounted
            ? 'hc-native-chat-composer-native pt-1.5 sm:pt-2'
            : 'py-2.5 supports-[padding:max(0px,1px)]:pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] sm:py-3'
        }`}
      >
        <div className="flex gap-2 items-end">
          <button
            type="button"
            onClick={() => setShowCreateProposal(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            title={t('proposal.create.title')}
            aria-label={t('proposal.create.title')}
          >
            <ClipboardList className="h-5 w-5" />
          </button>
          <EmojiPickerButton
            onEmojiClick={(emoji) => {
              setNewMessage(prev => prev + emoji);
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (input) input.focus();
            }}
            className="flex-shrink-0"
          />
          <input
            type="text"
            enterKeyHint="send"
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={t('messages.typeMessage')}
            disabled={isSending}
            className={`min-h-[44px] flex-1 min-w-0 rounded-full border border-gray-200 bg-gray-50/90 px-4 py-2.5 text-[15px] leading-snug text-gray-900 shadow-inner focus:border-emerald-500/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-gray-100 sm:text-base ${
              nativeMounted ? '' : 'min-h-[48px] py-3'
            }`}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 ${
              nativeMounted ? 'min-h-[48px] min-w-[48px] px-5' : 'px-6 py-3'
            }`}
            aria-label={t('common.send')}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      <CreateProposalSheet
        open={showCreateProposal}
        onClose={() => setShowCreateProposal(false)}
        conversationId={conversationId}
        contextHeader={contextHeader}
        onCreated={() => {
          void loadProposals();
          void handleManualReload();
        }}
      />
    </div>
  );
}

