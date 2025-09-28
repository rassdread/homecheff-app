'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, X, Send, MoreHorizontal, Phone, Mail, User, Badge, 
  Search, Filter, Star, Heart, ShoppingBag, Package, Shield, 
  Users, Bell, Settings, Archive, Trash2, Reply, Forward, Check, 
  UserPlus, UserMinus
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ClickableName from '@/components/ui/ClickableName';
import { getDisplayName } from '@/lib/displayName';

interface Message {
  id: string;
  type: 'message' | 'follow' | 'review' | 'order' | 'admin' | 'favorite' | 'system';
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  priority?: 'low' | 'medium' | 'high';
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
  metadata?: {
    orderNumber?: string;
    reviewRating?: number;
    followCount?: number;
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
  type: 'conversation' | 'notification';
}

interface FanRequest {
  id: string;
  requesterId: string;
  targetId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  requester: {
    id: string;
    name: string;
    username?: string;
    image?: string;
    bio?: string;
  };
}

interface MessagesBoxProps {
  className?: string;
  onMessagesRead?: () => void;
}

export default function ProfessionalMessagesBox({ className = '', onMessagesRead }: MessagesBoxProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [fanRequests, setFanRequests] = useState<FanRequest[]>([]);
  const [pendingFanRequests, setPendingFanRequests] = useState<FanRequest[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message type icons and colors
  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow': return <Users className="w-4 h-4 text-green-500" />;
      case 'review': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'order': return <Package className="w-4 h-4 text-purple-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'favorite': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'system': return <Bell className="w-4 h-4 text-gray-500" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-50 border-blue-200';
      case 'follow': return 'bg-green-50 border-green-200';
      case 'review': return 'bg-yellow-50 border-yellow-200';
      case 'order': return 'bg-purple-50 border-purple-200';
      case 'admin': return 'bg-red-50 border-red-200';
      case 'favorite': return 'bg-pink-50 border-pink-200';
      case 'system': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Fetch all messages and notifications
  useEffect(() => {
    if ((session as any)?.user?.id) {
      fetchAllMessages();
      
      // Set up polling for new messages
      const interval = setInterval(fetchAllMessages, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session]);

  // Auto-mark messages as read when they become visible
  useEffect(() => {
    const markVisibleMessagesAsRead = async () => {
      if (!messages.length || !(session as any)?.user?.id) return;
      
      // Get unread messages that are not from current user
      const unreadMessages = messages.filter(
        message => !message.isRead && message.senderId !== (session as any)?.user?.id
      );
      
      if (unreadMessages.length === 0) return;
      
      try {
        // Mark all unread messages as read, but handle errors gracefully
        const results = await Promise.allSettled(
          unreadMessages.map(message =>
            fetch(`/api/messages/${message.id}/read`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
            })
          )
        );
        
        // Get successful results
        const successfulResults = results
          .map((result, index) => ({ result, index }))
          .filter(({ result }) => result.status === 'fulfilled' && result.value.ok);
        
        if (successfulResults.length > 0) {
          // Update local state only for successful updates
          const successfulMessageIds = successfulResults.map(({ index }) => unreadMessages[index].id);
          
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              successfulMessageIds.includes(msg.id)
                ? { ...msg, isRead: true, readAt: new Date().toISOString() }
                : msg
            )
          );
          
          // Update conversations
          setConversations(prevConversations =>
            prevConversations.map(conv => ({
              ...conv,
              messages: conv.messages.map(msg =>
                successfulMessageIds.includes(msg.id)
                  ? { ...msg, isRead: true, readAt: new Date().toISOString() }
                  : msg
              ),
              unreadCount: conv.messages.filter(msg => !msg.isRead && msg.senderId !== (session as any)?.user?.id).length
            }))
          );
          
          // Recalculate total unread count
          const remainingUnread = messages.filter(
            msg => !successfulMessageIds.includes(msg.id) && !msg.isRead && msg.senderId !== (session as any)?.user?.id
          ).length;
          setUnreadCount(remainingUnread);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    
    // Mark messages as read after a short delay
    const timer = setTimeout(() => {
      markVisibleMessagesAsRead();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [messages, session]);

  const fetchAllMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages/personal');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
        
        // Process conversations and notifications
        const processedData = processMessages(data.messages || []);
        setConversations(processedData);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [(session as any)?.user?.id]);

  // Process messages into conversations and notifications
  const processMessages = (messages: Message[]): Conversation[] => {
    const conversationMap = new Map<string, Message[]>();
    const notificationList: Message[] = [];
    
    messages.forEach(message => {
      if (message.type === 'message') {
        // Direct messages go to conversations
        const otherUserId = message.senderId === (session as any)?.user?.id 
          ? message.receiverId 
          : message.senderId;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, []);
        }
        conversationMap.get(otherUserId)?.push(message);
      } else {
        // Other types are notifications
        notificationList.push(message);
      }
    });

    const conversations: Conversation[] = [];

    // Add conversation threads
    conversationMap.forEach((msgs, userId) => {
      const sortedMessages = msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastMessage = sortedMessages[sortedMessages.length - 1];
      
      const otherUser = lastMessage.senderId === (session as any)?.user?.id 
        ? lastMessage.receiver 
        : lastMessage.sender;

      conversations.push({
        conversationId: `conv_${userId}`,
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
        messages: sortedMessages,
        type: 'conversation'
      });
    });

    // Add notification items
    notificationList.forEach(notification => {
      conversations.push({
        conversationId: `notif_${notification.id}`,
        otherUserId: notification.senderId,
        otherUser: {
          id: notification.sender.id,
          name: notification.sender.name,
          username: notification.sender.username,
          image: notification.sender.image,
          role: notification.sender.role
        },
        lastMessage: notification,
        unreadCount: notification.isRead ? 0 : 1,
        messages: [notification],
        type: 'notification'
      });
    });

    return conversations.sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
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
        fetchAllMessages();
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
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Update the message in the local state immediately
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        );
        
        // Also update conversations
        setConversations(prevConversations =>
          prevConversations.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId
                ? { ...msg, isRead: true, readAt: new Date().toISOString() }
                : msg
            ),
            unreadCount: conv.messages.filter(msg => !msg.isRead && msg.senderId !== (session as any)?.user?.id).length
          }))
        );
        
