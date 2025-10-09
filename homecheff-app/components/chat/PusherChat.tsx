'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Trash2, Circle } from 'lucide-react';
import Image from 'next/image';
import { getPusherClient } from '@/lib/pusher';

interface PusherChatProps {
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
  User: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
  };
}

export default function PusherChat({ conversationId, otherParticipant, onBack }: PusherChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { data: session } = useSession();

  // Get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?.id || '');
        }
      } catch (error) {
        console.error('[PusherChat] Error fetching user ID:', error);
      }
    };
    
    fetchUserId();
  }, [session]);

  // Load messages
  const loadMessages = async () => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?page=1&limit=100`,
        { cache: 'no-store' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('[PusherChat] Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  // Setup Pusher real-time messaging
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const pusher = getPusherClient();
    
    pusher.connection.bind('connected', () => {
      console.log('[PusherChat] ✅ Connected to Pusher');
      setIsConnected(true);
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[PusherChat] ❌ Disconnected from Pusher');
      setIsConnected(false);
    });

    // Subscribe to conversation channel
    const channel = pusher.subscribe(`conversation-${conversationId}`);
    
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[PusherChat] ✅ Subscribed to conversation channel');
    });

    // Listen for new messages
    channel.bind('new-message', (data: Message) => {
      console.log('[PusherChat] 📨 New message received:', data);
      
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === data.id)) {
          return prev;
        }
        return [...prev, data];
      });

      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Listen for typing indicators
    channel.bind('user-typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== currentUserId) {
        setIsTyping(data.isTyping);
        
        if (data.isTyping) {
          // Auto-hide typing after 3 seconds
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
      pusher.disconnect();
    };
  }, [conversationId, currentUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!currentUserId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing event
    fetch(`/api/conversations/${conversationId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, isTyping: true }),
    });

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, isTyping: false }),
      });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUserId || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: messageText,
            messageType: 'TEXT',
            senderId: currentUserId
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      console.log('[PusherChat] ✅ Message sent successfully');
      
    } catch (error) {
      console.error('[PusherChat] ❌ Error sending message:', error);
      alert('Fout bij verzenden van bericht. Probeer het opnieuw.');
      setNewMessage(messageText); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  // Delete conversation
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
        throw new Error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('[PusherChat] Error deleting conversation:', error);
      alert('Fout bij wissen van gesprek.');
    }
  };

  const getDisplayName = (user: any) => {
    return user?.name || user?.username || 'Onbekend';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
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
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 font-medium">
                {getDisplayName(otherParticipant).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-900 truncate">
              {getDisplayName(otherParticipant)}
            </h2>
            <div className="flex items-center gap-1">
              <Circle 
                className={`w-2 h-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} 
              />
              <p className="text-xs text-gray-500">
                {isConnected ? 'Real-time actief' : 'Verbinden...'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => loadMessages()}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Herlaad berichten"
          >
            🔄
          </button>
          
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title="Gesprek wissen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 mt-2">Berichten laden...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-600 font-medium">Nog geen berichten</p>
            <p className="text-sm text-gray-400 mt-2">Stuur het eerste bericht om de conversatie te beginnen!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className="flex items-start space-x-2 max-w-[70%]">
                    {!isOwnMessage && message.User.profileImage && (
                      <Image
                        src={message.User.profileImage}
                        alt={getDisplayName(message.User)}
                        width={32}
                        height={32}
                        className="rounded-full flex-shrink-0 mt-1"
                      />
                    )}
                    
                    <div>
                      {!isOwnMessage && (
                        <p className="text-xs text-gray-500 mb-1 px-2">
                          {getDisplayName(message.User)}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl shadow-sm ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm break-words">{message.text}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-2">
                        {new Date(message.createdAt).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-200 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Typ een bericht..."
            disabled={isSending || !currentUserId || !isConnected}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !currentUserId || !isConnected}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        {!isConnected && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            ⚠️ Verbinding maken met real-time server...
          </p>
        )}
      </form>
    </div>
  );
}

