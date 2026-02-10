'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import ConversationsList from '@/components/chat/ConversationsList';
import CompleteChat from '@/components/chat/CompleteChat';

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

interface MobileMessagesViewProps {
  onUnreadCountChange?: (count: number) => void;
  initialConversationId?: string | null;
}

/**
 * Mobile-optimized messages view
 * Uses full viewport height and provides smooth transitions
 */
export default function MobileMessagesView({ onUnreadCountChange, initialConversationId }: MobileMessagesViewProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for messages read events
  useEffect(() => {
    const handleMessagesRead = () => fetchUnreadCount();
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
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedConversation(conversation);
      setIsTransitioning(false);
    }, 150);
  };

  const handleBackToList = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedConversation(null);
      setIsTransitioning(false);
      fetchUnreadCount();
    }, 150);
  };

  const handleMessagesRead = () => {
    fetchUnreadCount();
  };

  // Mobile fullscreen view
  if (selectedConversation) {
    return (
      <div 
        className={`fixed inset-0 z-50 bg-white transition-transform duration-300 ease-in-out ${
          isTransitioning ? 'translate-x-full' : 'translate-x-0'
        } md:relative md:inset-auto md:z-0 md:translate-x-0`}
        style={{ 
          height: '100vh',
          maxHeight: '100vh'
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

  return (
    <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 -mx-4 sm:mx-0 sm:px-0 sm:border-0 sm:static">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-brand flex-shrink-0" />
              <span className="truncate">Berichten</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
              Je gesprekken met kopers en verkopers
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full flex-shrink-0">
              <span className="text-xs font-medium">{unreadCount}</span>
              <span className="text-xs hidden xs:inline">nieuw</span>
            </div>
          )}
        </div>
      </div>

      {/* Conversations List - Full height on mobile */}
      <div className="mt-4 -mx-4 sm:mx-0">
        <div className="bg-white sm:rounded-xl sm:border sm:border-gray-200 sm:shadow-sm">
          <ConversationsList 
            onSelectConversation={handleSelectConversation}
            onMessagesRead={handleMessagesRead}
          />
        </div>
      </div>
    </div>
  );
}

