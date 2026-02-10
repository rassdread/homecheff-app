'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Message {
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

interface UseRealTimeMessagesProps {
  conversationId: string;
  currentUserId: string;
}

export function useRealTimeMessages({ conversationId, currentUserId }: UseRealTimeMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Load messages function
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages-fast?page=1&limit=100`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages || [];
        
        setMessages(loadedMessages);
        
        // Update last message ID for change detection
        if (loadedMessages.length > 0) {
          const latestMessageId = loadedMessages[loadedMessages.length - 1].id;
          setLastMessageId(latestMessageId);
        }
        
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('[useRealTimeMessages] Error loading messages:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Check for new messages
  const checkForNewMessages = useCallback(async () => {
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
            setConnectionStatus('connected');
            return true; // Indicate new messages were found
          }
        }
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('[useRealTimeMessages] Error checking for messages:', error);
      setConnectionStatus('disconnected');
    }
    return false;
  }, [conversationId, lastMessageId]);

  // Send message function
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!text.trim() || isSending) return false;

    setIsSending(true);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          text: text.trim(),
          messageType: 'TEXT',
        }),
      });

      if (response.ok) {
        // Immediately check for new messages
        setTimeout(() => {
          checkForNewMessages();
        }, 500);
        
        return true;
      } else {
        throw new Error(`Failed to send message: ${response.status}`);
      }
    } catch (error) {
      console.error('[useRealTimeMessages] Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [conversationId, isSending, checkForNewMessages]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    pollIntervalRef.current = setInterval(async () => {
      await checkForNewMessages();
    }, 2000); // Poll every 2 seconds
  }, [checkForNewMessages]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = undefined;
    }
  }, []);

  // Initialize
  useEffect(() => {
    if (conversationId && currentUserId) {
      loadMessages();
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [conversationId, currentUserId, loadMessages, startPolling, stopPolling]);

  // Auto-reconnect on disconnection
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      reconnectTimeoutRef.current = setTimeout(() => {
        loadMessages();
        startPolling();
      }, 5000); // Try to reconnect after 5 seconds
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectionStatus, loadMessages, startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [stopPolling]);

  return {
    messages,
    isLoading,
    isSending,
    connectionStatus,
    sendMessage,
    refreshMessages: loadMessages,
  };
}
