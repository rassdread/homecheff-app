'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Instagram, Copy, Check, Mail, MessageCircle, Linkedin, MessageSquare } from 'lucide-react';
import { Button } from './Button';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export default function ShareButton({ url, title, description, className }: ShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addAffiliateToUrl, isAffiliate } = useAffiliateLink();

  // Get URL with affiliate code if user is affiliate
  const shareUrl = addAffiliateToUrl(url);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description || '');

    let socialShareUrl = '';

    switch (platform) {
      case 'facebook':
        socialShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        window.open(socialShareUrl, '_blank', 'width=600,height=400');
        break;
      case 'twitter':
        socialShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        window.open(socialShareUrl, '_blank', 'width=600,height=400');
        break;
      case 'whatsapp':
        socialShareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        window.open(socialShareUrl, '_blank');
        break;
      case 'email':
        socialShareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
        window.location.href = socialShareUrl;
        break;
      case 'linkedin':
        socialShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        window.open(socialShareUrl, '_blank', 'width=600,height=400');
        break;
      case 'telegram':
        socialShareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        window.open(socialShareUrl, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy the link
        handleCopyLink();
        return;
      default:
        return;
    }
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
        <>
          {/* Mobile: Full screen modal */}
          <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowShareMenu(false)} />
            <div className="relative bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-gray-900">Delen via</h3>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="p-4 pb-8">
                {/* Affiliate hint */}
                {isAffiliate && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs text-emerald-800 font-medium">
                      💡 Je affiliate link wordt automatisch meegestuurd bij delen
                    </p>
                  </div>
                )}
                
                {/* Link kopiëren */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center space-x-3 px-4 py-4 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors mb-3"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Gekopieerd!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Link kopiëren</span>
                    </>
                  )}
                </button>

                <div className="border-t border-gray-100 my-4"></div>

                {/* Social media opties - Mobile grid */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => { handleSocialShare('whatsapp'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-6 h-6 text-green-600" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => { handleSocialShare('email'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
                  >
                    <Mail className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-medium">E-mail</span>
                  </button>

                  <button
                    onClick={() => { handleSocialShare('facebook'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
                  >
                    <Facebook className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-medium">Facebook</span>
                  </button>

                  <button
                    onClick={() => { handleSocialShare('twitter'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-400 rounded-xl transition-colors"
                  >
                    <Twitter className="w-6 h-6 text-blue-400" />
                    <span className="text-xs font-medium">Twitter</span>
                  </button>

                  <button
                    onClick={() => { handleSocialShare('linkedin'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
                  >
                    <Linkedin className="w-6 h-6 text-blue-700" />
                    <span className="text-xs font-medium">LinkedIn</span>
                  </button>

                  <button
                    onClick={() => { handleSocialShare('telegram'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition-colors"
                  >
                    <MessageSquare className="w-6 h-6 text-blue-500" />
                    <span className="text-xs font-medium">Telegram</span>
                  </button>

                  <button
                    onClick={() => { handleSocialShare('instagram'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 rounded-xl transition-colors"
                  >
                    <Instagram className="w-6 h-6 text-pink-600" />
                    <span className="text-xs font-medium">Instagram</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Dropdown menu */}
          <div className="hidden md:block absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-3">
              <div className="text-sm font-semibold text-gray-800 mb-2 px-2">Delen via</div>
              
              {/* Affiliate hint */}
              {isAffiliate && (
                <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-800 font-medium">
                    💡 Je affiliate link wordt automatisch meegestuurd bij delen
                  </p>
                </div>
              )}
              
              {/* Link kopiëren */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors mb-1"
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

              <div className="border-t border-gray-100 my-2"></div>

              {/* Social media opties */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleSocialShare('whatsapp')}
                  className="flex flex-col items-center space-y-1 px-3 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="text-xs">WhatsApp</span>
                </button>

                <button
                  onClick={() => handleSocialShare('email')}
                  className="flex flex-col items-center space-y-1 px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
                >
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">E-mail</span>
                </button>

                <button
                  onClick={() => handleSocialShare('facebook')}
                  className="flex flex-col items-center space-y-1 px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Facebook</span>
                </button>

                <button
                  onClick={() => handleSocialShare('twitter')}
                  className="flex flex-col items-center space-y-1 px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-400 rounded-xl transition-colors"
                >
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <span className="text-xs">Twitter</span>
                </button>

                <button
                  onClick={() => handleSocialShare('linkedin')}
                  className="flex flex-col items-center space-y-1 px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors"
                >
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  <span className="text-xs">LinkedIn</span>
                </button>

                <button
                  onClick={() => handleSocialShare('telegram')}
                  className="flex flex-col items-center space-y-1 px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-500 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <span className="text-xs">Telegram</span>
                </button>

                <button
                  onClick={() => handleSocialShare('instagram')}
                  className="flex flex-col items-center space-y-1 px-3 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-700 rounded-xl transition-colors"
                >
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <span className="text-xs">Instagram</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Overlay to close menu when clicking outside - Desktop only (mobile has its own overlay) */}
      {showShareMenu && (
        <div
          className="hidden md:block fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}