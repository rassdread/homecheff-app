'use client';

import { Building2, Sparkles } from 'lucide-react';
import {
  getBusinessVisibilityProfile,
  stripePlanKeyToBusinessPlanId,
  type BusinessPlanId,
} from '@/lib/business/visibility-profile';

interface BusinessBadgeProps {
  companyName?: string | null;
  subscriptionName?: string | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'product';
}

const PLAN_GRADIENT: Record<Exclude<BusinessPlanId, 'individual'>, string> = {
  basic: 'from-primary-brand via-emerald-400 to-teal-400',
  pro: 'from-emerald-600 via-primary-brand to-cyan-500',
  premium: 'from-primary-brand via-emerald-700 to-lime-400',
};

function resolvePlanFromSubscriptionName(
  subscriptionName?: string | null,
): BusinessPlanId | null {
  if (!subscriptionName) return null;
  return stripePlanKeyToBusinessPlanId(subscriptionName);
}

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

  const planId = resolvePlanFromSubscriptionName(subscriptionName);
  const dna = planId ? getBusinessVisibilityProfile(planId) : null;

  if (dna && dna.plan !== 'individual') {
    const gradientClasses = PLAN_GRADIENT[dna.plan];
    const tier = dna.plan.charAt(0).toUpperCase() + dna.plan.slice(1);

    return (
      <div
        className={`inline-flex flex-col gap-1 ${sizeClasses[size]} bg-gradient-to-r ${gradientClasses} text-white rounded-xl shadow-lg border-2 border-white/20 max-w-full`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 font-bold text-sm sm:text-base">
            <Building2 className={iconSizes[size]} />
            {tier}
          </span>
          {companyName && (
            <span className="opacity-90 font-medium truncate">• {companyName}</span>
          )}
          {dna.verifiedBusiness ? (
            <span className="opacity-80 text-xs bg-white/25 px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase">
              Verified
            </span>
          ) : null}
        </div>
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

