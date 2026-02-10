'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, MoreHorizontal, Phone, Mail, User, Badge } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import EmojiPickerButton from '@/components/chat/EmojiPicker';
import { useTranslation } from '@/hooks/useTranslation';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  sender: {
    id: string;
    name: string;
    username?: string;
    image?: string;
    role?: string;
  };
  receiver: {
    id: string;
    name: string;
    username?: string;
    image?: string;
    role?: string;
  };
  product?: {
    id: string;
    title: string;
    image?: string;
  };
}

interface Conversation {
  conversationId: string;
  otherUserId: string;
  otherUser: {
    id: string;
    name: string;
    username?: string;
    image?: string;
    role?: string;
  };
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

interface MessagesBoxProps {
  className?: string;
}

export default function MessagesBox({ className = '' }: MessagesBoxProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    if ((session as any)?.user?.id) {
      fetchMessages();
      
      // Set up polling for new messages
      const interval = setInterval(fetchMessages, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages/personal');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
        
        // Process conversations
        const processedConversations = processConversations(data.messages || []);
        setConversations(processedConversations);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [(session as any)?.user?.id]);

  // Process messages into conversations with unique user IDs
  const processConversations = (messages: Message[]): Conversation[] => {
    const conversationMap = new Map<string, Message[]>();
    
    messages.forEach(message => {
      // Create unique conversation ID based on the other user's ID
      const otherUserId = message.senderId === (session as any)?.user?.id 
        ? message.receiverId 
        : message.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, []);
      }
      conversationMap.get(otherUserId)?.push(message);
    });

    return Array.from(conversationMap.entries()).map(([userId, msgs]) => {
      const sortedMessages = msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastMessage = sortedMessages[sortedMessages.length - 1];
      
      // Get the other user's info
      const otherUser = lastMessage.senderId === (session as any)?.user?.id 
        ? lastMessage.receiver 
        : lastMessage.sender;

      return {
        conversationId: `conv_${userId}`, // Unique conversation ID
        otherUserId: userId,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          image: otherUser.image,
          role: otherUser.role
        },
        lastMessage,
        unreadCount: sortedMessages.filter(msg => !msg.isRead && msg.senderId !== (session as any)?.user?.id).length,
        messages: sortedMessages
      };
    }).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!content.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const response = await fetch('/api/messages/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId,
          content: content.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update local state - mark message as read
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, isRead: true, readAt: new Date() }
              : msg
          )
        );
        
        // Update conversations with updated unread counts
        setConversations(prevConversations => 
          prevConversations.map(conv => {
            const updatedMessages = conv.messages.map(msg =>
              msg.id === messageId
                ? { ...msg, isRead: true, readAt: new Date() }
                : msg
            );
            return {
              ...conv,
              messages: updatedMessages,
              unreadCount: updatedMessages.filter(msg => 
                !msg.isRead && msg.senderId !== (session as any)?.user?.id
              ).length
            };
          })
        );
        
        // Fetch latest unread count from API to ensure accuracy
        const countResponse = await fetch('/api/messages/unread-count');
        if (countResponse.ok) {
          const countData = await countResponse.json();
          const newUnreadCount = countData.count || 0;
          setUnreadCount(newUnreadCount);
          
          // Dispatch events to update other components
          window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
            detail: { unreadCount: newUnreadCount } 
          }));
          window.dispatchEvent(new CustomEvent('messagesRead'));
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Listen for messages read events from other components
  useEffect(() => {
    const handleMessagesRead = () => {
      fetchMessages(); // Refresh to get latest state
    };
    
    const handleUnreadCountUpdate = (event: CustomEvent) => {
      const { unreadCount: newCount } = event.detail;
      if (typeof newCount === 'number') {
        setUnreadCount(newCount);
      }
    };
    
    window.addEventListener('messagesRead', handleMessagesRead);
    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate as EventListener);
    
    return () => {
      window.removeEventListener('messagesRead', handleMessagesRead);
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate as EventListener);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && selectedConversation) {
      scrollToBottom();
    }
  }, [isOpen, selectedConversation, messages]);

  if (!(session as any)?.user?.id) {
    return null;
  }

  const currentConversation = conversations.find(conv => conv.conversationId === selectedConversation);

  return (
    <div className={`relative ${className}`}>
      {/* Messages Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title={t('messages.title')}
        aria-label={t('messages.title')}
      >
        <MessageCircle className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 min-w-[20px] flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Messages Panel */}
      {isOpen && (
        <>
          {/* Mobile overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-4 top-20 bottom-4 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 md:max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col md:max-h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{t('messages.title')}</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                    {unreadCount} nieuw
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {loading ? (
                <div className="p-6 text-center flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-sm text-gray-500">{t('messages.loading')}</p>
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-700 text-base font-medium mb-1">{t('messages.noMessages')}</p>
                    <p className="text-gray-500 text-sm">
                      {t('messages.startConversation')}
                    </p>
                  </div>
                </div>
              ) : selectedConversation && currentConversation ? (
                /* Conversation View */
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Conversation Header */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded-md hover:bg-blue-50 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center md:hidden"
                        aria-label={t('messages.back')}
                      >
                        ←
                      </button>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {currentConversation.otherUser.image ? (
                          <img
                            src={currentConversation.otherUser.image}
                            alt={currentConversation.otherUser.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base text-gray-900 truncate">{currentConversation.otherUser.name}</span>
                            {currentConversation.otherUser.role === 'ADMIN' && (
                              <Badge className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          {currentConversation.otherUser.username && (
                            <span className="text-xs text-gray-500 truncate block">@{currentConversation.otherUser.username}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Bellen">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Meer opties">
                        <MoreHorizontal className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {currentConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === (session as any)?.user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[75%] md:max-w-xs">
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm ${
                              message.senderId === (session as any)?.user?.id
                                ? 'bg-blue-500 text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap">{message.content}</p>
                            <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                              message.senderId === (session as any)?.user?.id
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}>
                              <span>
                                {new Date(message.timestamp).toLocaleTimeString('nl-NL', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {message.senderId === (session as any)?.user?.id && message.isRead && (
                                <span className="flex-shrink-0">✓✓</span>
                              )}
                            </div>
                          </div>
                          {message.product && (
                            <div className="mt-1.5">
                              <Link
                                href={`/product/${message.product.id}`}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-1"
                              >
                                <span>📦</span>
                                <span className="truncate font-medium">{message.product.title}</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                    <div className="flex gap-2">
                      <EmojiPickerButton
                        onEmojiClick={(emoji) => {
                          setNewMessage(prev => prev + emoji);
                          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                          if (input) input.focus();
                        }}
                        className="flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(currentConversation.otherUserId, newMessage);
                          }
                        }}
                        placeholder={t('messages.typeMessage')}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        disabled={sendingMessage}
                      />
                      <button
                        onClick={() => sendMessage(currentConversation.otherUserId, newMessage)}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                        aria-label="Verzenden"
                      >
                        {sendingMessage ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Conversations List */
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conversation) => (
                  <button
                    key={conversation.conversationId}
                    onClick={async () => {
                      setSelectedConversation(conversation.conversationId);
                      // Mark all unread messages as read
                      const unreadMessages = conversation.messages.filter(
                        msg => !msg.isRead && msg.senderId !== (session as any)?.user?.id
                      );
                      if (unreadMessages.length > 0) {
                        // Mark all unread messages as read
                        await Promise.all(
                          unreadMessages.map(msg => markAsRead(msg.id))
                        );
                      }
                    }}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 text-left"
                  >
                      <div className="flex-shrink-0">
                        {conversation.otherUser.image ? (
                          <img
                            src={conversation.otherUser.image}
                            alt={conversation.otherUser.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold truncate ${
                              conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {conversation.otherUser.name}
                            </h4>
                            {conversation.otherUser.role === 'ADMIN' && (
                              <Badge className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(conversation.lastMessage.timestamp).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'short',
                                ...(new Date(conversation.lastMessage.timestamp).toDateString() === new Date().toDateString() ? {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                } : {})
                              })}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-xs font-semibold rounded-full h-5 w-5 min-w-[20px] flex items-center justify-center">
                                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm truncate ${
                          conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                          {conversation.lastMessage.content}
                        </p>
                        {conversation.otherUser.username && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            @{conversation.otherUser.username}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!selectedConversation && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <Link
                  href="/messages"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-semibold py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {t('messages.viewAll')} →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}