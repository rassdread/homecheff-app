'use client';

import React, { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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
  modalType?: string; // For analytics tracking
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
  ctaText = "Meld je nu aan",
  ctaLink = "/register",
  modalType = "unknown"
}: PromoModalProps) {
  const { data: session } = useSession();

  // Track modal view for non-logged users
  useEffect(() => {
    if (isOpen && !session?.user) {
      trackPromoEvent('PROMO_MODAL_VIEW', modalType);
    }
  }, [isOpen, session, modalType]);

  // Analytics tracking function
  const trackPromoEvent = async (eventType: string, promoType: string, additionalData?: any) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          entityType: 'PROMO_MODAL',
          entityId: promoType,
          userId: null, // Always null for non-logged users
          metadata: {
            modalType: promoType,
            title,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...additionalData
          }
        })
      });
    } catch (error) {
      console.error('Failed to track promo event:', error);
    }
  };

  const handleClose = () => {
    trackPromoEvent('PROMO_MODAL_CLOSE', modalType);
    onClose();
  };

  const handleCtaClick = () => {
    trackPromoEvent('PROMO_MODAL_CTA', modalType, { ctaText, ctaLink });
  };

  const handleLoginClick = () => {
    trackPromoEvent('PROMO_MODAL_LOGIN', modalType);
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
              href={ctaLink}
              onClick={handleCtaClick}
              className={`${gradient} text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all w-full`}
            >
              {ctaText}
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="/auth/signin"
              onClick={handleLoginClick}
              className="border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all w-full"
            >
              Al een account? Inloggen
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span>🔒</span>
                <span>Veilig</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>Snel</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🆓</span>
                <span>Gratis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
