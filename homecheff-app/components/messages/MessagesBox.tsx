'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, MoreHorizontal, Phone, Mail, User, Badge } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
      });
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

  return (
    <div className={`relative ${className}`}>
      {/* Messages Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Berichten"
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Berichten</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount} nieuw
                </span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-hidden">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Berichten laden...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nog geen berichten</p>
                <p className="text-gray-400 text-xs mt-1">
                  Start een gesprek via een productpagina
                </p>
              </div>
            ) : selectedConversation && currentConversation ? (
              /* Conversation View */
              <div className="flex flex-col h-96">
                {/* Conversation Header */}
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
                          <span className="font-medium text-sm">{currentConversation.otherUser.name}</span>
                          {currentConversation.otherUser.role === 'ADMIN' && (
                            <Badge className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        {currentConversation.otherUser.username && (
                          <span className="text-xs text-gray-500">@{currentConversation.otherUser.username}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
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
                              : 'bg-gray-100 text-gray-900'
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

                {/* Message Input */}
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
              </div>
            ) : (
              /* Conversations List */
              <div className="max-h-96 overflow-y-auto">
                {conversations.map((conversation) => (
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
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
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
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.otherUser.name}
                          </h4>
                          {conversation.otherUser.role === 'ADMIN' && (
                            <span className="w-3 h-3 text-red-500 text-xs font-bold">A</span>
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
              <Link
                href="/messages"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Alle berichten bekijken
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}