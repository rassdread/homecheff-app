'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Trash2, Circle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';
import { getPusherClient } from '@/lib/pusher';
import { useTranslation } from '@/hooks/useTranslation';

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
  text: string;
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
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(Date.now());
  const [pusherConnected, setPusherConnected] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const pusherRef = useRef<any>(null);
  
  const { data: session } = useSession();

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
        console.error('[CompleteChat] Error fetching user:', error);
      }
    };

    fetchCurrentUser();
  }, [session]);

  // Step 2: Load messages
  const loadMessages = async () => {
    if (!conversationId) {
      return;
    }

    try {
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
        setLastFetch(Date.now());
        setIsLoading(false);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const errorText = await response.text();
        console.error('[CompleteChat] ❌ Failed to load messages:', response.status, errorText);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[CompleteChat] ❌ Error loading messages:', error);
      setIsLoading(false);
    }
  };

  // Step 3: Initial load
  useEffect(() => {
    if (conversationId && currentUserId) {
      loadMessages();
    }
  }, [conversationId, currentUserId]);

  // Step 4: Setup Pusher real-time + polling backup
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    // Setup Pusher for real-time updates
    const pusher = getPusherClient();
    if (pusher) {
      pusherRef.current = pusher;
      
      const channel = pusher.subscribe(`conversation-${conversationId}`);
      
      channel.bind('pusher:subscription_succeeded', () => {
        setPusherConnected(true);
      });
      
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error('[CompleteChat] ❌ Pusher error:', error);
        setPusherConnected(false);
      });
      
      channel.bind('new-message', (data: Message) => {
        // Add message to state if not already there
        setMessages((prev) => {
          const exists = prev.some(m => m.id === data.id);
          if (exists) {
            return prev;
          }
          return [...prev, data];
        });
        
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    } else {
      console.warn('[CompleteChat] ⚠️ Pusher not available');
    }

    // Backup polling (every 5 seconds when Pusher is connected, every 2 seconds when not)
    const pollInterval = pusherConnected ? 5000 : 2000;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      if (!pusherConnected) {
      }
      loadMessages();
    }, pollInterval);

    return () => {
      // Cleanup Pusher
      if (pusher && pusherRef.current) {
        pusher.unsubscribe(`conversation-${conversationId}`);
        pusherRef.current = null;
      }
      
      // Cleanup polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [conversationId, currentUserId, pusherConnected]);

  // Step 5: Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUserId || isSending) {
      return;
    }

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      // Send message
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
        throw new Error(`Failed to send: ${response.status}`);
      }
      // Create notification for other participant
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: otherParticipant.id,
            type: 'MESSAGE_RECEIVED',
            payload: {
              title: 'Nieuw bericht',
              message: messageText.substring(0, 100),
              conversationId: conversationId,
            }
          })
        });
      } catch (notifError) {
        console.error('[CompleteChat] Notification error:', notifError);
      }

      // Reload messages immediately
      await loadMessages();

    } catch (error) {
      console.error('[CompleteChat] ❌ Error sending message:', error);
      alert(t('errors.sendError'));
      setNewMessage(messageText); // Restore message
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
    <div className="flex flex-col h-full bg-white">
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
            onClick={() => loadMessages()}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4">{t('messages.loading')}</p>
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
                        <p className="text-sm break-words">{message.text}</p>
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
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex-shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('common.typeMessage')}
            disabled={isSending || !currentUserId}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !currentUserId}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

