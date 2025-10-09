'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Message } from '@prisma/client';

interface SuperFastChatProps {
  conversationId: string;
  currentUserId: string;
}

export default function SuperFastChat({ conversationId, currentUserId }: SuperFastChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useSocket();

  // Optimistic updates - show message immediately before server confirms
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, Message>>(new Map());
  const messageIdCounter = useRef(0);

  // Memoized scroll function for performance
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Load messages with aggressive caching
  const loadMessages = useCallback(async () => {
    try {
      const cacheKey = `messages-${conversationId}`;
      const cached = localStorage.getItem(cacheKey);
      
      // Show cached messages immediately
      if (cached) {
        const cachedMessages = JSON.parse(cached);
        setMessages(cachedMessages);
        setIsLoading(false);
      }

      // Fetch fresh messages in background
      const response = await fetch(`/api/conversations/${conversationId}/messages?page=1&limit=50`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const freshMessages = data.messages || [];
        
        // Update cache
        localStorage.setItem(cacheKey, JSON.stringify(freshMessages));
        setMessages(freshMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Socket event handlers with debouncing
  const handleNewMessage = useCallback((newMessage: Message) => {
    setMessages(prev => {
      // Check for duplicates
      if (prev.some(msg => msg.id === newMessage.id)) {
        return prev;
      }
      
      // Update cache
      const updated = [...prev, newMessage];
      const cacheKey = `messages-${conversationId}`;
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      
      return updated;
    });
    
    // Remove from optimistic updates
    setOptimisticMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(newMessage.id);
      return newMap;
    });
  }, [conversationId]);

  // Send message with optimistic updates
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !socket) return;

    const tempId = `temp-${++messageIdCounter.current}`;
    const optimisticMessage: Message = {
      id: tempId,
      text: newMessage,
      conversationId,
      senderId: currentUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageType: 'TEXT' as any,
      readAt: null,
      attachmentUrl: null,
      attachmentName: null,
      attachmentType: null,
      User: {
        id: currentUserId,
        name: 'Jij', // This will be replaced when real message arrives
        username: null,
        profileImage: null,
        displayFullName: null,
        displayNameOption: null
      } as any
    };

    // Add optimistic message immediately
    setOptimisticMessages(prev => new Map(prev).set(tempId, optimisticMessage));
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    // Scroll immediately
    setTimeout(scrollToBottom, 50);

    // Send via socket
    socket.emit('send-message', {
      conversationId,
      senderId: currentUserId,
      text: newMessage,
      messageType: 'TEXT',
    });

    // Clear optimistic message after 5 seconds if no real message received
    setTimeout(() => {
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }, 5000);
  }, [newMessage, socket, conversationId, currentUserId, scrollToBottom]);

  // Socket setup
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join-conversation', conversationId);
    socket.on('new-message', handleNewMessage);

    return () => {
      socket.emit('leave-conversation', conversationId);
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, conversationId, handleNewMessage]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Memoized messages list for performance
  const allMessages = useMemo(() => {
    const realMessages = messages;
    const optimisticMessagesArray = Array.from(optimisticMessages.values());
    return [...realMessages, ...optimisticMessagesArray].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, optimisticMessages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {allMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === currentUserId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              } ${
                optimisticMessages.has(message.id) ? 'opacity-70' : ''
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
                {optimisticMessages.has(message.id) && ' (verzenden...)'}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type je bericht..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verstuur
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </span>
          <span>
            {allMessages.length} berichten
          </span>
        </div>
      </div>
    </div>
  );
}
