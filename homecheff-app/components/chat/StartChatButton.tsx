'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface StartChatButtonProps {
  productId?: string; // Optional for general seller contact
  sellerId: string;
  sellerName: string;
  onConversationStarted?: (conversationId: string) => void;
  className?: string;
}

export default function StartChatButton({ 
  productId, 
  sellerId, 
  sellerName, 
  onConversationStarted,
  className = ''
}: StartChatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const { data: session } = useSession();

  const handleStartChat = async () => {
    if (!session?.user) {
      // Redirect to login
      window.location.href = '/api/auth/signin';
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/conversations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          initialMessage: initialMessage.trim() || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const { conversation } = await response.json();
      
      if (onConversationStarted) {
        onConversationStarted(conversation.id);
      } else {
        // Redirect to messages page
        window.location.href = `/messages/${conversation.id}`;
      }

      setShowModal(false);
      setInitialMessage('');
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Fout bij starten van gesprek. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickMessage = (message: string) => {
    setInitialMessage(message);
    handleStartChat();
  };

  const quickMessages = [
    'Hoi! Is dit product nog beschikbaar?',
    'Kun je meer foto\'s sturen?',
    'Wat zijn de bezorgmogelijkheden?',
    'Is onderhandeling mogelijk?',
    'Hoi! Ik heb interesse in dit product.'
  ];

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        <span>{isLoading ? 'Laden...' : 'Stuur bericht'}</span>
      </button>

      {/* Chat Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Bericht sturen naar {sellerName}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Start een gesprek over dit product. Je kunt een eerste bericht sturen of later beginnen.
              </p>

              {/* Quick messages */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Snelle berichten:</h3>
                <div className="space-y-2">
                  {quickMessages.map((message, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickMessage(message)}
                      disabled={isLoading}
                      className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border disabled:opacity-50"
                    >
                      {message}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Of typ je eigen bericht:
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Typ je bericht hier..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleStartChat}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Laden...' : 'Verstuur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
