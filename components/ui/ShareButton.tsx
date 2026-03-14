'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Instagram, Copy, Check, Mail, MessageCircle, Linkedin, MessageSquare } from 'lucide-react';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';
import { useTranslation } from '@/hooks/useTranslation';

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.921 2.961.921.477 0 2.105-.067 2.961-.92a.33.33 0 0 0 0-.464.327.327 0 0 0-.463 0c-.547.547-1.684.73-2.512.73-.828 0-1.979-.183-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export default function ShareButton({ url, title, description, className }: ShareButtonProps) {
  const { t } = useTranslation();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addAffiliateToUrl, isAffiliate } = useAffiliateLink();

  // Beleid: bij delen van profielen of items altijd de affiliate link meesturen (ref-parameter).
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
      case 'pinterest':
        socialShareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`;
        window.open(socialShareUrl, '_blank', 'width=750,height=500');
        break;
      case 'reddit':
        socialShareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        window.open(socialShareUrl, '_blank', 'width=750,height=500');
        break;
      case 'instagram':
      case 'tiktok':
        // Geen directe share-URL; link kopiëren zodat gebruiker in de app kan plakken
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
        type="button"
        aria-label={t('share.via')}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200
          transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg
          bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700/30
          ${className ?? ''}
        `}
      >
        <Share2 className="w-5 h-5 shrink-0" aria-hidden />
        <span>{t('share.button')}</span>
      </button>

      {showShareMenu && (
        <>
          {/* Mobile: Full screen modal */}
          <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowShareMenu(false)} />
            <div className="relative bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-gray-900">{t('share.via')}</h3>
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
                    <p className="text-xs text-emerald-800 font-medium">💡 {t('share.affiliateHint')}</p>
                  </div>
                )}

                {/* Link kopiëren */}
                <button
                  onClick={handleCopyLink}
                  type="button"
                  className="w-full flex items-center space-x-3 px-4 py-4 text-base text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors mb-3"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                      <span className="font-medium">{t('share.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 shrink-0" />
                      <span>{t('share.copyLink')}</span>
                    </>
                  )}
                </button>

                <div className="border-t border-gray-100 my-4" />

                {/* Social media opties - Mobile grid */}
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Socials</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('whatsapp'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors border border-transparent hover:border-green-200"
                  >
                    <MessageCircle className="w-7 h-7 text-green-600" aria-hidden />
                    <span className="text-xs font-medium">{t('share.whatsapp')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('instagram'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-xl transition-colors border border-transparent hover:border-pink-200"
                  >
                    <Instagram className="w-7 h-7 text-pink-600" aria-hidden />
                    <span className="text-xs font-medium">{t('share.instagram')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('tiktok'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                  >
                    <TikTokIcon className="w-7 h-7 text-gray-900" />
                    <span className="text-xs font-medium">{t('share.tiktok')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('facebook'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                  >
                    <Facebook className="w-7 h-7 text-[#1877F2]" aria-hidden />
                    <span className="text-xs font-medium">{t('share.facebook')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('linkedin'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0A66C2] rounded-xl transition-colors border border-transparent hover:border-blue-200"
                  >
                    <Linkedin className="w-7 h-7 text-[#0A66C2]" aria-hidden />
                    <span className="text-xs font-medium">{t('share.linkedin')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('email'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors border border-transparent hover:border-blue-200"
                  >
                    <Mail className="w-7 h-7 text-blue-600" aria-hidden />
                    <span className="text-xs font-medium">{t('share.email')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('twitter'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                  >
                    <Twitter className="w-7 h-7 text-gray-800" aria-hidden />
                    <span className="text-xs font-medium">{t('share.twitter')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('telegram'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-sky-50 hover:text-[#0088cc] rounded-xl transition-colors border border-transparent hover:border-sky-200"
                  >
                    <MessageSquare className="w-7 h-7 text-[#0088cc]" aria-hidden />
                    <span className="text-xs font-medium">{t('share.telegram')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('pinterest'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-red-50 hover:text-[#BD081C] rounded-xl transition-colors border border-transparent hover:border-red-200"
                  >
                    <PinterestIcon className="w-7 h-7" />
                    <span className="text-xs font-medium">{t('share.pinterest')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleSocialShare('reddit'); setShowShareMenu(false); }}
                    className="flex flex-col items-center space-y-2 px-4 py-4 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF4500] rounded-xl transition-colors border border-transparent hover:border-orange-200"
                  >
                    <RedditIcon className="w-7 h-7" />
                    <span className="text-xs font-medium">{t('share.reddit')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Dropdown menu */}
          <div className="hidden md:block absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-3">
              <div className="text-sm font-semibold text-gray-800 mb-2 px-2">{t('share.via')}</div>

              {isAffiliate && (
                <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-800 font-medium">💡 {t('share.affiliateHint')}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors mb-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="font-medium">{t('share.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" />
                    <span>{t('share.copyLink')}</span>
                  </>
                )}
              </button>

              <div className="border-t border-gray-100 my-2" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">Socials</p>

              <div className="grid grid-cols-3 gap-1">
                <button type="button" onClick={() => handleSocialShare('whatsapp')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-xl transition-colors" title={t('share.whatsapp')}>
                  <MessageCircle className="w-5 h-5 text-green-600" aria-hidden />
                  <span className="text-xs truncate w-full text-center">{t('share.whatsapp')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('instagram')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-xl transition-colors" title={t('share.instagram')}>
                  <Instagram className="w-5 h-5 text-pink-600" aria-hidden />
                  <span className="text-xs truncate w-full text-center">{t('share.instagram')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('tiktok')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors" title={t('share.tiktok')}>
                  <TikTokIcon className="w-5 h-5 text-gray-900" />
                  <span className="text-xs truncate w-full text-center">{t('share.tiktok')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('facebook')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1877F2] rounded-xl transition-colors" title={t('share.facebook')}>
                  <Facebook className="w-5 h-5 text-[#1877F2]" aria-hidden />
                  <span className="text-xs truncate w-full text-center">{t('share.facebook')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('linkedin')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0A66C2] rounded-xl transition-colors" title={t('share.linkedin')}>
                  <Linkedin className="w-5 h-5 text-[#0A66C2]" aria-hidden />
                  <span className="text-xs truncate w-full text-center">{t('share.linkedin')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('email')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors" title={t('share.email')}>
                  <Mail className="w-5 h-5 text-blue-600" aria-hidden />
                  <span className="text-xs truncate w-full text-center">{t('share.email')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('twitter')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors" title={t('share.twitter')}>
                  <Twitter className="w-5 h-5 text-gray-800" aria-hidden />
                  <span className="text-xs truncate w-full text-center">{t('share.twitter')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('telegram')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-sky-50 hover:text-[#0088cc] rounded-xl transition-colors" title={t('share.telegram')}>
                  <MessageSquare className="w-5 h-5 text-[#0088cc]" aria-hidden />
                  <span className="text-xs truncate w-full text-center">{t('share.telegram')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('pinterest')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-[#BD081C] rounded-xl transition-colors" title={t('share.pinterest')}>
                  <PinterestIcon className="w-5 h-5 text-[#BD081C]" />
                  <span className="text-xs truncate w-full text-center">{t('share.pinterest')}</span>
                </button>
                <button type="button" onClick={() => handleSocialShare('reddit')} className="flex flex-col items-center space-y-1 px-2 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF4500] rounded-xl transition-colors" title={t('share.reddit')}>
                  <RedditIcon className="w-5 h-5 text-[#FF4500]" />
                  <span className="text-xs truncate w-full text-center">{t('share.reddit')}</span>
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