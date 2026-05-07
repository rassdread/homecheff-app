'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Trash2, Circle, RefreshCw, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';
import { getPusherClient } from '@/lib/pusher';
import { useTranslation } from '@/hooks/useTranslation';
import { appendAffiliateReferralToOutgoingText } from '@/lib/affiliate-attribution';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';
import { mergePusherChatMessage } from '@/lib/chat/mergePusherChatMessage';
import {
  readMessagesCache,
  writeMessagesCache,
} from '@/lib/chat/sessionChatCache';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';

interface CompleteChatProps {
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
}

interface Message {
  id: string;
  text: string | null;
  senderId: string;
  createdAt: string;
  readAt: string | null;
  User: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
}

export default function CompleteChat({ conversationId, otherParticipant, onBack }: CompleteChatProps) {
  const { t } = useTranslation();
  const { referralCode } = useAffiliateLink();
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pusherConnected, setPusherConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const nativeMounted = useIsNativeAppMounted();

  const { data: session } = useSession();

  const scrollToBottomSoon = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    const sid = (session?.user as { id?: string } | undefined)?.id;
    if (sid) {
      setCurrentUserId(sid);
      return;
    }
    const fetchCurrentUser = async () => {
      if (!session?.user?.email) return;
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          const userId = data.user?.id;
          if (userId) setCurrentUserId(userId);
        }
      } catch {
        /* ignore */
      }
    };
    void fetchCurrentUser();
  }, [session]);

  const loadMessages = useCallback(
    async (isFullRefresh = true, signal?: AbortSignal) => {
      if (!conversationId) return;
      try {
        let response = await fetch(
          `/api/conversations/${conversationId}/messages-fast?limit=50`,
          { cache: 'no-store', signal }
        );
        if (!response.ok) {
          response = await fetch(
            `/api/conversations/${conversationId}/messages?page=1&limit=100`,
            {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' },
              signal,
            }
          );
        }
        if (signal?.aborted) return;
        if (response.ok) {
          const data = await response.json();
          const loadedMessages = data.messages || [];
          setMessages(loadedMessages);
          writeMessagesCache(conversationId, loadedMessages);
          setIsLoading(false);
          scrollToBottomSoon();
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        setIsLoading(false);
      }
    },
    [conversationId, scrollToBottomSoon]
  );

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    fetchAbortRef.current?.abort();
    const ac = new AbortController();
    fetchAbortRef.current = ac;
    const cached = readMessagesCache<Message>(conversationId);
    if (cached.length > 0) {
      setMessages(cached);
      setIsLoading(false);
    } else {
      setMessages([]);
      setIsLoading(true);
    }
    void loadMessages(true, ac.signal);
    return () => ac.abort();
  }, [conversationId, currentUserId, loadMessages]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    pusherRef.current = pusher;
    const channel = pusher.subscribe(`conversation-${conversationId}`);
    channel.bind('pusher:subscription_succeeded', () => {
      setPusherConnected(true);
    });
    channel.bind('pusher:subscription_error', () => {
      setPusherConnected(false);
    });
    channel.bind('new-message', (data: Message) => {
      setMessages((prev) => {
        const next = mergePusherChatMessage(prev, data);
        queueMicrotask(() => writeMessagesCache(conversationId, next));
        return next;
      });
      scrollToBottomSoon();
    });
    return () => {
      pusher.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId, currentUserId, scrollToBottomSoon]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const ms = pusherConnected ? 45000 : 8000;
    const id = setInterval(() => void loadMessages(true), ms);
    return () => clearInterval(id);
  }, [conversationId, currentUserId, pusherConnected, loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || isSending) return;

    const messageText = appendAffiliateReferralToOutgoingText(
      newMessage.trim(),
      referralCode
    );
    setNewMessage('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      text: messageText,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      readAt: null,
      User: {
        id: currentUserId,
        name: session?.user?.name ?? null,
        username: (session?.user as { username?: string })?.username ?? null,
        profileImage: session?.user?.image ?? null,
        displayFullName: null,
        displayNameOption: null,
      },
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottomSoon();

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages/quick`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: messageText, messageType: 'TEXT' }),
        }
      );
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      const realMessage = data.message as Message;
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === tempId ? realMessage : m));
        writeMessagesCache(conversationId, next);
        return next;
      });
      scrollToBottomSoon();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
      alert(t('errors.sendError'));
    } finally {
      setIsSending(false);
    }
  };

  // Step 6: Delete conversation
  const handleDelete = async () => {
    if (!confirm(t('errors.confirmDeleteConversation'))) return;

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/delete`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        window.location.href = '/messages';
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('[CompleteChat] Error deleting:', error);
      alert(t('errors.clearConversationError'));
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`flex flex-col h-full min-h-0 bg-white hc-native-chat-root ${
        nativeMounted ? 'hc-native-chat-root-native' : ''
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full md:hidden flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {otherParticipant.profileImage ? (
            <Image
              src={otherParticipant.profileImage}
              alt={getDisplayName(otherParticipant)}
              width={40}
              height={40}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">
                {getDisplayName(otherParticipant).charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {getDisplayName(otherParticipant)}
            </h2>
            <div className="flex items-center gap-1">
              <Circle className={`w-2 h-2 ${pusherConnected ? 'fill-green-500 text-green-500' : 'fill-yellow-500 text-yellow-500'} animate-pulse`} />
              <p className="text-xs text-gray-500">
                {pusherConnected ? 'Real-time actief' : 'Polling mode'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => void loadMessages(true)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title={t('messages.reloadMessages')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title={t('common.clearConversation')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50 hc-native-chat-scroll touch-pan-y">
        {isLoading ? (
          <div className="space-y-3 py-2" aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`h-11 rounded-2xl bg-gray-200 animate-pulse ${
                    i % 2 === 0 ? 'w-[70%]' : 'w-[50%]'
                  }`}
                />
              </div>
            ))}
            <div className="flex justify-center pt-4">
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-600 font-medium">{t('messages.noMessages')}</p>
            <p className="text-sm text-gray-400 mt-2">{t('messages.sendFirstMessage')}</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="flex-shrink-0">
                        {message.User.profileImage ? (
                          <Image
                            src={message.User.profileImage}
                            alt={getDisplayName(message.User)}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {getDisplayName(message.User).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm break-words">{message.text ?? ''}</p>
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSendMessage}
        className={`shrink-0 p-4 border-t bg-white hc-native-chat-composer ${
          nativeMounted ? 'hc-native-chat-composer-native' : ''
        }`}
      >
        <div className="flex items-end gap-2">
          <input
            type="text"
            enterKeyHint="send"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('common.typeMessage')}
            disabled={isSending || !currentUserId}
            className={`flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              nativeMounted ? 'text-base py-3.5' : ''
            }`}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !currentUserId}
            className={`shrink-0 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center ${
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
        
        {!currentUserId && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Sessie laden...
          </p>
        )}
      </form>
    </div>
  );
}

