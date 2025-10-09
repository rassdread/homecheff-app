'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Message } from '@prisma/client';

interface ReliableChatProps {
  conversationId: string;
  otherParticipant: {
    id: string;
    name?: string;
    username?: string;
    profileImage?: string;
  };
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  User: {
    id: string;
    name?: string;
    username?: string;
    profileImage?: string;
  };
}

export default function ReliableChat({ conversationId, otherParticipant }: ReliableChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Get current user ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.id) {
            setCurrentUserId(data.user.id);
          }
        }
      } catch (error) {
        console.error('Error fetching current user ID:', error);
      }
    };
    
    fetchCurrentUserId();
  }, [session?.user?.email]);

  // Load messages function
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages-fast?page=1&limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages || [];
        
        setMessages(loadedMessages);
        
        // Update last message ID for change detection
        if (loadedMessages.length > 0) {
          setLastMessageId(loadedMessages[loadedMessages.length - 1].id);
        }
        
        console.log(`[ReliableChat] Loaded ${loadedMessages.length} messages`);
      }
    } catch (error) {
      console.error('[ReliableChat] Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId, loadMessages]);

  // Polling for new messages - every 2 seconds
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const pollForMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages-fast?page=1&limit=100`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages || [];
          
          if (newMessages.length > 0) {
            const latestMessageId = newMessages[newMessages.length - 1].id;
            
            // Only update if there are new messages
            if (latestMessageId !== lastMessageId) {
              setMessages(newMessages);
              setLastMessageId(latestMessageId);
              console.log('[ReliableChat] New messages detected, updating UI');
              
              // Scroll to bottom
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('[ReliableChat] Polling error:', error);
      }
    };

    // Start polling every 2 seconds
    const interval = setInterval(pollForMessages, 2000);
    
    return () => clearInterval(interval);
  }, [conversationId, currentUserId, lastMessageId]);

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Send message via API
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messageText,
          messageType: 'TEXT',
        }),
      });

      if (response.ok) {
        console.log('[ReliableChat] Message sent successfully');
        
        // Reload messages immediately
        setTimeout(() => {
          loadMessages();
        }, 500);
      } else {
        throw new Error(`Failed to send message: ${response.status}`);
      }
    } catch (error) {
      console.error('[ReliableChat] Error sending message:', error);
      alert('Fout bij verzenden van bericht. Probeer het opnieuw.');
      setNewMessage(messageText); // Restore message text
    } finally {
      setIsSending(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Berichten laden...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          {otherParticipant.profileImage ? (
            <img
              src={otherParticipant.profileImage}
              alt={otherParticipant.name || otherParticipant.username || 'User'}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {(otherParticipant.name || otherParticipant.username || 'U').charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900">
              {otherParticipant.name || otherParticipant.username || 'Onbekend'}
            </h2>
            <p className="text-sm text-gray-500">
              🟢 Live Chat ({messages.length} berichten)
            </p>
          </div>
        </div>
        
        {/* Manual refresh button */}
        <button
          onClick={loadMessages}
          className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 Herlaad
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-lg">Nog geen berichten</p>
              <p className="text-sm">Start het gesprek!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === currentUserId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === currentUserId ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type je bericht..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending || !currentUserId}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending || !currentUserId}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? 'Verzenden...' : 'Verstuur'}
          </button>
        </div>
        
        {/* Status */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {currentUserId ? '🟢 Verbonden' : '🔴 Verbinding...'}
          </span>
          <span>
            Polling elke 2 seconden
          </span>
        </div>
      </div>
    </div>
  );
}
