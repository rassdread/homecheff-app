'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Clock, CheckCheck, Package } from 'lucide-react';
import Image from 'next/image';
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';

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
  order?: {
    id: string;
    orderNumber: string | null;
    status: string;
    totalAmount: number;
    createdAt: string;
  };
  lastMessage?: {
    id: string;
    text: string | null;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_SHARE' | 'SYSTEM';
    orderNumber?: string | null;
    createdAt: string;
    readAt?: string | null;
    User: {
      id: string;
      name: string | null;
      username: string | null;
      profileImage: string | null;
    };
  } | null;
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
  lastMessageAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
  onMessagesRead?: () => void;
}

export default function ConversationsList({ onSelectConversation, onMessagesRead }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      console.log('[ConversationsList] 📡 Loading conversations...');
      
      const response = await fetch('/api/conversations');
      
      console.log('[ConversationsList] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ConversationsList] ❌ Error response:', response.status, errorText);
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const { conversations: fetchedConversations } = await response.json();
      
      console.log('[ConversationsList] ✅ Loaded conversations:', {
        count: fetchedConversations.length,
        withParticipants: fetchedConversations.filter((c: any) => c.participants?.length > 0).length,
        withLastMessage: fetchedConversations.filter((c: any) => c.lastMessage).length,
        conversationIds: fetchedConversations.map((c: any) => c.id)
      });
      
      setConversations(fetchedConversations);
    } catch (error) {
      console.error('[ConversationsList] ❌ Critical error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh conversations when messages are read
  useEffect(() => {
    if (onMessagesRead) {
      const handleRefresh = () => {
        loadConversations();
      };

      const handleUnreadCountUpdate = () => {
        loadConversations();
      };

      // Listen for custom events to refresh conversations
      window.addEventListener('messagesRead', handleRefresh);
      window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate);
      
      return () => {
        window.removeEventListener('messagesRead', handleRefresh);
        window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate);
      };
    }
  }, [onMessagesRead]);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Nu';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}u`;
    
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatPrice = (priceCents: number) => {
    return `€${(priceCents / 100).toFixed(2)}`;
  };

  const getLastMessagePreview = (lastMessage: Conversation['lastMessage']) => {
    if (!lastMessage) return 'Nog geen berichten';
    
    if (lastMessage.messageType === 'IMAGE') {
      return '📷 Foto';
    } else if (lastMessage.messageType === 'FILE') {
      return '📎 Bestand';
    } else if (lastMessage.messageType === 'SYSTEM') {
      return lastMessage.text || 'Systeembericht';
    }
    
    return lastMessage.text || 'Bericht';
  };

  const getLastMessageSender = (lastMessage: Conversation['lastMessage'], currentUser: any) => {
    if (!lastMessage) return '';
    
    const currentUserId = currentUser?.id || '';
    const isOwn = lastMessage.User.id === currentUserId;
    
    return isOwn ? 'Jij: ' : '';
  };

  // Get current user for checking message ownership
  const getCurrentUserId = () => {
    return (session?.user as any)?.id || '';
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      // Mark all unread messages in this conversation as read
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Trigger refresh of conversation list
        if (onMessagesRead) {
          onMessagesRead();
        }
        
        // Dispatch custom event to refresh other components
        window.dispatchEvent(new CustomEvent('messagesRead'));
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Gesprekken laden...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">Nog geen gesprekken</p>
        <p className="text-sm">Start een gesprek door een product te bekijken!</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search/Filter Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <input
            type="text"
            placeholder="Zoek in gesprekken..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <MessageCircle className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => {
              console.log('[ConversationsList] 🖱️ Conversation clicked:', {
                id: conversation.id,
                title: conversation.title,
                hasParticipants: !!conversation.participants && conversation.participants.length > 0,
                hasOtherParticipant: !!conversation.otherParticipant,
                participantName: conversation.otherParticipant?.name || conversation.participants?.[0]?.name
              });
              onSelectConversation(conversation);
              markConversationAsRead(conversation.id);
            }}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                {conversation.product?.Image[0] ? (
                  <Image
                    src={conversation.product.Image[0].fileUrl}
                    alt={conversation.product.title}
                    width={50}
                    height={50}
                    className="rounded-full object-cover"
                  />
                ) : conversation.participants[0]?.profileImage ? (
                  <Image
                    src={conversation.participants[0].profileImage}
                    alt={getDisplayName(conversation.participants[0])}
                    width={50}
                    height={50}
                    className="rounded-full object-cover"
                  />
                ) : conversation.order ? (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {(conversation.participants?.[0]?.name || conversation.participants?.[0]?.username || conversation.title || 'G').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Unread indicator */}
                {conversation.lastMessage && 
                 conversation.lastMessage.User.id !== getCurrentUserId() && 
                 !conversation.lastMessage.readAt && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {conversation.participants && conversation.participants.length > 0
                      ? getDisplayName(conversation.participants[0])
                      : conversation.title}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                </div>
                {conversation.product && (
                  <p className="text-xs text-gray-500 truncate mb-1">
                    💬 over: {conversation.product.title}
                  </p>
                )}
                
                {conversation.lastMessage ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate flex-1">
                      {getLastMessageSender(conversation.lastMessage, session?.user)}
                      {getLastMessagePreview(conversation.lastMessage)}
                    </p>
                    {conversation.lastMessage.User.id === getCurrentUserId() && (
                      <CheckCheck className={`w-4 h-4 flex-shrink-0 ml-2 ${
                        conversation.lastMessage.readAt ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 truncate">
                    Gesprek gestart
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
