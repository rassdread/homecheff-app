'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MessageEncryption from './MessageEncryption';
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

  // Mark messages as read when conversation is opened
  useEffect(() => {
    const markConversationAsRead = async () => {
      if (!conversation.id || !currentUserId) return;
      
      try {
        // Mark all unread messages in this conversation as read
        const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // The API already marks messages as read when fetching them
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
    
    // Mark as read after a short delay to ensure messages are loaded
    const timer = setTimeout(() => {
      markConversationAsRead();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [conversation.id, currentUserId, onMessagesRead]);

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
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    try {
      // Send message via socket
      socket.emit('send-message', {
        conversationId: conversation.id,
        senderId: currentUserId,
        text: messageData.text,
        messageType: messageData.messageType,
        attachmentUrl: messageData.attachmentUrl,
        attachmentName: messageData.attachmentName,
        attachmentType: messageData.attachmentType,
      });
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

  // Encryption functions
  const handleEncryptMessage = async (messageId: string, key: string) => {
    try {
      const response = await fetch('/api/messages/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, encryptionKey: key })
      });

      if (!response.ok) {
        throw new Error('Encryption failed');
      }

      // Reload messages to show encrypted state
      loadMessages();
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  };

  const handleDecryptMessage = async (messageId: string, key: string): Promise<string> => {
    try {
      const response = await fetch('/api/messages/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, encryptionKey: key })
      });

      if (!response.ok) {
        throw new Error('Decryption failed');
      }

      const data = await response.json();
      return data.decryptedText;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {conversation.otherParticipant?.profileImage ? (
              <Image
                src={conversation.otherParticipant.profileImage}
                alt={getDisplayNameForConversation(conversation.otherParticipant)}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-medium">
                  {getDisplayNameForConversation(conversation.otherParticipant)?.charAt(0)}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900 truncate">
                <ClickableName 
                  user={conversation.otherParticipant}
                  className="hover:text-primary-600 transition-colors"
                />
              </h2>
              {conversation.product && (
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  Over: {conversation.product.title}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block">
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
                className="rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{conversation.product.title}</h3>
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
          <div className="p-3 sm:p-4 text-center">
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
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
          onEncryptMessage={handleEncryptMessage}
          onDecryptMessage={handleDecryptMessage}
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



