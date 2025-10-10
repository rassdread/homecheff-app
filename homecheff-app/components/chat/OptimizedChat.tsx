'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Trash2, RefreshCw, Circle, CheckCheck } from 'lucide-react';
import Image from 'next/image';
import Pusher from 'pusher-js';

interface OptimizedChatProps {
  conversationId: string;
  otherParticipant: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
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
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  
  const { data: session } = useSession();

  // Helper: Get display name
  const getDisplayName = (user: any) => {
    return user?.name || user?.username || 'Gebruiker';
  };

  // Step 1: Get current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!session?.user?.email) {
        console.log('[OptimizedChat] No session, waiting...');
        return;
      }

      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          const userId = data.user?.id;
          if (userId) {
            setCurrentUserId(userId);
            console.log('[OptimizedChat] ✅ Current user:', userId);
          }
        }
      } catch (error) {
        console.error('[OptimizedChat] Error fetching user:', error);
        setConnectionError('Kon gebruikersgegevens niet laden');
      }
    };

    fetchCurrentUser();
  }, [session]);

  // Step 2: Load messages
  const loadMessages = useCallback(async (showLoading = true) => {
    if (!conversationId) return;

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
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('[OptimizedChat] Error loading messages:', error);
      setConnectionError('Kon berichten niet laden');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Step 3: Initial load
  useEffect(() => {
    if (conversationId && currentUserId) {
      console.log('[OptimizedChat] 🚀 Initial load');
      loadMessages();
    }
  }, [conversationId, currentUserId, loadMessages]);

  // Step 4: Setup Pusher for real-time updates
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    console.log('[OptimizedChat] 🔌 Setting up Pusher...');

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
        console.log('[OptimizedChat] 📨 New message via Pusher:', data);
        
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
        }
      });

      setIsOnline(true);
      console.log('[OptimizedChat] ✅ Pusher connected');

    } catch (error) {
      console.error('[OptimizedChat] ❌ Pusher error:', error);
      setIsOnline(false);
      
      // Fallback to polling if Pusher fails
      console.log('[OptimizedChat] 🔄 Falling back to polling...');
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
        console.log('[OptimizedChat] 🔌 Pusher disconnected');
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

      console.log('[OptimizedChat] ✅ Message sent successfully');
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
    if (!confirm('Weet je zeker dat je dit gesprek wilt wissen?')) return;

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
      alert('Fout bij wissen van gesprek.');
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
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 lg:hidden"
              aria-label="Terug naar gesprekken"
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
            <h2 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
              {getDisplayName(otherParticipant)}
            </h2>
            <div className="flex items-center gap-1">
              <Circle 
                className={`w-2 h-2 ${isOnline ? 'fill-green-500 text-green-500 animate-pulse' : 'fill-gray-400 text-gray-400'}`} 
              />
              <p className="text-xs text-gray-500">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={() => loadMessages()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Herlaad berichten"
            aria-label="Herlaad berichten"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title="Gesprek wissen"
            aria-label="Gesprek wissen"
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
            <p className="text-gray-500 mt-4 text-sm">Berichten laden...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl sm:text-6xl mb-4">💬</div>
            <p className="text-gray-600 font-medium text-sm sm:text-base">Nog geen berichten</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">Stuur het eerste bericht!</p>
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
                          message.User.profileImage ? (
                            <Image
                              src={message.User.profileImage}
                              alt={getDisplayName(message.User)}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {getDisplayName(message.User).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div>
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
                        {isOwn && message.readAt && (
                          <CheckCheck className="w-3 h-3 text-blue-500" />
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
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Typ een bericht..."
            disabled={isSending || !currentUserId}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !currentUserId}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center flex-shrink-0"
            aria-label="Verstuur bericht"
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
            Sessie laden...
          </p>
        )}
      </form>
    </div>
  );
}

