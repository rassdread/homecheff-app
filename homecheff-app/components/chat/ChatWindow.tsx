'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import Image from 'next/image';
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';

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

interface Message {
  id: string;
  text: string | null;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_SHARE' | 'SYSTEM';
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  createdAt: string;
  readAt?: string | null;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
}

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
  onMessagesRead?: () => void;
}

export default function ChatWindow({ conversation, onBack, onMessagesRead }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  const { socket } = useSocket();
  const { data: session } = useSession();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const currentUserId = session?.user?.email || '';

  useEffect(() => {
    if (!socket || !conversation.id) return;

    // Join conversation room
    socket.emit('join-conversation', conversation.id);

    // Listen for new messages
    socket.on('new-message', (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage]);
    });

    // Listen for message errors
    socket.on('message-error', (error: { error: string }) => {
      console.error('Message error:', error);
      // You can show a toast notification here
    });

    return () => {
      socket.emit('leave-conversation', conversation.id);
      socket.off('new-message');
      socket.off('message-error');
    };
  }, [socket, conversation.id]);

  useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  const loadMessages = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(
        `/api/conversations/${conversation.id}/messages?page=${pageNum}&limit=50`
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const { messages: newMessages } = await response.json();

      if (append) {
        setMessages(prev => [...newMessages, ...prev]);
      } else {
        setMessages(newMessages);
      }

      setHasMoreMessages(newMessages.length === 50);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreMessages = () => {
    if (!isLoadingMore && hasMoreMessages) {
      loadMessages(page + 1, true);
    }
  };

  const handleSendMessage = async (messageData: {
    text: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
  }) => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { message } = await response.json();
      
      // Message will be added via socket event, but we can add it optimistically
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Error sending message:', error);
      // You can show a toast notification here
    }
  };

  const formatPrice = (priceCents: number) => {
    return `€${(priceCents / 100).toFixed(2)}`;
  };

  const getDisplayNameForConversation = (user: Conversation['otherParticipant']) => {
    if (!user) return 'Onbekend';
    return getDisplayName(user);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            {conversation.otherParticipant?.profileImage ? (
              <Image
                src={conversation.otherParticipant.profileImage}
                alt={getDisplayNameForConversation(conversation.otherParticipant)}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {getDisplayNameForConversation(conversation.otherParticipant)?.charAt(0)}
                </span>
              </div>
            )}

            <div>
              <h2 className="font-semibold text-gray-900">
                <ClickableName 
                  user={conversation.otherParticipant}
                  className="hover:text-primary-600 transition-colors"
                />
              </h2>
              {conversation.product && (
                <p className="text-sm text-gray-500">
                  Over: {conversation.product.title}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Product info banner */}
      {conversation.product && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center space-x-3">
            {conversation.product.Image[0] && (
              <Image
                src={conversation.product.Image[0].fileUrl}
                alt={conversation.product.title}
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{conversation.product.title}</h3>
              <p className="text-sm text-blue-600 font-medium">
                {formatPrice(conversation.product.priceCents)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden" ref={messagesContainerRef}>
        {hasMoreMessages && (
          <div className="p-4 text-center">
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoadingMore ? 'Laden...' : 'Meer berichten laden'}
            </button>
          </div>
        )}
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
          onMessagesRead={onMessagesRead}
        />
      </div>

      {/* Message input */}
      <MessageInput
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onSendMessage={handleSendMessage}
        disabled={!socket}
      />
    </div>
  );
}



