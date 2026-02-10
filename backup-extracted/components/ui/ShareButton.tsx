'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Instagram, Copy, Check } from 'lucide-react';
import { Button } from './Button';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export default function ShareButton({ url, title, description, className }: ShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description || '');

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy the link
        handleCopyLink();
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
          transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
          bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white
          ${className}
        `}
      >
        <Share2 className="w-4 h-4" />
        <span>Delen</span>
      </button>

      {showShareMenu && (
        <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-3">
            <div className="text-sm font-semibold text-gray-800 mb-2 px-2">Delen via</div>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Gekopieerd!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Link kopiëren</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSocialShare('facebook')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook</span>
            </button>

            <button
              onClick={() => handleSocialShare('twitter')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
            >
              <Twitter className="w-4 h-4 text-blue-400" />
              <span>Twitter</span>
            </button>

            <button
              onClick={() => handleSocialShare('instagram')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 rounded-xl transition-colors"
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram (link gekopieerd)</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}