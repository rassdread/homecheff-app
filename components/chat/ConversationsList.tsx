'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  onMessagesRead?: () => void;
}

/** Verwijdert referral/uitnodiging-ruis uit list-preview (geen links/chips voor referrals). */
function sanitizeConversationPreviewText(text: string): string {
  let s = text.replace(/\s+/g, ' ').trim();
  s = s.replace(/\b(?:ref|referral|invite)[=:]\s*\S+/gi, '').trim();
  s = s.replace(/https?:\/\/[^\s]*(?:ref|referral|invite|uitnodiging)[^\s]*/gi, '').trim();
  return s.length > 0 ? s : 'Bericht';
}

export default function ConversationsList({ onSelectConversation, onMessagesRead }: ConversationsListProps) {
  const { t } = useTranslation();
  const nativeMounted = useIsNativeAppMounted();
  const { data: session, status: sessionStatus } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        const list = fallbackData.conversations || [];
        setConversations(list);
        writeConversationsListCache(userId, list);
        return;
      }

      const { conversations: fetchedConversations } = await response.json();

      setConversations(fetchedConversations);
      writeConversationsListCache(userId, fetchedConversations);
    } catch (error) {
      console.error('[ConversationsList] ❌ Critical error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus !== 'authenticated' || !userId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    const cached = readConversationsListCache<Conversation>(userId);
    setConversations(cached);
    setIsLoading(cached.length === 0);
    void loadConversations(cached.length === 0);
  }, [sessionStatus, userId, loadConversations]);

  // Refresh conversations when messages are read
  useEffect(() => {
    if (!onMessagesRead) return;
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
  }, [onMessagesRead, loadConversations]);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
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
      // Mark all unread messages in this conversation as read
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Trigger refresh of conversation list
        if (onMessagesRead) {
          onMessagesRead();
        }
        
        // Dispatch custom event to refresh other components
        window.dispatchEvent(new CustomEvent('messagesRead'));
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const listShellPad = nativeMounted ? 'p-3' : 'p-4';

  if (isLoading && conversations.length === 0) {
    return (
      <div className={`${listShellPad} space-y-2 animate-pulse`} aria-busy>
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
        <p className="pt-2 text-center text-sm text-gray-500">
          {t('messages.loadingConversations')}
        </p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">Nog geen gesprekken</p>
        <p className="text-sm">Start een gesprek door een product te bekijken!</p>
      </div>
    );
  }

  const openConversation = (conversation: Conversation) => {
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
      body = sanitizeConversationPreviewText(lm.text);
    }
    return `${prefix}${body}`;
  };

  const rowUnread = (c: Conversation) =>
    Boolean(
      c.lastMessage &&
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
    <div className="flex h-full flex-col">
      <div
        className={`border-b border-gray-200 bg-gray-50 ${nativeMounted ? 'px-3 py-2' : 'p-4'}`}
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

      <div className="flex-1 overflow-y-auto overscroll-contain">
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
                  className="flex min-h-[48px] min-w-[48px] shrink-0 touch-manipulation items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 [-webkit-tap-highlight-color:transparent]"
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

              <button
                type="button"
                onClick={() => openConversation(conversation)}
                className="flex min-h-[48px] min-w-0 flex-1 touch-manipulation flex-col justify-center gap-0.5 rounded-lg py-2 pl-1 pr-2 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 [-webkit-tap-highlight-color:transparent]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-gray-900">
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
                      dateTime={conversation.lastMessageAt ?? undefined}
                    >
                      {formatTime(conversation.lastMessageAt)}
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
                  {lm?.User.id === getCurrentUserId() && (
                    <CheckCheck
                      className={`h-4 w-4 shrink-0 ${
                        lm.readAt ? 'text-blue-500' : 'text-gray-400'
                      }`}
                      aria-hidden
                    />
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
