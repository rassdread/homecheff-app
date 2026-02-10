'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Bell, Package } from 'lucide-react';
import ConversationsList from '@/components/chat/ConversationsList';
import ChatBox from '@/components/chat/ChatBox';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import TourTrigger from '@/components/onboarding/TourTrigger';
import InfoIcon from '@/components/onboarding/InfoIcon';
import { getHintsForPage } from '@/lib/onboarding/hints';
import OrdersTab from '@/components/notifications/OrdersTab';

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
  participants: Array<{
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  }>;
  otherParticipant?: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
  lastMessage?: {
    id: string;
    text: string | null;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_SHARE' | 'SYSTEM';
    createdAt: string;
    readAt?: string | null;
    User: {
      id: string;
      name: string | null;
      username: string | null;
      profileImage: string | null;
      displayFullName?: boolean | null;
      displayNameOption?: string | null;
    };
  } | null;
  lastMessageAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'message' | 'prop' | 'fan' | 'follow' | 'order' | 'review' | 'favorite';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  from?: {
    id: string;
    name: string;
    username?: string;
    image?: string;
  };
  metadata?: {
    productId?: string;
    orderId?: string;
    conversationId?: string;
  };
}

function MessagesPageContent() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<'conversations' | 'notifications' | 'orders'>('conversations');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const searchParams = useSearchParams();
  
  // Load hints for this page
  const pageHints = getHintsForPage('messages');

  const handleSelectConversation = (conversation: Conversation) => {

    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  // Load notifications when tab changes to notifications
  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Load unread orders count
  const loadUnreadOrdersCount = async () => {
    try {
      const response = await fetch('/api/notifications/orders');
      if (response.ok) {
        const data = await response.json();
        const unreadOrders = (data.notifications || []).filter((n: any) => !n.isRead);
        setUnreadOrdersCount(unreadOrders.length);
      }
    } catch (error) {
      console.error('Error loading unread orders count:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: 'conversations' | 'notifications' | 'orders') => {
    setActiveTab(tab);
    if (tab === 'notifications') {
      loadNotifications();
    }
  };

  // Load unread orders count on mount and periodically
  useEffect(() => {
    loadUnreadOrdersCount();
    const interval = setInterval(loadUnreadOrdersCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle URL conversation parameter
  useEffect(() => {
    if (!searchParams) return;
    
    const conversationId = searchParams.get('conversation');
    if (conversationId) {

      // Set active tab to conversations
      setActiveTab('conversations');
      
      // Fetch conversation details and set as selected
      fetch(`/api/conversations/${conversationId}`)
        .then(response => {

          return response.json();
        })
        .then(data => {

          if (data.conversation) {
            setSelectedConversation(data.conversation);
            // Dispatch event to notify chat window
            window.dispatchEvent(new CustomEvent('conversationUpdated', {
              detail: { conversationId: conversationId }
            }));
          }
        })
        .catch(error => {
          console.error('Error fetching conversation:', error);
        });
    }
  }, [searchParams]);

  return (
    <main className="h-screen bg-gray-50 flex flex-col">
      {/* Onboarding Tour */}
      <OnboardingTour pageId="messages" autoStart={false} />
      
      {/* Header */}
      <header className="w-full border-b bg-white flex-shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Berichten & Notificaties</h1>
                <TourTrigger pageId="messages" variant="button" />
              </div>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Je gesprekken en alle updates
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => handleTabChange('conversations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'conversations'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Gesprekken
                {pageHints?.hints.conversations && (
                  <InfoIcon hint={pageHints.hints.conversations} pageId="messages" size="sm" />
                )}
              </button>
              <button
                onClick={() => handleTabChange('notifications')}
                data-tour="notifications-tab"
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notificaties
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('orders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                Bestellingen
                {unreadOrdersCount > 0 && (
                  <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {unreadOrdersCount > 99 ? '99+' : unreadOrdersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content - WhatsApp-like layout */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'conversations' ? (
          <>
            {/* Conversations List - Left Side */}
            <div 
              data-tour="conversations-list"
              className={`
              ${selectedConversation ? 'hidden lg:flex lg:w-96' : 'w-full'} 
              border-r border-gray-200 bg-white flex-col transition-all duration-300
            `}>
              <div className="flex-1 overflow-hidden">
                <ConversationsList onSelectConversation={handleSelectConversation} />
              </div>
            </div>
            
            {/* Chat Window - Right Side */}
            {selectedConversation && (
              <div className={`
                ${selectedConversation ? 'w-full' : 'hidden'} 
                flex flex-col bg-white
              `}>
                <ChatBox
                  conversationId={selectedConversation.id}
                  otherParticipant={
                    selectedConversation.otherParticipant || 
                    (selectedConversation.participants && selectedConversation.participants[0]) ||
                    { id: '', name: 'Gebruiker', username: null, profileImage: null }
                  }
                  onBack={handleBackToList}
                />
              </div>
            )}
            
            {/* Welcome Message when no conversation selected (Desktop only) */}
            {!selectedConversation && (
              <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                  <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Selecteer een gesprek</h3>
                  <p className="text-gray-500 max-w-md">
                    Klik op een gesprek aan de linkerkant om te beginnen met chatten
                  </p>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'notifications' ? (
          /* Notifications Tab */
          <div className="flex-1 flex flex-col bg-white">
            {/* Notifications Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notificaties ({notifications.length})
                </h2>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        await fetch('/api/notifications', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ markAllAsRead: true })
                        });
                        loadNotifications();
                      } catch (error) {
                        console.error('Error marking all as read:', error);
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Alles als gelezen markeren
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notificationsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Geen notificaties</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={async () => {
                        // Mark as read if not already read
                        if (!notification.isRead) {
                          try {
                            await fetch('/api/notifications', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ notificationIds: [notification.id] })
                            });
                            loadNotifications();
                          } catch (error) {
                            console.error('Error marking notification as read:', error);
                          }
                        }
                        
                        // Navigate to link if available
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${
                            !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <p className={`text-sm mt-1 ${
                            !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.from && (
                            <p className="text-xs text-gray-500 mt-1">
                              Van: {notification.from.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Orders Tab */
          <div className="flex-1 flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Bestellingen
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <OrdersTab />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}