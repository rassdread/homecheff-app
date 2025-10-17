'use client';

import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface StartChatButtonProps {
  productId?: string; // Optional for general seller contact
  sellerId: string;
  sellerName: string;
  onConversationStarted?: (conversationId: string) => void;
  onMessageSent?: (conversationId: string) => void; // New callback for when message is sent
  className?: string;
  showSuccessMessage?: boolean; // Whether to show success message instead of redirect
}

export default function StartChatButton({ 
  productId, 
  sellerId, 
  sellerName, 
  onConversationStarted,
  onMessageSent,
  className = '',
  showSuccessMessage = false
}: StartChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: session } = useSession();

  const handleStartChat = async () => {
    if (!session?.user) {
      // Redirect to login
      window.location.href = '/api/auth/signin';
      return;
    }

    setIsLoading(true);

    try {
      // Use different endpoint based on whether we have a productId or sellerId
      const endpoint = productId ? '/api/conversations/start' : '/api/conversations/start-seller';
      const requestBody = productId 
        ? { productId, initialMessage: initialMessage.trim() || null }
        : { sellerId, initialMessage: initialMessage.trim() || null };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const { conversation } = await response.json();
      
      // Call callback if provided
      if (onConversationStarted) {
        onConversationStarted(conversation.id);
      }
      
      if (onMessageSent) {
        onMessageSent(conversation.id);
      }

      // Show success message or redirect based on props
      if (showSuccessMessage) {
        setShowSuccess(true);
        setShowModal(false);
        setInitialMessage('');
        
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        // Default behavior: redirect to messages page
        window.location.href = `/messages?conversation=${conversation.id}`;
        
        // Dispatch event to notify chat window that conversation was updated
        window.dispatchEvent(new CustomEvent('conversationUpdated', {
          detail: { conversationId: conversation.id }
        }));

        setShowModal(false);
        setInitialMessage('');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(`Fout bij starten van gesprek: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMessage = async (message: string) => {
    if (!session?.user) {
      window.location.href = '/api/auth/signin';
      return;
    }

    setIsLoading(true);
    setInitialMessage(message);

    try {
      const endpoint = productId ? '/api/conversations/start' : '/api/conversations/start-seller';
      const requestBody = productId 
        ? { productId, initialMessage: message }
        : { sellerId, initialMessage: message };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const { conversation } = await response.json();
      
      // Call callback if provided
      if (onConversationStarted) {
        onConversationStarted(conversation.id);
      }
      
      if (onMessageSent) {
        onMessageSent(conversation.id);
      }

      // Show success message or redirect based on props
      if (showSuccessMessage) {
        setShowSuccess(true);
        setShowModal(false);
        setInitialMessage('');
        
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        // Default behavior: redirect to messages page
        window.location.href = `/messages?conversation=${conversation.id}`;
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(`Fout bij starten van gesprek: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const quickMessages = productId ? [
    'Hoi! Is dit product nog beschikbaar?',
    'Kun je meer foto\'s sturen?',
    'Wat zijn de bezorgmogelijkheden?',
    'Is onderhandeling mogelijk?',
    'Hoi! Ik heb interesse in dit product.'
  ] : [
    'Hoi! Ik heb interesse in je producten.',
    'Kun je meer informatie geven over je werk?',
    'Wat zijn je bezorgmogelijkheden?',
    'Heb je nog andere producten beschikbaar?',
    'Hoi! Ik zou graag meer willen weten over je creaties.'
  ];

  // Show login prompt for non-logged in users
  if (!session?.user) {
    return (
      <button
        onClick={() => window.location.href = '/api/auth/signin'}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
          transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white
          ${className}
        `}
      >
        <MessageCircle className="w-4 h-4" />
        <span>Inloggen om te chatten</span>
      </button>
    );
  }

  return (
    <>
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-500 text-sm">✓</span>
          </div>
          <span>Bericht verzonden! Je kunt het gesprek bekijken in je berichten.</span>
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`
          flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200
          transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          w-full sm:w-auto text-sm sm:text-base
          ${className}
        `}
      >
        <MessageCircle className="w-4 h-4" />
        <span>{isLoading ? 'Laden...' : 'Start chat'}</span>
      </button>

      {/* Chat Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Start chat met {sellerName}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                💬 {productId 
                  ? 'Kies een snelbericht en het wordt direct verzonden, of typ je eigen bericht onderaan.'
                  : 'Kies een snelbericht of typ je eigen bericht om het gesprek te starten.'
                }
              </p>

              {/* Quick messages */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  ⚡ Snelle berichten
                  <span className="text-xs text-gray-500 font-normal">(klik = direct verzenden)</span>
                </h3>
                <div className="space-y-2">
                  {quickMessages.map((message, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickMessage(message)}
                      disabled={isLoading}
                      className="group w-full text-left p-3 text-sm bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-blue-100 rounded-xl border-2 border-gray-200 hover:border-blue-400 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1 text-gray-700 group-hover:text-blue-700">
                          {message}
                        </span>
                        <Send className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gray-300"></div>
                  <span className="text-xs text-gray-500 font-medium">OF</span>
                  <div className="h-px flex-1 bg-gray-300"></div>
                </div>
              </div>

              {/* Custom message with send button */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  ✏️ Typ je eigen bericht:
                </label>
                <div className="space-y-3">
                  <textarea
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Typ je bericht hier..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 text-sm"
                    rows={4}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleStartChat}
                    disabled={isLoading || !initialMessage.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-95 disabled:transform-none shadow-md hover:shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isLoading ? 'Verzenden...' : 'Verstuur bericht'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setInitialMessage('');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
              >
                <X className="w-4 h-4" />
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
