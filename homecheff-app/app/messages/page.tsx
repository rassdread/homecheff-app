'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Bell } from 'lucide-react';
import ConversationsList from '@/components/chat/ConversationsList';
import OptimizedChat from '@/components/chat/OptimizedChat';

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
  }>;
  otherParticipant?: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
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
  const [activeTab, setActiveTab] = useState<'conversations' | 'notifications'>('conversations');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const searchParams = useSearchParams();

  const handleSelectConversation = (conversation: Conversation) => {
    console.log('[MessagesPage] 🎯 Conversation selected:', {
      id: conversation.id,
      title: conversation.title,
      productTitle: conversation.product?.title,
      hasParticipants: !!conversation.participants && conversation.participants.length > 0,
      hasOtherParticipant: !!conversation.otherParticipant,
      participantCount: conversation.participants?.length || 0,
      otherParticipantName: conversation.otherParticipant?.name || conversation.participants?.[0]?.name
    });
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  // Handle URL conversation parameter
  useEffect(() => {
    if (!searchParams) return;
    
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      console.log('Opening conversation from URL:', conversationId);
      
      // Set active tab to conversations
      setActiveTab('conversations');
      
      // Fetch conversation details and set as selected
      fetch(`/api/conversations/${conversationId}`)
        .then(response => {
          console.log('Conversation fetch response:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('Conversation data received:', data);
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
      {/* Header */}
      <header className="w-full border-b bg-white flex-shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Berichten & Notificaties</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Je gesprekken en alle updates
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'conversations'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Gesprekken
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notificaties
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
            <div className={`
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
                <OptimizedChat
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
        ) : (
          /* Notifications Tab */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <Bell className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Notificaties</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Alle notificaties worden binnenkort hier getoond
              </p>
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