        // Recalculate total unread count
        const newUnreadCount = messages
          .filter(msg => !msg.isRead && msg.senderId !== (session as any)?.user?.id)
          .length;
        setUnreadCount(newUnreadCount);
      } else if (response.status === 404) {
        // Message not found, remove it from local state
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== messageId)
        );
        console.warn(`Message ${messageId} not found, removing from local state`);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

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
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'unread' && conv.unreadCount > 0) ||
      (filterType === 'conversations' && conv.type === 'conversation') ||
      (filterType === 'notifications' && conv.type === 'notification');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`relative ${className}`}>
      {/* Messages Button - Only visible on desktop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors hidden md:block"
        title="Berichten & Notificaties"
      >
        <MessageCircle className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Messages Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Berichten</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount} nieuw
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Instellingen"
              >
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek in berichten..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Alles</option>
                <option value="unread">Ongelezen</option>
                <option value="conversations">Gesprekken</option>
                <option value="notifications">Notificaties</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-hidden">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Berichten laden...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Geen berichten gevonden</p>
                <p className="text-gray-400 text-xs mt-1">
                  {searchQuery ? 'Probeer andere zoektermen' : 'Je hebt nog geen berichten ontvangen'}
                </p>
              </div>
            ) : selectedConversation && currentConversation ? (
              /* Conversation/Notification View */
              <div className="flex flex-col h-96">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      ← Terug
                    </button>
                    <div className="flex items-center gap-2">
                      {currentConversation.otherUser.image ? (
                        <img
                          src={currentConversation.otherUser.image}
                          alt={currentConversation.otherUser.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <ClickableName 
                            user={currentConversation.otherUser}
                            className="font-medium text-sm hover:text-primary-600 transition-colors"
                          />
                          {currentConversation.otherUser.role === 'ADMIN' && (
                            <Badge className="w-3 h-3 text-red-500" />
                          )}
                          {currentConversation.type === 'notification' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                              {getMessageTypeIcon(currentConversation.lastMessage.type)}
                            </span>
                          )}
                        </div>
                        {currentConversation.otherUser.username && (
                          <span className="text-xs text-gray-500">@{currentConversation.otherUser.username}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {currentConversation.type === 'conversation' && (
                      <>
                        <button className="p-1 hover:bg-gray-100 rounded-full">
                          <Phone className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded-full">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {currentConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === (session as any)?.user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-xs">
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            message.senderId === (session as any)?.user?.id
                              ? 'bg-blue-500 text-white'
                              : getMessageTypeColor(message.type)
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === (session as any)?.user?.id
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString('nl-NL', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {message.senderId === (session as any)?.user?.id && message.isRead && (
                              <span className="ml-1">✓</span>
                            )}
                          </p>
                        </div>
                        {message.product && (
                          <div className="mt-1">
                            <Link
                              href={`/product/${message.product.id}`}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <span>📦</span>
                              <span className="truncate">{message.product.title}</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input - Only for conversations */}
                {currentConversation.type === 'conversation' && (
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex gap-2">
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
                        placeholder="Typ een bericht..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        disabled={sendingMessage}
                      />
                      <button
                        onClick={() => sendMessage(currentConversation.otherUserId, newMessage)}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingMessage ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Conversations List */
              <div className="max-h-96 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.conversationId}
                    onClick={() => {
                      setSelectedConversation(conversation.conversationId);
                      // Mark messages as read
                      conversation.messages.forEach(msg => {
                        if (!msg.isRead && msg.senderId !== (session as any)?.user?.id) {
                          markAsRead(msg.id);
                        }
                      });
                    }}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      conversation.type === 'notification' ? getMessageTypeColor(conversation.lastMessage.type) : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {conversation.otherUser.image ? (
                        <img
                          src={conversation.otherUser.image}
                          alt={conversation.otherUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ClickableName 
                            user={conversation.otherUser}
                            className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors"
                          />
                          {conversation.otherUser.role === 'ADMIN' && (
                            <span className="w-3 h-3 text-red-500 text-xs font-bold">A</span>
                          )}
                          {conversation.type === 'notification' && (
                            <span className="text-xs">
                              {getMessageTypeIcon(conversation.lastMessage.type)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.timestamp).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.otherUser.username && (
                        <p className="text-xs text-gray-500 truncate">
                          @{conversation.otherUser.username}
                        </p>
                      )}
                    </div>
                    
                    {conversation.unreadCount > 0 && (
                      <div className="flex-shrink-0">
                        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!selectedConversation && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <Link
                  href="/messages"
                  className="text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Alle berichten bekijken
                </Link>
                <button
                  onClick={() => {/* Archive all */}}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Archief
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
