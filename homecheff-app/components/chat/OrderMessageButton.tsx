'use client';

import { useState } from 'react';
import { Package, MessageCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface OrderMessageButtonProps {
  orderId: string;
  orderNumber?: string;
  className?: string;
}

export default function OrderMessageButton({ 
  orderId, 
  orderNumber,
  className = ''
}: OrderMessageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const { data: session } = useSession();

  const handleStartChat = async () => {
    if (!session?.user) {
      window.location.href = '/api/auth/signin';
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/conversations/start-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          initialMessage: initialMessage.trim() || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const { conversation } = await response.json();
      
      // Redirect to conversation
      window.location.href = `/messages/${conversation.id}`;

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
    'Wanneer wordt mijn bestelling verzonden?',
    'Kan ik de bestelling nog wijzigen?',
    'Waar kan ik mijn bestelling volgen?',
    'Ik heb een vraag over mijn bestelling.',
    'Bedankt voor de snelle levering!'
  ];

  const displayOrderNumber = orderNumber || `#${orderId.slice(-6)}`;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
          transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl
          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${className}
        `}
      >
        <MessageCircle className="w-4 h-4" />
        <span>{isLoading ? 'Laden...' : `Bericht over ${displayOrderNumber}`}</span>
      </button>

      {/* Chat Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6 text-blue-500" />
                  <div>
                    <h2 className="text-lg font-semibold">Bericht over bestelling</h2>
                    <p className="text-sm text-gray-500">{displayOrderNumber}</p>
                  </div>
                </div>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Je berichten worden automatisch gelabeld met {displayOrderNumber} zodat de verkoper direct weet over welke bestelling je schrijft.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Stel je vraag over deze bestelling. De verkoper kan je direct helpen!
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
                      className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl border border-gray-200 hover:border-blue-300 disabled:opacity-50 transition-all duration-200 font-medium"
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
                  placeholder="Typ je vraag hier..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 font-medium"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleStartChat}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none"
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



