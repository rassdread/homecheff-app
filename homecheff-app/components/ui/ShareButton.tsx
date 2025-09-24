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
      <Button
        onClick={() => setShowShareMenu(!showShareMenu)}
        variant="outline"
        className={`flex items-center space-x-2 ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span>Delen</span>
      </Button>

      {showShareMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-2">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Gekopieerd!</span>
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
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook</span>
            </button>

            <button
              onClick={() => handleSocialShare('twitter')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              <Twitter className="w-4 h-4 text-blue-400" />
              <span>Twitter</span>
            </button>

            <button
              onClick={() => handleSocialShare('instagram')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
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