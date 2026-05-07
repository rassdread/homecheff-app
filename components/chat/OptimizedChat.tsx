'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Trash2, RefreshCw, Circle, Check, CheckCheck, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Pusher from 'pusher-js';
import { getDisplayName } from '@/lib/displayName';
import EmojiPickerButton from './EmojiPicker';
import { useTranslation } from '@/hooks/useTranslation';

interface OptimizedChatProps {
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
  text: string;
  senderId: string;
  createdAt: string;
  deliveredAt: string | null;
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

export default function OptimizedChat({ conversationId, otherParticipant, onBack }: OptimizedChatProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  // Step 1: Get current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!session?.user?.email) {
        return;
      }

      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          const userId = data.user?.id;
          if (userId) {
            setCurrentUserId(userId);
          }
        }
      } catch (error) {
        console.error('[OptimizedChat] Error fetching user:', error);
        setConnectionError(t('messages.loadingUserData'));
      }
    };

    fetchCurrentUser();
  }, [session]);

  // Step 2: Load messages
  const loadMessages = useCallback(async (showLoading = true) => {
    if (!conversationId) {
      return;
    }

    try {
      if (showLoading) setIsLoading(true);
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?page=1&limit=100`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages || [];
        setMessages(loadedMessages);
        setConnectionError(null);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const errorText = await response.text();
        console.error('[OptimizedChat] ❌ Error response:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('[OptimizedChat] ❌ Error loading messages:', error);
      setConnectionError(t('messages.loadingMessages', { error: error instanceof Error ? error.message : t('messages.unknownError') }));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Step 3: Initial load
  useEffect(() => {
    if (conversationId && currentUserId) {
      loadMessages();
    }
  }, [conversationId, currentUserId, loadMessages]);

  // Step 4: Setup Pusher for real-time updates
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    try {
      // Initialize Pusher client
      if (!pusherRef.current) {
        pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
          forceTLS: true
        });
      }

      // Subscribe to conversation channel
      const channelName = `conversation-${conversationId}`;
      channelRef.current = pusherRef.current.subscribe(channelName);

      // Listen for new messages
      channelRef.current.bind('new-message', (data: any) => {
        // Validate payload structure
        if (!data || typeof data !== 'object') {
          console.error('[OptimizedChat] ❌ Invalid message payload:', data);
          return;
        }
        
        if (!data.id || !data.text || !data.senderId) {
          console.error('[OptimizedChat] ❌ Missing required message fields:', {
            hasId: !!data.id,
            hasText: !!data.text,
            hasSenderId: !!data.senderId,
            payload: data
          });
          return;
        }
        
        // Add message to list if not from current user (avoid duplicates)
        if (data.senderId !== currentUserId) {
          setMessages(prev => [...prev, data]);
          
          // Auto-scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          
          // Mark as delivered automatically
          markMessageAsDelivered(data.id);
        }
      });

      // Listen for typing indicators
      channelRef.current.bind('user-typing', (data: any) => {
        if (data.userId !== currentUserId) {
          setOtherUserTyping(data.isTyping);
          if (data.isTyping) {
            // Reset typing after 3 seconds
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false);
            }, 3000);
          }
        }
      });

      // Listen for read receipts
      channelRef.current.bind('message-read', (data: any) => {
        if (data.messageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId ? { ...msg, readAt: data.readAt } : msg
          ));
        }
      });

      // Listen for delivered receipts
      channelRef.current.bind('message-delivered', (data: any) => {
        if (data.messageId) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId ? { ...msg, deliveredAt: data.deliveredAt } : msg
          ));
        }
      });

      // Listen for user presence
      channelRef.current.bind('user-online', (data: any) => {
        if (data.userId === otherParticipant.id) {
          setIsOnline(true);
          setOtherUserLastSeen(null);
        }
      });

      channelRef.current.bind('user-offline', (data: any) => {
        if (data.userId === otherParticipant.id) {
          setIsOnline(false);
          setOtherUserLastSeen(data.lastSeen || new Date().toISOString());
        }
      });

      setIsOnline(true);
    } catch (error) {
      console.error('[OptimizedChat] ❌ Pusher error:', error);
      setIsOnline(false);
      
      // Fallback to polling if Pusher fails
      const pollInterval = setInterval(() => {
        loadMessages(false);
      }, 5000);

      return () => {
        clearInterval(pollInterval);
        if (channelRef.current) {
          channelRef.current.unbind_all();
          channelRef.current.unsubscribe();
        }
      };
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      }
    };
  }, [conversationId, currentUserId, loadMessages]);

  // Step 5: Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUserId || isSending) {
      return;
    }

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    // Optimistic update - add message to UI immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      User: {
        id: currentUserId,
        name: session?.user?.name || null,
        username: (session?.user as any)?.username || null,
        profileImage: session?.user?.image || null
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    
    // Auto-scroll immediately
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      // Send message to server
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: messageText,
            messageType: 'TEXT',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const { message } = await response.json();

      // Replace optimistic message with real message
      setMessages(prev => 
        prev.map(msg => msg.id === optimisticMessage.id ? message : msg)
      );
      setConnectionError(null);

    } catch (error) {
      console.error('[OptimizedChat] ❌ Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restore message text
      setNewMessage(messageText);
      
      setConnectionError('Bericht verzenden mislukt. Probeer opnieuw.');
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
      console.error('[OptimizedChat] Error deleting:', error);
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

  // Format last seen
  const formatLastSeen = (lastSeenString: string | null) => {
    if (!lastSeenString) return 'onlangs';
    const lastSeen = new Date(lastSeenString);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'zojuist';
    if (diffMins < 60) return `${diffMins}m geleden`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}u geleden`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d geleden`;
  };

  // Mark message as delivered
  const markMessageAsDelivered = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/delivered`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  };

  // Update typing status
  const handleTyping = async () => {
    try {
      await fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, isTyping: true })
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  // Send typing indicator when user types
  useEffect(() => {
    if (newMessage.length > 0) {
      handleTyping();
    }
  }, [newMessage]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 lg:hidden"
              aria-label={t('chat.backToConversations')}
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
              className="rounded-full flex-shrink-0 object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {getDisplayName(otherParticipant).charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <button
              onClick={() => {
                const username = otherParticipant.username || otherParticipant.id;
                if (username) {
                  router.push(`/user/${username}`);
                }
              }}
              className="group flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors"
            >
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 truncate text-sm sm:text-base transition-colors">
                {getDisplayName(otherParticipant)}
              </h2>
              <UserIcon className="w-3 h-3 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
            <div className="flex items-center gap-1 px-2">
              {otherUserTyping ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-xs text-blue-600 font-medium">
                    {t('chat.typing')}
                  </p>
                </div>
              ) : (
                <>
                  {isOnline !== undefined && (
                    <>
                      <Circle 
                        className={`w-2 h-2 ${isOnline ? 'fill-green-500 text-green-500 animate-pulse' : 'fill-gray-400 text-gray-400'}`} 
                      />
                      <p className="text-xs text-gray-500">
                        {isOnline ? 'Online' : otherUserLastSeen ? `Laatst gezien ${formatLastSeen(otherUserLastSeen)}` : 'Offline'}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={() => loadMessages()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title={t('chat.reloadMessages')}
            aria-label={t('chat.reloadMessages')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title={t('common.clearConversation')}
            aria-label={t('common.clearConversation')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CONNECTION ERROR */}
      {connectionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <p className="text-sm text-red-600 text-center">{connectionError}</p>
        </div>
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4 text-sm">{t('messages.loading')}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl sm:text-6xl mb-4">💬</div>
            <p className="text-gray-600 font-medium text-sm sm:text-base">{t('messages.noMessages')}</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">{t('messages.sendFirstMessage')}</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId);

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-[85%] sm:max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="flex-shrink-0 w-8 h-8">
                        {showAvatar && (
                          <button
                            onClick={() => {
                              const username = message.User?.username || message.User?.id;
                              if (username) {
                                router.push(`/user/${username}`);
                              }
                            }}
                            className="group relative"
                            title={t('messages.viewProfile', { name: getDisplayName(message.User) })}
                          >
                            {message.User?.profileImage ? (
                              <Image
                                src={message.User.profileImage}
                                alt={getDisplayName(message.User)}
                                width={32}
                                height={32}
                                className="rounded-full object-cover group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-300 group-hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors">
                                <span className="text-xs font-medium group-hover:text-white">
                                  {getDisplayName(message.User).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex-1">
                      {/* Show sender name for other's messages */}
                      {!isOwn && showAvatar && message.User && (
                        <button
                          onClick={() => {
                            const username = message.User?.username || message.User?.id;
                            if (username) {
                              router.push(`/user/${username}`);
                            }
                          }}
                          className="text-xs font-medium text-gray-600 hover:text-blue-600 hover:underline mb-1 px-2 transition-colors"
                        >
                          {getDisplayName(message.User)}
                        </button>
                      )}
                      <div
                        className={`px-3 sm:px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                        }`}
                      >
                        <p className="text-sm break-words">{message.text}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <p className="text-xs text-gray-400">
                          {formatTime(message.createdAt)}
                        </p>
                        {isOwn && (
                          <div className="flex items-center"                           title={
                            message.readAt ? t('messages.read') : 
                            message.deliveredAt ? t('messages.delivered') : 
                            t('messages.sent')
                          }>
                            {message.readAt ? (
                              <CheckCheck className="w-3 h-3 text-blue-500" />
                            ) : message.deliveredAt ? (
                              <CheckCheck className="w-3 h-3 text-gray-400" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
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
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t bg-white flex-shrink-0">
        <div className="flex items-center space-x-2">
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
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('messages.typeMessage')}
            disabled={isSending || !currentUserId}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !currentUserId}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center flex-shrink-0"
            aria-label={t('messages.sendMessage')}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {!currentUserId && !connectionError && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            {t('messages.loadingSession')}
          </p>
        )}
      </form>
    </div>
  );
}

