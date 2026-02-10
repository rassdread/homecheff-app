'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import ConversationsList from '@/components/chat/ConversationsList';
import CompleteChat from '@/components/chat/CompleteChat';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Conversation {
  id: string;
  title?: string;
  product?: {
    id: string;
    title: string;
    priceCents: number;
    Image: Array<{
      fileUrl: string;
      sortOrder: number;
    }>;
  };
  participants: Array<{
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  }>;
  otherParticipant?: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
  lastMessage?: {
    id: string;
    text: string | null;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_SHARE' | 'SYSTEM';
    createdAt: string;
    readAt?: string | null;
    User: {
      id: string;
      name: string | null;
      username: string | null;
      profileImage: string | null;
    };
  } | null;
  lastMessageAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ProfileMessagesProps {
  onUnreadCountChange?: (count: number) => void;
}

export default function ProfileMessages({ onUnreadCountChange }: ProfileMessagesProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        const count = data.count || 0;
        setUnreadCount(count);
        if (onUnreadCountChange) {
          onUnreadCountChange(count);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling for new messages
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for messages read events to refresh unread count
  useEffect(() => {
    const handleMessagesRead = () => {
      fetchUnreadCount();
    };
    
    const handleUnreadCountUpdate = (event: CustomEvent) => {
      const { unreadCount: newCount } = event.detail;
      if (typeof newCount === 'number') {
        setUnreadCount(newCount);
        if (onUnreadCountChange) {
          onUnreadCountChange(newCount);
        }
      }
    };
    
    window.addEventListener('messagesRead', handleMessagesRead);
    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate as EventListener);
    
    return () => {
      window.removeEventListener('messagesRead', handleMessagesRead);
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate as EventListener);
    };
  }, [onUnreadCountChange]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    // Refresh unread count when going back to list
    fetchUnreadCount();
  };

  const handleMessagesRead = () => {
    // Refresh unread count when messages are read
    fetchUnreadCount();
  };

  if (selectedConversation) {
    // Mobile: Fixed fullscreen overlay
    if (isMobile) {
      return (
        <div 
          className="fixed inset-0 z-50 bg-white"
          style={{ 
            height: '100vh',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <CompleteChat
            conversationId={selectedConversation.id}
            otherParticipant={
              selectedConversation.otherParticipant || 
              (selectedConversation.participants && selectedConversation.participants[0]) ||
              { id: '', name: 'Gebruiker', username: null, profileImage: null }
            }
            onBack={handleBackToList}
          />
        </div>
      );
    }
    
    // Desktop: Contained view
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" 
           style={{ 
             height: 'calc(100vh - 250px)', 
             minHeight: '500px',
             maxHeight: 'calc(100vh - 200px)' 
           }}>
        {selectedConversation.otherParticipant && (
          <CompleteChat
            conversationId={selectedConversation.id}
            otherParticipant={selectedConversation.otherParticipant}
            onBack={handleBackToList}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with unread count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-brand flex-shrink-0" />
            <span className="truncate">Berichten</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
            Je gesprekken met kopers en verkopers
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-red-500 text-white rounded-full flex-shrink-0">
            <span className="text-xs sm:text-sm font-medium">{unreadCount}</span>
            <span className="text-xs hidden sm:inline">ongelezen</span>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 sm:p-4">
        <ConversationsList 
          onSelectConversation={handleSelectConversation}
          onMessagesRead={handleMessagesRead}
        />
      </div>
    </div>
  );
}

