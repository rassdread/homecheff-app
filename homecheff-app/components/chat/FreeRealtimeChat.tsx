'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Trash2, Circle } from 'lucide-react';
import Image from 'next/image';

interface FreeRealtimeChatProps {
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

export default function FreeRealtimeChat({ conversationId, otherParticipant, onBack }: FreeRealtimeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [lastMessageId, setLastMessageId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
        console.error('[FreeChat] Error fetching user ID:', error);
      }
    };
    
    fetchUserId();
  }, [session]);

  // Load messages
  const loadMessages = async () => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?page=1&limit=100`,
        { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages || [];
        setMessages(loadedMessages);
        
        // Track last message for change detection
        if (loadedMessages.length > 0) {
          setLastMessageId(loadedMessages[loadedMessages.length - 1].id);
        }
      }
    } catch (error) {
      console.error('[FreeChat] Error loading messages:', error);
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

  // **GRATIS REAL-TIME: Aggressive polling every 1 second**
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    
    console.log('[FreeChat] 🚀 Starting FREE real-time polling (1 second interval)');
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages?page=1&limit=100`,
          { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages || [];
          
          // Only update if there are new messages
          if (newMessages.length > 0) {
            const latestMessageId = newMessages[newMessages.length - 1].id;
            
            if (latestMessageId !== lastMessageId) {
              console.log('[FreeChat] 📨 New message detected!');
              setMessages(newMessages);
              setLastMessageId(latestMessageId);
              
              // Auto-scroll
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('[FreeChat] Polling error:', error);
      }
    }, 1000); // Poll every 1 second for real-time feeling
    
    return () => {
      console.log('[FreeChat] Stopping polling');
      clearInterval(interval);
    };
  }, [conversationId, currentUserId, lastMessageId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      console.log('[FreeChat] ✅ Message sent successfully');
      
      // Send notification to other participant
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: otherParticipant.id,
            type: 'MESSAGE_RECEIVED',
            payload: {
              title: 'Nieuw bericht',
              message: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
              conversationId: conversationId,
              from: currentUserId
            }
          })
        });
        console.log('[FreeChat] ✅ Notification sent');
      } catch (notifError) {
        console.error('[FreeChat] Notification error:', notifError);
        // Don't fail message send if notification fails
      }
      
      // Immediately reload messages
      await loadMessages();
      
    } catch (error) {
      console.error('[FreeChat] ❌ Error sending message:', error);
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
      console.error('[FreeChat] Error deleting conversation:', error);
      alert('Fout bij wissen van gesprek.');
    }
  };

  const getDisplayName = (user: any) => {
    return user?.name || user?.username || 'Onbekend';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full md:hidden flex-shrink-0 transition-colors"
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {getDisplayName(otherParticipant).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-900 truncate">
              {getDisplayName(otherParticipant)}
            </h2>
            <div className="flex items-center gap-1">
              <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
              <p className="text-xs text-gray-500">
                Real-time actief (1s updates)
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => loadMessages()}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
            title="Herlaad berichten"
          >
            🔄
          </button>
          
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
            title="Gesprek wissen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-500 mt-4 font-medium">Berichten laden...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-7xl mb-4 animate-bounce">💬</div>
            <p className="text-gray-600 font-medium text-lg">Nog geen berichten</p>
            <p className="text-sm text-gray-400 mt-2">Stuur het eerste bericht om de conversatie te beginnen!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className="flex items-start space-x-2 max-w-[75%]">
                  {!isOwnMessage && (
                    <>
                      {message.User.profileImage ? (
                        <Image
                          src={message.User.profileImage}
                          alt={getDisplayName(message.User)}
                          width={32}
                          height={32}
                          className="rounded-full flex-shrink-0 mt-1"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-gray-600 text-sm font-medium">
                            {getDisplayName(message.User).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div>
                    {!isOwnMessage && (
                      <p className="text-xs text-gray-500 mb-1 px-2 font-medium">
                        {getDisplayName(message.User)}
                      </p>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm break-words leading-relaxed">{message.text}</p>
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white shadow-lg">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Typ een bericht..."
            disabled={isSending || !currentUserId}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !currentUserId}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-2">
          ✨ Updates elke seconde automatisch
        </p>
      </form>
    </div>
  );
}

