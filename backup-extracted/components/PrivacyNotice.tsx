'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Database, AlertCircle } from 'lucide-react';

const PrivacyNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    // Check if user has already accepted privacy notice
    const accepted = localStorage.getItem('privacy-notice-accepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacy-notice-accepted', 'true');
    setIsVisible(false);
    setHasAccepted(true);
  };

  const handleDecline = () => {
    // Redirect to privacy policy or show more info
    window.location.href = '/privacy';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Jouw Privacy is Belangrijk
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-green-600" />
                <span>Alle data wordt veilig versleuteld opgeslagen</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Jouw gegevens worden nooit gedeeld met derden</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span>Je hebt volledige controle over je data</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              We gebruiken alleen essentiële cookies voor de werking van de app. 
              Geen tracking of advertenties.
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Accepteren
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Meer Info
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Door te accepteren ga je akkoord met ons{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacybeleid
          </a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyNotice;
