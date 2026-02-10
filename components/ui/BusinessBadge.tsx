'use client';

import { Building2, Sparkles } from 'lucide-react';

interface BusinessBadgeProps {
  companyName?: string | null;
  subscriptionName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'product';
}

const PLAN_DETAILS: Record<string, {
  label: string;
  emoji: string;
  gradient: string;
  tier: string;
  description: string;
}> = {
  basic: {
    label: 'Gilde Lid',
    emoji: '🥉',
    gradient: 'from-primary-brand via-emerald-400 to-teal-400',
    tier: 'Basic',
    description: 'Het fundament van het gilde – deelt zijn creaties met trots en bouwt warm aan de community.',
  },
  pro: {
    label: 'Meester van ’t Gilde',
    emoji: '🥈',
    gradient: 'from-emerald-600 via-primary-brand to-cyan-500',
    tier: 'Pro',
    description: 'De ervaren vakman: een voorbeeld voor anderen, professioneel en vol ambachtelijke trots.',
  },
  premium: {
    label: 'Eer van ’t Gilde',
    emoji: '🥇',
    gradient: 'from-primary-brand via-emerald-700 to-lime-400',
    tier: 'Premium',
    description: 'De hoogste eer binnen het gilde – vertegenwoordigt HomeCheff naar buiten toe met uitzonderlijke kwaliteit.',
  },
};

export default function BusinessBadge({ 
  companyName, 
  subscriptionName,
  size = 'md',
  variant = 'default'
}: BusinessBadgeProps) {
  // Compact variant voor producten
  if (variant === 'compact' || variant === 'product') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-sm">
        <Building2 className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">Bedrijf</span>
      </div>
    );
  }

  // Default variant voor profielpagina's
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const planKey = subscriptionName?.toLowerCase() ?? '';
  const planDetail = PLAN_DETAILS[planKey];

  if (planDetail) {
    const gradientClasses = planDetail.gradient;
    const descriptionEnabled = size === 'lg' && planDetail.description;

    return (
      <div
        className={`inline-flex flex-col gap-1 ${sizeClasses[size]} bg-gradient-to-r ${gradientClasses} text-white rounded-xl shadow-lg border-2 border-white/20 max-w-full`}
        title={planDetail.description}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 font-bold text-sm sm:text-base">
            <span className="text-lg sm:text-xl">{planDetail.emoji}</span>
            {planDetail.label}
          </span>
          {companyName && (
            <span className="opacity-90 font-medium truncate">• {companyName}</span>
          )}
          <span className="opacity-80 text-xs bg-white/25 px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase">
            {planDetail.tier}
          </span>
        </div>
        {descriptionEnabled && (
          <p className="text-xs font-medium text-white/90 leading-snug">
            {planDetail.description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-xl shadow-lg border-2 border-white/20`}>
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <Building2 className={`${iconSizes[size]} drop-shadow-sm`} />
          <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse" fill="currentColor" />
        </div>
        <span className="font-bold">KVK Bedrijf</span>
      </div>
      {companyName && (
        <span className="opacity-90 font-medium">• {companyName}</span>
      )}
      {subscriptionName && (
        <span className="opacity-75 text-xs bg-white/20 px-2 py-0.5 rounded-full">
          {subscriptionName}
        </span>
      )}
    </div>
  );
}

