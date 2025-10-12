'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';

interface WorkingChatProps {
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

export default function WorkingChat({ conversationId, otherParticipant, onBack }: WorkingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
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
        console.error('Error fetching user ID:', error);
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
      console.error('Error loading messages:', error);
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

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    if (!conversationId) return;
    
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [conversationId]);

  // Auto-scroll to bottom
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
            messageType: 'TEXT'
          }),
        }
      );

      if (response.ok) {
        // Reload messages immediately
        await loadMessages();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
      console.error('Error deleting conversation:', error);
      alert('Fout bij wissen van gesprek.');
    }
  };


  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full md:hidden"
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
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {getDisplayName(otherParticipant).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          <div>
            <h2 className="font-semibold text-gray-900">
              {getDisplayName(otherParticipant)}
            </h2>
            <p className="text-xs text-gray-500">
              Updates elke 3 seconden
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadMessages()}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            title="Herlaad berichten"
          >
            🔄
          </button>
          
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
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
            <p className="text-gray-500">Berichten laden...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nog geen berichten</p>
            <p className="text-sm text-gray-400 mt-2">Stuur het eerste bericht!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start space-x-2 max-w-[70%]">
                  {!isOwnMessage && message.User.profileImage && (
                    <Image
                      src={message.User.profileImage}
                      alt={getDisplayName(message.User)}
                      width={32}
                      height={32}
                      className="rounded-full flex-shrink-0"
                    />
                  )}
                  
                  <div>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Typ een bericht..."
            disabled={isSending || !currentUserId}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !currentUserId}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSending ? (
              <span>⏳</span>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

