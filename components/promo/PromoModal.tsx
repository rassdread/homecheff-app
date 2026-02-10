'use client';

import React, { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePathname, useSearchParams } from 'next/navigation';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  features: string[];
  ctaText?: string;
  ctaLink?: string;
  modalType?: string;
}

export default function PromoModal({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  icon,
  gradient,
  features,
  ctaText,
  ctaLink = "/register",
  modalType = "unknown"
}: PromoModalProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultCtaText = ctaText || t('common.signUpNow');
  
  // Build callback URL for login - return to current page after login
  const currentUrl = typeof window !== 'undefined' 
    ? `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`
    : '/inspiratie';
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
  
  // Build register URL with returnUrl parameter to return to current page after registration
  const registerUrl = ctaLink === "/register" 
    ? `/register?returnUrl=${encodeURIComponent(currentUrl)}`
    : ctaLink;

  // Track modal view for non-logged users
  useEffect(() => {
    if (isOpen && !session?.user) {
      // Analytics tracking - silently fail if endpoint doesn't exist
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'PROMO_MODAL_VIEW',
          entityType: 'PROMO_MODAL',
          entityId: modalType,
          userId: null,
          metadata: {
            modalType: modalType,
            title,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        })
      }).catch(() => {
        // Silently fail if analytics endpoint doesn't exist
      });
    }
  }, [isOpen, session, modalType, title]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${gradient} p-6 text-white relative`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="text-4xl mb-3">{icon}</div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-white/90 text-sm">{subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6 leading-relaxed">{description}</p>
          
          {/* Features */}
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link
              href={registerUrl}
              className={`${gradient} text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all w-full`}
            >
              {defaultCtaText}
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href={loginUrl}
              className="border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all w-full"
            >
              {t('login.title')}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span>🔒</span>
                <span>{t('common.secure')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>{t('common.fast')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🆓</span>
                <span>{t('common.free')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}










