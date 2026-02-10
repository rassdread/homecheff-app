'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, Package, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import OrdersTab from './OrdersTab';

type TabType = 'messages' | 'orders';

interface MessageNotification {
  id: string;
  conversationId: string;
  senderName: string;
  messagePreview: string;
  isRead: boolean;
  createdAt: string;
  link: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [messages, setMessages] = useState<MessageNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch unread counts
  const fetchUnreadCounts = async () => {
    try {
      // Fetch messages unread count
      const messagesResponse = await fetch('/api/messages/unread-count');
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setUnreadMessagesCount(messagesData.count || 0);
      }

      // Fetch orders unread count
      const ordersResponse = await fetch('/api/notifications/orders');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const unreadOrders = (ordersData.notifications || []).filter((n: any) => !n.isRead);
        setUnreadOrdersCount(unreadOrders.length);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  // Fetch messages for messages tab
  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Fetch both conversations and chat notifications
      const [conversationsResponse, notificationsResponse] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/notifications?limit=50')
      ]);

      const messageNotifications: MessageNotification[] = [];

      // 1. Add conversations
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        const conversationNotifications = (conversationsData.conversations || [])
          .map((conv: any) => {
            // Get other participant (not current user)
            const otherParticipant = conv.otherParticipant || 
                                    conv.participants?.[0] ||
                                    null;
            
            // Get display name based on displayNameOption
            let senderName = 'Onbekend';
            if (otherParticipant) {
              if (otherParticipant.displayNameOption === 'FULL_NAME' && otherParticipant.displayFullName) {
                senderName = otherParticipant.displayFullName;
              } else if (otherParticipant.name) {
                senderName = otherParticipant.name;
              } else if (otherParticipant.username) {
                senderName = otherParticipant.username;
              }
            }
            
            // Get last message
            const lastMessage = conv.lastMessage;
            
            // Check if message is read
            // Message is unread if: last message exists, is not from current user, and readAt is null
            const isRead = !lastMessage || 
                          lastMessage.readAt !== null ||
                          false; // We don't have currentUserId here, so assume read if readAt is set
            
            // Get message preview
            let messagePreview = 'Geen bericht';
            if (lastMessage?.text) {
              messagePreview = lastMessage.text.substring(0, 100);
            } else if (conv.title) {
              messagePreview = conv.title;
            }
            
            return {
              id: conv.id,
              conversationId: conv.id,
              senderName: senderName,
              messagePreview: messagePreview,
              isRead: isRead,
              createdAt: lastMessage?.createdAt || 
                       conv.lastMessageAt || 
                       conv.createdAt,
              link: `/messages?conversation=${conv.id}`
            };
          })
          .filter((msg: MessageNotification) => {
            // Show if: has a message preview OR is unread
            return msg.messagePreview !== 'Geen bericht' || !msg.isRead;
          });
        
        messageNotifications.push(...conversationNotifications);
      }

      // 2. Add chat notifications from Notification table
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        const chatNotifications = (notificationsData.notifications || [])
          .filter((notif: any) => {
            // Filter for MESSAGE_RECEIVED notifications
            return notif.type === 'MESSAGE_RECEIVED' || 
                   notif.type === 'message_received' ||
                   (notif.metadata?.conversationId && notif.type?.toLowerCase().includes('message'));
          })
          .map((notif: any) => {
            // Extract sender name from notification payload
            const payload = notif.payload || {};
            const title = notif.title || payload.title || 'Nieuw bericht';
            const senderName = title.replace('💬 Nieuw bericht van ', '').replace('Nieuw bericht van ', '') || 'Iemand';
            const messagePreview = notif.message || payload.body || payload.message || 'Je hebt een nieuw bericht ontvangen';
            
            return {
              id: notif.id,
              conversationId: notif.metadata?.conversationId || notif.link?.split('conversation=')[1]?.split('&')[0] || '',
              senderName: senderName,
              messagePreview: messagePreview.substring(0, 100),
              isRead: notif.isRead || false,
              createdAt: notif.createdAt,
              link: notif.link || `/messages?conversation=${notif.metadata?.conversationId || ''}`
            };
          });
        
        messageNotifications.push(...chatNotifications);
      }

      // Sort by date and remove duplicates (same conversationId)
      const uniqueMessages = Array.from(
        new Map(
          messageNotifications
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(msg => [msg.conversationId || msg.id, msg])
        ).values()
      ).slice(0, 10); // Show max 10 recent messages
      
      setMessages(uniqueMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when messages tab is active and dropdown is open
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'messages') {
        fetchMessages();
      }
      // OrdersTab fetches its own data when mounted
    }
  }, [isOpen, activeTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const totalUnread = unreadMessagesCount + unreadOrdersCount;

  const handleNotificationClick = (link: string) => {
    setIsOpen(false);
    router.push(link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notificaties"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificaties</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'messages'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Berichten
                {unreadMessagesCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'messages'
                      ? 'bg-white/20 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Package className="w-4 h-4" />
                Bestellingen
                {unreadOrdersCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'orders'
                      ? 'bg-white/20 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {unreadOrdersCount > 9 ? '9+' : unreadOrdersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[500px] overflow-y-auto">
            {activeTab === 'messages' ? (
              <MessagesTabContent 
                messages={messages} 
                loading={loading}
                onMessageClick={handleNotificationClick}
              />
            ) : (
              <OrdersTab />
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push(activeTab === 'messages' ? '/messages' : '/orders');
              }}
              className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium text-center"
            >
              Alle {activeTab === 'messages' ? 'berichten' : 'bestellingen'} bekijken →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface MessagesTabContentProps {
  messages: MessageNotification[];
  loading: boolean;
  onMessageClick: (link: string) => void;
}

function MessagesTabContent({ messages, loading, onMessageClick }: MessagesTabContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Geen berichten
        </h3>
        <p className="text-gray-500">
          Je hebt nog geen berichten ontvangen.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
            !message.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
          }`}
          onClick={() => onMessageClick(message.link)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${
                !message.isRead ? 'bg-blue-500' : 'bg-gray-300'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${
                  !message.isRead ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {message.senderName}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <p className={`text-sm mt-1 truncate ${
                !message.isRead ? 'text-gray-800' : 'text-gray-600'
              }`}>
                {message.messagePreview}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

