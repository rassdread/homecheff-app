'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Clock, CheckCheck, Package } from 'lucide-react';
import Image from 'next/image';

interface Conversation {
  id: string;
  title: string;
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
  lastMessageAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void;
}

export default function ConversationsList({ onSelectConversation }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const { conversations: fetchedConversations } = await response.json();
      setConversations(fetchedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getDisplayName = (participants: Conversation['participants']) => {
    if (participants.length === 0) return 'Onbekend';
    const participant = participants[0];
    return participant.name || participant.username || 'Onbekend';
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

  const getLastMessageSender = (lastMessage: Conversation['lastMessage'], currentUserId: string) => {
    if (!lastMessage) return '';
    
    const isOwn = lastMessage.User.id === currentUserId;
    const senderName = lastMessage.User.name || lastMessage.User.username || 'Onbekend';
    
    return isOwn ? 'Jij: ' : `${senderName}: `;
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
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-start space-x-3">
            {/* Product image, order icon, or participant avatar */}
            <div className="flex-shrink-0">
              {conversation.product?.Image[0] ? (
                <Image
                  src={conversation.product.Image[0].fileUrl}
                  alt={conversation.product.title}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : conversation.order ? (
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 truncate">
                  {conversation.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  )}
                  {!conversation.isActive && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex-1 min-w-0">
                  {conversation.product && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.product.title} • {formatPrice(conversation.product.priceCents)}
                    </p>
                  )}
                  
                  {conversation.order && (
                    <div className="flex items-center space-x-2">
                      <Package className="w-3 h-3 text-blue-500" />
                      <p className="text-sm text-blue-600 font-medium truncate">
                        {conversation.order.orderNumber || `Bestelling ${conversation.order.id.slice(-6)}`}
                      </p>
                    </div>
                  )}
                  
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      {getLastMessageSender(conversation.lastMessage, session?.user?.email || '')}
                      {getLastMessagePreview(conversation.lastMessage)}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 ml-2">
                  {conversation.lastMessage && conversation.lastMessage.User.id === session?.user?.email && (
                    <CheckCheck className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  Met: {getDisplayName(conversation.participants)}
                </p>
                
                {conversation.lastMessageAt && (
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
