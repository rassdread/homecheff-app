'use client';

import { useState } from 'react';
import { Button } from './Button';

interface ShareButtonProps {
  url: string;
  title: string;
  description: string;
  type: 'seller' | 'buyer';
  productId?: string;
  productTitle?: string;
  className?: string;
}

export function ShareButton({ 
  url, 
  title, 
  description, 
  type, 
  productId, 
  productTitle,
  className = '' 
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const getDefaultMessage = () => {
    if (type === 'seller') {
      return `Bekijk mijn nieuwe creatie "${productTitle}" op HomeCheff! 🍽️✨`;
    } else {
      return `Kijk wat voor moois/lekker ik hier heb gezien! Check het op HomeCheff 🍽️✨`;
    }
  };

  const getShareMessage = () => {
    return customMessage || getDefaultMessage();
  };

  const shareToFacebook = () => {
    const message = getShareMessage();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToTwitter = () => {
    const message = getShareMessage();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareToWhatsApp = () => {
    const message = getShareMessage();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  const copyToClipboard = async () => {
    const message = getShareMessage();
    const fullText = `${message}\n\n${url}`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      alert('Gekopieerd naar klembord!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Gekopieerd naar klembord!');
    }
    setIsOpen(false);
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we copy to clipboard
    const message = getShareMessage();
    const fullText = `${message}\n\n${url}`;
    
    navigator.clipboard.writeText(fullText).then(() => {
      alert('Tekst gekopieerd! Plak het in je Instagram story of post.');
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
      >
        📤 Delen
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 p-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">
              {type === 'seller' ? 'Deel je creatie' : 'Deel dit product'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aangepast bericht (optioneel):
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={getDefaultMessage()}
                className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={shareToFacebook}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                📘 Facebook
              </Button>
              
              <Button
                onClick={shareToTwitter}
                className="bg-sky-500 hover:bg-sky-600 text-white text-sm"
              >
                🐦 Twitter
              </Button>
              
              <Button
                onClick={shareToWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                💬 WhatsApp
              </Button>
              
              <Button
                onClick={shareToInstagram}
                className="bg-pink-600 hover:bg-pink-700 text-white text-sm"
              >
                📷 Instagram
              </Button>
              
              <Button
                onClick={copyToClipboard}
                className="bg-gray-600 hover:bg-gray-700 text-white text-sm col-span-2"
              >
                📋 Kopieer link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
