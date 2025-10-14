'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Loader2, Check, CheckCheck, Circle } from 'lucide-react';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';
import { getPusherClient } from '@/lib/pusher';

interface ChatBoxProps {
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
  deliveredAt?: string | null;
  readAt?: string | null;
  User: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
}

export default function ChatBox({ conversationId, otherParticipant, onBack }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pusherConnected, setPusherConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const pusherRef = useRef<any>(null);
  const { data: session } = useSession();

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      if (!session?.user?.email) return;
      
      try {
        const res = await fetch('/api/profile/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.id) {
            setCurrentUserId(data.user.id);
            console.log('✅ User loaded:', data.user.id);
          }
        }
      } catch (error) {
        console.error('❌ Error loading user:', error);
      }
    };
    
    fetchUser();
  }, [session]);

  // Load messages
  const loadMessages = async () => {
    if (!conversationId) return;
    
    try {
      console.log('📥 Loading messages...');
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=100`);
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setIsLoading(false);
        console.log('✅ Messages loaded:', data.messages?.length || 0);
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setIsLoading(false);
    }
  };

  // Setup Pusher real-time
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    
    console.log('🔌 Setting up Pusher for:', conversationId);
    
    const pusher = getPusherClient();
    if (!pusher) {
      console.warn('⚠️ Pusher not available');
      return;
    }
    
    pusherRef.current = pusher;
    const channel = pusher.subscribe(`conversation-${conversationId}`);
    
    // Connection events
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Pusher connected');
      setPusherConnected(true);
    });
    
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ Pusher error:', error);
      setPusherConnected(false);
    });
    
    // New message event
    channel.bind('new-message', (data: Message) => {
      console.log('📨 New message received:', data);
      
      setMessages((prev) => {
        // Check if message already exists
        if (prev.some(m => m.id === data.id)) {
          return prev;
        }
        return [...prev, data];
      });
      
      // Auto-scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    
    // Typing indicator
    channel.bind('user-typing', (data: { userId: string; typing: boolean }) => {
      if (data.userId !== currentUserId) {
        setOtherUserTyping(data.typing);
        
        // Clear typing after 3 seconds
        if (data.typing) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    });
    
    // Online status
    channel.bind('user-online', (data: { userId: string; online: boolean }) => {
      if (data.userId === otherParticipant.id) {
        setIsOnline(data.online);
      }
    });
    
    return () => {
      console.log('🛑 Unsubscribing from Pusher');
      if (pusher) {
        pusher.unsubscribe(`conversation-${conversationId}`);
      }
    };
  }, [conversationId, currentUserId, otherParticipant.id]);

  // Initial load + polling backup
  useEffect(() => {
    if (conversationId && currentUserId) {
      loadMessages();
      
      // Poll every 5 seconds as backup (or 2 seconds if Pusher not connected)
      const pollInterval = pusherConnected ? 5000 : 2000;
      const interval = setInterval(loadMessages, pollInterval);
      return () => clearInterval(interval);
    }
  }, [conversationId, currentUserId, pusherConnected]);

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

  // Send message
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
    
    try {
      console.log('📤 Sending message...');
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, messageType: 'TEXT' })
      });
      
      if (res.ok) {
        console.log('✅ Message sent!');
        // Don't reload - Pusher will handle it
      } else {
        console.error('❌ Failed to send:', res.status);
        alert('Kon bericht niet verzenden');
        setNewMessage(text); // Restore message
      }
    } catch (error) {
      console.error('❌ Error sending:', error);
      alert('Fout bij verzenden');
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white shadow-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full lg:hidden"
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
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {getDisplayName(otherParticipant)[0].toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">
            {getDisplayName(otherParticipant)}
          </h2>
          <div className="flex items-center gap-1.5">
            {otherUserTyping ? (
              <>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-blue-500">aan het typen...</span>
              </>
            ) : (
              <>
                <Circle className={`w-2 h-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                {pusherConnected && (
                  <span className="text-xs text-gray-400">• Live</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-5xl mb-4">💬</div>
            <p>Nog geen berichten</p>
            <p className="text-sm">Stuur het eerste bericht!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 border'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.text}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-xs text-gray-400">
                        {formatTime(msg.createdAt)}
                      </p>
                      {isOwn && (
                        <span className="text-xs">
                          {msg.readAt ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : msg.deliveredAt ? (
                            <CheckCheck className="w-3 h-3 text-gray-400" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Typ een bericht..."
            disabled={isSending}
            className="flex-1 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
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

