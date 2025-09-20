'use client';

import { useEffect, useRef, useState } from 'react';
import { Message, User, Package, MapPin, Clock, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface MessageType {
  id: string;
  text: string | null;
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
}

export default function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const renderMessage = (message: MessageType) => {
    const isOwn = message.User.id === currentUserId;
    const senderName = message.User.name || message.User.username || 'Onbekend';
    const isSystemMessage = ['SYSTEM', 'ORDER_STATUS_UPDATE', 'ORDER_PICKUP_INFO', 'ORDER_DELIVERY_INFO', 'ORDER_ADDRESS_UPDATE'].includes(message.messageType);

    // Special styling for system/order messages
    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center mb-4">
          <div className="max-w-md">
            <div className={`px-4 py-3 rounded-lg border-2 ${
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
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          {!isOwn && (
            <div className="flex-shrink-0 mr-2">
              {message.User.profileImage ? (
                <Image
                  src={message.User.profileImage}
                  alt={senderName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          )}

          {/* Message content */}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            {!isOwn && (
              <span className="text-xs text-gray-500 mb-1">{senderName}</span>
            )}
            
            <div
              className={`px-4 py-2 rounded-lg ${
                isOwn
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
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
                  <Message className="w-4 h-4" />
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
            
            <span className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
              {formatTime(message.createdAt)}
              {isOwn && message.readAt && (
                <span className="ml-1 text-blue-400">✓✓</span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Berichten laden...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <Message className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nog geen berichten</p>
            <p className="text-sm">Start het gesprek!</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
