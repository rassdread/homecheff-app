'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages';

interface RealTimeChatProps {
  conversationId: string;
  otherParticipant: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
  };
  product?: {
    id: string;
    title: string;
    priceCents: number;
    Image: Array<{
      fileUrl: string;
      sortOrder: number;
    }>;
  };
  onBack?: () => void;
}

export default function RealTimeChat({ conversationId, otherParticipant, product, onBack }: RealTimeChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const {
    messages,
    isLoading,
    isSending,
    connectionStatus,
    sendMessage,
    refreshMessages,
  } = useRealTimeMessages({ conversationId, currentUserId });

  // Get current user ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.id) {
            setCurrentUserId(data.user.id);
          }
        }
      } catch (error) {
        console.error('Error fetching current user ID:', error);
      }
    };
    
    fetchCurrentUserId();
  }, [session?.user?.email]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const success = await sendMessage(messageText);
    
    if (!success) {
      alert('Fout bij verzenden van bericht. Probeer het opnieuw.');
      setNewMessage(messageText); // Restore message text
    }
  };

  const handleDeleteConversation = async () => {
    if (!confirm('Weet je zeker dat je dit gesprek wilt wissen? Deze actie kan niet ongedaan worden gemaakt.')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/delete`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Gesprek succesvol gewist');
        // Redirect back to messages list
        window.location.href = '/messages';
      } else {
        throw new Error('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Fout bij wissen van gesprek. Probeer het opnieuw.');
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢 Live';
      case 'connecting': return '🟡 Verbinden...';
      case 'disconnected': return '🔴 Offline';
      default: return '⚪ Onbekend';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Berichten laden...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          {otherParticipant.profileImage ? (
            <img
              src={otherParticipant.profileImage}
              alt={otherParticipant.name || otherParticipant.username || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-lg">
                {(otherParticipant.name || otherParticipant.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900">
              {otherParticipant.name || otherParticipant.username || 'Onbekend'}
            </h2>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
              <span className="text-sm text-gray-500">
                {messages.length} berichten
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Manual refresh button */}
          <button
            onClick={refreshMessages}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            title="Herlaad berichten"
          >
            🔄
          </button>
          
          {/* Delete conversation button */}
          <button
            onClick={handleDeleteConversation}
            className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
            title="Gesprek wissen"
          >
            🗑️
          </button>
          
          {/* Connection status indicator */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
            {connectionStatus === 'connected' ? 'Real-time' : 'Polling'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl font-medium mb-2">Nog geen berichten</p>
              <p className="text-sm">Start het gesprek door een bericht te typen!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                  message.senderId === currentUserId
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.senderId === currentUserId ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {message.senderId === currentUserId && (
                    <span className="ml-1">✓</span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4 bg-white shadow-lg">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type je bericht..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isSending || !currentUserId}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending || !currentUserId}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isSending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verzenden...</span>
              </div>
            ) : (
              'Verstuur'
            )}
          </button>
        </div>
        
        {/* Status Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>
              {currentUserId ? '🟢 Verbonden' : '🔴 Verbinding...'}
            </span>
            <span>
              {connectionStatus === 'connected' ? 'Real-time messaging actief' : 'Polling elke 2 seconden'}
            </span>
          </div>
          <span>
            Berichten worden automatisch gesynchroniseerd
          </span>
        </div>
      </div>
    </div>
  );
}
