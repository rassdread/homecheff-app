'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Loader2, Circle, Trash2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getDisplayName } from '@/lib/displayName';
import { getPusherClient } from '@/lib/pusher';
import EmojiPickerButton from './EmojiPicker';
import { useTranslation } from '@/hooks/useTranslation';
import { mergePusherChatMessage } from '@/lib/chat/mergePusherChatMessage';
import { mergeServerChatMessages } from '@/lib/chat/mergeServerChatMessages';
import {
  readMessagesCache,
  writeMessagesCache,
} from '@/lib/chat/sessionChatCache';
import { readNativePersistedCache } from '@/lib/native/nativePersistedCache';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { saveLastConversationId } from '@/lib/appResumeCache';
import ChatThreadMessageRow from './ChatThreadMessageRow';
import type { ChatThreadMessage } from './chatThreadTypes';

export interface ChatBoxProps {
  conversationId: string;
  otherParticipant: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
  onBack?: () => void;
  /** Profiel/mobiel: handmatig verversen + gesprek wissen. */
  showConversationTools?: boolean;
}

export default function ChatBox({
  conversationId,
  otherParticipant,
  onBack,
  showConversationTools = false,
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    return () => {
      sendFlightRef.current?.abort();
      sendFlightRef.current = null;
    };
  }, []);

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
            headers: { 'Cache-Control': 'no-cache' },
            signal,
          }
        );

        if (stale()) return;

        if (res.ok) {
          let data: { messages?: ChatThreadMessage[] };
          try {
            data = await res.json();
          } catch {
            if (stale()) return;
            setIsLoading(false);
            return;
          }
          if (stale()) return;

          const newMessages = data.messages || [];
          if (isInitialLoad) {
            setMessages(newMessages);
            persistThreadMsgs(newMessages);
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
          if (isInitialLoad || (data.messages && data.messages.length > 0)) {
            scrollToBottomSoon();
          }
        } else {
          const fallbackRes = await fetch(
            `/api/conversations/${cid}/messages?limit=50`,
            { signal }
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

            const list = fallbackData.messages || [];
            if (isInitialLoad) {
              setMessages(list);
              persistThreadMsgs(list);
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
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        if (epochAtStart !== conversationEpochRef.current) {
          return;
        }
        setIsLoading(false);
      }
    },
    [conversationId, scrollToBottomSoon, persistThreadMsgs]
  );

  // Hydrate uit sessionStorage + eerste fetch (geen dubbele initial door Pusher-toggle)
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    conversationEpochRef.current += 1;
    const epoch = conversationEpochRef.current;

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
      setMessages(cached);
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
    
    channel.bind('new-message', (data: ChatThreadMessage) => {
      if (boundGen !== pusherUiGenRef.current) return;
      const epochSnap = conversationEpochRef.current;
      setMessages((prev) => {
        if (boundGen !== pusherUiGenRef.current) return prev;
        if (epochSnap !== conversationEpochRef.current) return prev;
        const next = mergePusherChatMessage(prev, data);
        queueMicrotask(() => {
          if (boundGen !== pusherUiGenRef.current) return;
          if (epochSnap !== conversationEpochRef.current) return;
          persistThreadMsgs(next);
        });
        return next;
      });
      if (boundGen !== pusherUiGenRef.current) return;
      if (epochSnap !== conversationEpochRef.current) return;
      scrollToBottomSoon();
    });
    
    // Typing indicator
    channel.bind('user-typing', (data: { userId: string; typing: boolean }) => {
      if (boundGen !== pusherUiGenRef.current) return;
      if (data.userId !== currentUserId) {
        const epochSnap = conversationEpochRef.current;
        setOtherUserTyping(data.typing);

        if (data.typing) {
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
      if (data.userId !== otherParticipant.id) return;
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
    otherParticipant.id,
    persistThreadMsgs,
    scrollToBottomSoon,
    nativeMounted,
  ]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const ac = new AbortController();
    const peerId = otherParticipant.id;
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
  }, [conversationId, currentUserId, otherParticipant.id]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const ms = pusherConnected ? 45000 : 8000;
    const id = setInterval(() => {
      void loadMessages(false, undefined, conversationEpochRef.current);
    }, ms);
    return () => clearInterval(id);
  }, [conversationId, currentUserId, pusherConnected, loadMessages]);

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
        body: JSON.stringify({ typing: true })
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
        body: JSON.stringify({ typing: false })
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
    
    // Scroll to bottom immediately
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    
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

        const realMessage = data.message;
        if (!realMessage) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          setNewMessage(text);
          alert(t('chat.couldNotSend'));
          return;
        }

        setMessages((prev) => {
          const next = prev.map((msg) =>
            msg.id === tempId ? realMessage : msg
          );
          persistThreadMsgs(next);
          return next;
        });
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

  return (
    <div
      className={`flex flex-col h-full min-h-0 bg-white hc-native-chat-root ${
        nativeMounted ? 'hc-native-chat-root-native' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full p-2 min-h-[44px] min-w-[44px] justify-center hover:bg-gray-100 ${
                nativeMounted ? '' : 'lg:hidden'
              }`}
              aria-label={t('messages.backToConversations')}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
              {nativeMounted ? (
                <span className="max-w-[7rem] truncate text-sm font-semibold text-gray-900">
                  {t('messages.backToConversations')}
                </span>
              ) : null}
            </button>
          )}

          {peerProfileHref ? (
            <Link
              href={peerProfileHref}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {otherParticipant.profileImage ? (
                <Image
                  src={otherParticipant.profileImage}
                  alt={getDisplayName(otherParticipant)}
                  width={40}
                  height={40}
                  className="rounded-full shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold">
                    {getDisplayName(otherParticipant)[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {getDisplayName(otherParticipant)}
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {otherUserTyping ? (
                    <>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-blue-500">{t('chat.isTyping')}</span>
                    </>
                  ) : (
                    <>
                      {isOnline !== undefined && (
                        <>
                          <Circle className={`w-2 h-2 shrink-0 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                          <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                            {isOnline ? 'Online' : lastSeenAt ? `Laatst gezien ${formatLastSeen(lastSeenAt)}` : 'Offline'}
                          </span>
                          {pusherConnected && (
                            <span className="text-xs text-gray-400">• Live</span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <>
              {otherParticipant.profileImage ? (
                <Image
                  src={otherParticipant.profileImage}
                  alt={getDisplayName(otherParticipant)}
                  width={40}
                  height={40}
                  className="rounded-full shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold">
                    {getDisplayName(otherParticipant)[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {getDisplayName(otherParticipant)}
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {otherUserTyping ? (
                    <>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-blue-500">{t('chat.isTyping')}</span>
                    </>
                  ) : (
                    <>
                      {isOnline !== undefined && (
                        <>
                          <Circle className={`w-2 h-2 shrink-0 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                          <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                            {isOnline ? 'Online' : lastSeenAt ? `Laatst gezien ${formatLastSeen(lastSeenAt)}` : 'Offline'}
                          </span>
                          {pusherConnected && (
                            <span className="text-xs text-gray-400">• Live</span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {showConversationTools ? (
          <div className="flex items-center gap-1 shrink-0">
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

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 bg-gray-50 hc-native-chat-scroll touch-pan-y">
        {isLoading ? (
          <div className="space-y-3 py-2" aria-busy>
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
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-5xl mb-4">💬</div>
            <p>{t('messages.noMessages')}</p>
            <p className="text-sm">{t('messages.sendFirstMessage')}</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatThreadMessageRow
                key={msg.id}
                msg={msg}
                currentUserId={currentUserId}
                formatTime={formatTime}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className={`shrink-0 p-4 border-t bg-white hc-native-chat-composer ${
          nativeMounted ? 'hc-native-chat-composer-native' : ''
        }`}
      >
        <div className="flex gap-2 items-end">
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
            className={`flex-1 min-w-0 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
              nativeMounted ? 'text-base py-3.5' : ''
            }`}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`shrink-0 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
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
    </div>
  );
}

