'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set' | 'js',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const GA_MEASUREMENT_ID = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    if (!GA_MEASUREMENT_ID) {
      console.warn('Google Analytics: Measurement ID not found');
      return;
    }

    // Initialize dataLayer
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname,
        send_page_view: false, // We handle page views manually
        anonymize_ip: true, // GDPR compliance
        allow_google_signals: false, // Privacy-first
        allow_ad_personalization_signals: false, // No ad personalization
      });
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    script.defer = true;
    
    // Only load in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_GA_ENABLED === 'true') {
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup is handled automatically by script removal
    };
  }, [measurementId]);

  // Track page views on route change
  useEffect(() => {
    const GA_MEASUREMENT_ID = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
      return;
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    const hostname = window.location.hostname;
    const isNL = hostname.includes('homecheff.nl');
    const isEU = hostname.includes('homecheff.eu');
    const language = isEU ? 'en' : (isNL ? 'nl' : 'nl'); // Default to NL
    
    window.gtag('event', 'page_view', {
      page_path: url,
      page_title: document.title,
      page_location: window.location.href,
      page_hostname: hostname,
      language: language,
      domain: isNL ? 'nl' : (isEU ? 'eu' : 'unknown'),
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}

// Helper function to track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, {
    ...parameters,
    timestamp: new Date().toISOString(),
  });
};

// Track user type/role
export const trackUserType = (userData: {
  role?: string;
  buyerRoles?: string[];
  sellerRoles?: string[];
  interests?: string[];
  gender?: string;
  hasDelivery?: boolean;
  isBusiness?: boolean;
}) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  // Set user properties
  const userProperties: Record<string, any> = {};

  if (userData.role) {
    userProperties.user_role = userData.role;
  }

  if (userData.buyerRoles && userData.buyerRoles.length > 0) {
    userProperties.buyer_types = userData.buyerRoles.join(',');
    userProperties.buyer_type_count = userData.buyerRoles.length;
  }

  if (userData.sellerRoles && userData.sellerRoles.length > 0) {
    userProperties.seller_types = userData.sellerRoles.join(',');
    userProperties.seller_type_count = userData.sellerRoles.length;
  }

  if (userData.interests && userData.interests.length > 0) {
    userProperties.interests = userData.interests.join(',');
    userProperties.interest_count = userData.interests.length;
  }

  if (userData.gender) {
    userProperties.gender = userData.gender;
  }

  if (userData.hasDelivery !== undefined) {
    userProperties.has_delivery_role = userData.hasDelivery;
  }

  if (userData.isBusiness !== undefined) {
    userProperties.is_business = userData.isBusiness;
  }

  // Determine user segment
  const segments: string[] = [];
  if (userData.role === 'BUYER' || userData.buyerRoles?.length) {
    segments.push('buyer');
  }
  if (userData.role === 'SELLER' || userData.sellerRoles?.length) {
    segments.push('seller');
  }
  if (userData.role === 'DELIVERY' || userData.hasDelivery) {
    segments.push('deliverer');
  }
  if (userData.isBusiness) {
    segments.push('business');
  }

  if (segments.length > 0) {
    userProperties.user_segments = segments.join(',');
    userProperties.user_segment_count = segments.length;
  }

  // Set user properties in GA4
  window.gtag('set', 'user_properties', userProperties);

  // Track user type identification event
  trackEvent('identify_user_type', {
    ...userProperties,
  });
};

// Track e-commerce events
export const trackPurchase = (transactionData: {
  transactionId: string;
  value: number;
  currency?: string;
  items: Array<{
    itemId: string;
    itemName: string;
    category?: string;
    price: number;
    quantity: number;
  }>;
}) => {
  trackEvent('purchase', {
    transaction_id: transactionData.transactionId,
    value: transactionData.value,
    currency: transactionData.currency || 'EUR',
    items: transactionData.items.map(item => ({
      item_id: item.itemId,
      item_name: item.itemName,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};

// Track product views
export const trackProductView = (productData: {
  productId: string;
  productName: string;
  category?: string;
  price?: number;
  userId?: string;
}) => {
  trackEvent('view_item', {
    currency: 'EUR',
    value: productData.price,
    items: [{
      item_id: productData.productId,
      item_name: productData.productName,
      item_category: productData.category,
      price: productData.price,
      quantity: 1,
    }],
    user_id: productData.userId,
  });
};

// Track add to cart
export const trackAddToCart = (productData: {
  productId: string;
  productName: string;
  category?: string;
  price?: number;
  quantity?: number;
}) => {
  trackEvent('add_to_cart', {
    currency: 'EUR',
    value: (productData.price || 0) * (productData.quantity || 1),
    items: [{
      item_id: productData.productId,
      item_name: productData.productName,
      item_category: productData.category,
      price: productData.price,
      quantity: productData.quantity || 1,
    }],
  });
};

// Track registration with user type
export const trackRegistration = (registrationData: {
  method: 'email' | 'google' | 'facebook' | 'phone';
  userRole?: string;
  buyerRoles?: string[];
  sellerRoles?: string[];
  hasDelivery?: boolean;
  isBusiness?: boolean;
}) => {
  trackEvent('sign_up', {
    method: registrationData.method,
    user_role: registrationData.userRole,
    buyer_types: registrationData.buyerRoles?.join(','),
    seller_types: registrationData.sellerRoles?.join(','),
    has_delivery_role: registrationData.hasDelivery,
    is_business: registrationData.isBusiness,
  });

  // Also track user type
  trackUserType({
    role: registrationData.userRole,
    buyerRoles: registrationData.buyerRoles,
    sellerRoles: registrationData.sellerRoles,
    hasDelivery: registrationData.hasDelivery,
    isBusiness: registrationData.isBusiness,
  });
};

// Track login
export const trackLogin = (method: 'email' | 'google' | 'facebook' | 'phone') => {
  trackEvent('login', {
    method,
  });
};

// Track promotion engagement
export const trackPromoEngagement = (promoData: {
  promoId: string;
  promoName: string;
  action: 'view' | 'click' | 'dismiss' | 'accept';
  location?: string;
}) => {
  trackEvent('promo_engagement', {
    promo_id: promoData.promoId,
    promo_name: promoData.promoName,
    promo_action: promoData.action,
    promo_location: promoData.location,
  });
};

// Track content engagement
export const trackContentEngagement = (contentData: {
  contentType: 'product' | 'dish' | 'design' | 'recipe' | 'garden';
  contentId: string;
  action: 'view' | 'favorite' | 'share' | 'message' | 'order';
}) => {
  trackEvent('content_engagement', {
    content_type: contentData.contentType,
    content_id: contentData.contentId,
    engagement_action: contentData.action,
  });
};

