'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, User, Package, MapPin, Clock, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';
import MessageEncryption from './MessageEncryption';

interface MessageType {
  id: string;
  text: string | null;
  encryptedText?: string | null;
  isEncrypted?: boolean;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_SHARE' | 'SYSTEM' | 'ORDER_STATUS_UPDATE' | 'ORDER_PICKUP_INFO' | 'ORDER_DELIVERY_INFO' | 'ORDER_ADDRESS_UPDATE';
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  orderNumber?: string | null; // For order-related messages
  createdAt: string;
  readAt?: string | null;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
}

interface MessageListProps {
  messages: MessageType[];
  currentUserId: string;
  isLoading?: boolean;
  onMessagesRead?: () => void;
  onEncryptMessage?: (messageId: string, key: string) => Promise<void>;
  onDecryptMessage?: (messageId: string, key: string) => Promise<string>;
}

export default function MessageList({ messages, currentUserId, isLoading, onMessagesRead, onEncryptMessage, onDecryptMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when user scrolls to bottom or after a delay
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!messages.length || !currentUserId) return;
      
      // Get unread messages that are not from current user
      const unreadMessages = messages.filter(
        message => !message.readAt && message.User.id !== currentUserId
      );
      
      if (unreadMessages.length === 0) return;
      
      try {
        // Mark all unread messages as read
        const results = await Promise.all(
          unreadMessages.map(message =>
            fetch(`/api/messages/${message.id}/read`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
            })
          )
        );
        
        // Check if all requests were successful and get unread counts
        const responses = await Promise.all(
          results.map(async response => {
            if (response.ok) {
              const data = await response.json();
              return { success: true, unreadCount: data.unreadCount };
            }
            return { success: false, unreadCount: null };
          })
        );
        
        const allSuccessful = responses.every(r => r.success);
        
        if (allSuccessful) {
          // Get the latest unread count from the last response
          const lastResponse = responses[responses.length - 1];
          if (lastResponse.unreadCount !== null) {
            // Dispatch event with unread count update
            window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
              detail: { unreadCount: lastResponse.unreadCount } 
            }));
          }
          
          // Trigger a refresh of the conversation list to update unread counts
          if (onMessagesRead) {
            onMessagesRead();
          }
          
          // Dispatch custom event to refresh other components
          window.dispatchEvent(new CustomEvent('messagesRead'));
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    
    // Mark messages as read after a shorter delay for better UX
    const timer = setTimeout(() => {
      markMessagesAsRead();
    }, 1000); // Reduced delay to 1 second for better responsiveness
    
    return () => clearTimeout(timer);
  }, [messages, currentUserId, onMessagesRead]);

  // Also mark as read when user scrolls to bottom
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set a new timeout to debounce scroll events
      scrollTimeout = setTimeout(() => {
        if (messagesEndRef.current) {
          const rect = messagesEndRef.current.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isVisible) {
            // Mark messages as read when user scrolls to bottom
            const markAsRead = async () => {
              if (!messages.length || !currentUserId) return;
              
              const unreadMessages = messages.filter(
                message => !message.readAt && message.User.id !== currentUserId
              );
              
              if (unreadMessages.length === 0) return;
              
              try {
                const results = await Promise.all(
                  unreadMessages.map(message =>
                    fetch(`/api/messages/${message.id}/read`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                  )
                );
                
                const allSuccessful = results.every(response => response.ok);
                
                if (allSuccessful && onMessagesRead) {
                  onMessagesRead();
                  // Dispatch custom event to refresh other components
                  window.dispatchEvent(new CustomEvent('messagesRead'));
                }
              } catch (error) {
                console.error('Error marking messages as read:', error);
              }
            };
            
            markAsRead();
          }
        }
      }, 300); // Debounce scroll events by 300ms
    };
    
    // Use a more specific scroll container if available
    const scrollContainer = document.querySelector('.overflow-y-auto') || window;
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [messages, currentUserId, onMessagesRead]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Nu';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}u`;
    
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group messages by sender and time (WhatsApp style)
  const shouldGroupWithPrevious = (currentMsg: MessageType, prevMsg: MessageType | undefined) => {
    if (!prevMsg) return false;
    if (prevMsg.User.id !== currentMsg.User.id) return false;
    
    const timeDiff = new Date(currentMsg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
    return timeDiff < 60000; // Group if less than 1 minute apart
  };

  const renderMessage = (message: MessageType, index: number) => {
    const isOwn = message.User.id === currentUserId;
    const isSystemMessage = ['SYSTEM', 'ORDER_STATUS_UPDATE', 'ORDER_PICKUP_INFO', 'ORDER_DELIVERY_INFO', 'ORDER_ADDRESS_UPDATE'].includes(message.messageType);
    const prevMessage = index > 0 ? messages[index - 1] : undefined;
    const shouldGroup = shouldGroupWithPrevious(message, prevMessage);
    const showAvatar = !shouldGroup && !isOwn;
    const showName = !shouldGroup && !isOwn;

    // Special styling for system/order messages
    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center mb-4 animate-in fade-in duration-300">
          <div className="max-w-md">
            <div className={`px-4 py-3 rounded-xl border-2 shadow-sm ${
              message.messageType === 'ORDER_STATUS_UPDATE' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : message.messageType === 'ORDER_PICKUP_INFO'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : message.messageType === 'ORDER_DELIVERY_INFO'
                ? 'bg-purple-50 border-purple-200 text-purple-800'
                : message.messageType === 'ORDER_ADDRESS_UPDATE'
                ? 'bg-orange-50 border-orange-200 text-orange-800'
                : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {message.messageType === 'ORDER_STATUS_UPDATE' && <CheckCircle className="w-4 h-4" />}
                {message.messageType === 'ORDER_PICKUP_INFO' && <Package className="w-4 h-4" />}
                {message.messageType === 'ORDER_DELIVERY_INFO' && <Package className="w-4 h-4" />}
                {message.messageType === 'ORDER_ADDRESS_UPDATE' && <MapPin className="w-4 h-4" />}
                <span className="text-xs font-medium">
                  {message.messageType === 'ORDER_STATUS_UPDATE' && 'Status Update'}
                  {message.messageType === 'ORDER_PICKUP_INFO' && 'Afhaal Informatie'}
                  {message.messageType === 'ORDER_DELIVERY_INFO' && 'Bezorg Informatie'}
                  {message.messageType === 'ORDER_ADDRESS_UPDATE' && 'Adres Update'}
                  {message.messageType === 'SYSTEM' && 'Systeem Bericht'}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                <span>{formatTime(message.createdAt)}</span>
                {message.orderNumber && (
                  <span className="font-medium">#{message.orderNumber}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
          shouldGroup ? 'mb-1' : 'mb-4'
        } px-2 sm:px-0 animate-in slide-in-from-bottom-2 duration-200`}
      >
        <div className={`flex max-w-[85%] sm:max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar - WhatsApp/Telegram style (only show if not grouped) */}
          {showAvatar ? (
            <div className="flex-shrink-0 mr-2">
              {message.User.profileImage ? (
                <Image
                  src={message.User.profileImage}
                  alt={getDisplayName(message.User)}
                  width={32}
                  height={32}
                  className="rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ) : !isOwn ? (
            <div className="w-8 mr-2 flex-shrink-0" />
          ) : null}

          {/* Message content - iMessage/WhatsApp style bubbles */}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0`}>
            {showName && (
              <ClickableName 
                user={message.User}
                className="text-xs text-gray-500 mb-1 px-1"
              />
            )}
            
            <div
              className={`px-3 sm:px-4 py-2 break-words shadow-sm ${
                isOwn
                  ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-gray-200 text-gray-800 rounded-2xl rounded-tl-sm'
              } ${shouldGroup ? 'mt-1' : ''}`}
            >
              {message.messageType === 'TEXT' && (
                <div className="space-y-1">
                  {message.orderNumber && (
                    <div className={`text-xs font-medium ${
                      isOwn ? 'text-blue-100' : 'text-blue-600'
                    }`}>
                      #{message.orderNumber}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              )}
              
              {/* Encryption component for TEXT messages */}
              {message.messageType === 'TEXT' && onEncryptMessage && onDecryptMessage && (
                <div className="mt-2">
                  <MessageEncryption
                    messageId={message.id}
                    isEncrypted={message.isEncrypted || false}
                    onEncrypt={onEncryptMessage}
                    onDecrypt={onDecryptMessage}
                  />
                </div>
              )}
              
              {message.messageType === 'IMAGE' && message.attachmentUrl && (
                <div className="space-y-2">
                  {message.text && (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                  <Image
                    src={message.attachmentUrl}
                    alt="Shared image"
                    width={200}
                    height={200}
                    className="rounded-lg max-w-full h-auto"
                  />
                </div>
              )}
              
              {message.messageType === 'FILE' && message.attachmentUrl && (
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline hover:no-underline"
                  >
                    {message.attachmentName || 'Bestand'}
                  </a>
                </div>
              )}
              
              {message.messageType === 'SYSTEM' && (
                <p className="text-xs text-gray-600 italic">{message.text}</p>
              )}
            </div>
            
            {/* Timestamp and read receipts - WhatsApp style */}
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                {formatTime(message.createdAt)}
              </span>
              {isOwn && (
                <span className="text-xs">
                  {message.readAt ? (
                    <span className="text-blue-300" title="Gelezen">✓✓</span>
                  ) : (
                    <span className="text-gray-400" title="Verzonden">✓</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  console.log('[MessageList] Render - messages count:', messages.length, 'isLoading:', isLoading);
  console.log('[MessageList] Messages data:', messages);
  console.log('[MessageList] Current user ID:', currentUserId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Berichten laden...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm sm:text-base">Nog geen berichten</p>
            <p className="text-xs sm:text-sm">Start het gesprek!</p>
            <p className="text-xs text-gray-400 mt-2">
              Debug: {messages.length} berichten geladen | User ID: {currentUserId}
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => renderMessage(message, index))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
