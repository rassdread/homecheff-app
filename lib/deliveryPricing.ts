// Delivery Pricing Logic

export interface DeliveryPricing {
  baseFee: number;
  distanceFee: number;
  totalDeliveryFee: number;
  delivererCut: number; // 88% to deliverer
  platformCut: number; // 12% to platform
  breakdown: {
    baseRate: number;
    perKmRate: number;
    distance: number;
    freeDistanceKm: number;
  };
}

/**
 * Calculate delivery fee based on distance and delivery type
 * 
 * Pricing structure:
 * - Platform deliverers (teens): Base €2.50 + €0.50/km after 3km
 * - Seller delivery: Base €3.00 + €0.60/km after 5km (seller sets own price)
 * - Split: 88% to deliverer, 12% to platform
 */
export function calculateDeliveryFee(
  distanceKm: number,
  deliveryType: 'PLATFORM_DELIVERERS' | 'SELLER_DELIVERY' = 'PLATFORM_DELIVERERS'
): DeliveryPricing {
  
  let baseFee: number;
  let perKmRate: number;
  let freeDistanceKm: number;

  if (deliveryType === 'SELLER_DELIVERY') {
    // Seller delivers themselves - slightly higher base rate
    baseFee = 300; // €3.00
    perKmRate = 60; // €0.60 per km
    freeDistanceKm = 5; // First 5km included
  } else {
    // Platform deliverers (community/teens)
    baseFee = 250; // €2.50
    perKmRate = 50; // €0.50 per km
    freeDistanceKm = 3; // First 3km included
  }

  // Calculate distance fee
  const chargeableDistance = Math.max(0, distanceKm - freeDistanceKm);
  const distanceFee = Math.round(chargeableDistance * perKmRate);
  
  // Total delivery fee
  const totalDeliveryFee = baseFee + distanceFee;

  // Split: 88% to deliverer, 12% to platform
  const delivererCut = Math.round(totalDeliveryFee * 0.88);
  const platformCut = Math.round(totalDeliveryFee * 0.12);

  return {
    baseFee,
    distanceFee,
    totalDeliveryFee,
    delivererCut,
    platformCut,
    breakdown: {
      baseRate: baseFee,
      perKmRate,
      distance: distanceKm,
      freeDistanceKm
    }
  };
}

/**
 * Calculate delivery fee for long distance (over 30km)
 * Used for designer/art items where seller wants to deliver personally
 */
export function calculateLongDistanceDeliveryFee(distanceKm: number): DeliveryPricing {
  // For long distances, use tiered pricing
  let totalFee = 500; // €5.00 base for long distance
  
  if (distanceKm <= 30) {
    totalFee += Math.round(distanceKm * 60); // €0.60/km
  } else if (distanceKm <= 60) {
    totalFee = 500 + (30 * 60); // First 30km
    totalFee += Math.round((distanceKm - 30) * 50); // €0.50/km for 30-60km
  } else if (distanceKm <= 100) {
    totalFee = 500 + (30 * 60) + (30 * 50); // First 60km
    totalFee += Math.round((distanceKm - 60) * 40); // €0.40/km for 60-100km
  } else {
    totalFee = 500 + (30 * 60) + (30 * 50) + (40 * 40); // First 100km
    totalFee += Math.round((distanceKm - 100) * 30); // €0.30/km for 100km+
  }

  const delivererCut = Math.round(totalFee * 0.88);
  const platformCut = Math.round(totalFee * 0.12);

  return {
    baseFee: 500,
    distanceFee: totalFee - 500,
    totalDeliveryFee: totalFee,
    delivererCut,
    platformCut,
    breakdown: {
      baseRate: 500,
      perKmRate: 0, // Tiered pricing
      distance: distanceKm,
      freeDistanceKm: 0
    }
  };
}

/**
 * Get estimated delivery fee for UI display (before exact distance is calculated)
 */
export function getEstimatedDeliveryFeeRange(
  minDistanceKm: number,
  maxDistanceKm: number,
  deliveryType: 'PLATFORM_DELIVERERS' | 'SELLER_DELIVERY' = 'PLATFORM_DELIVERERS'
): { min: number; max: number } {
  const minFee = calculateDeliveryFee(minDistanceKm, deliveryType);
  const maxFee = calculateDeliveryFee(maxDistanceKm, deliveryType);
  
  return {
    min: minFee.totalDeliveryFee,
    max: maxFee.totalDeliveryFee
  };
}

/**
 * Format delivery fee breakdown for display
 */
export function formatDeliveryFeeBreakdown(pricing: DeliveryPricing): string {
  const breakdown = pricing.breakdown;
  
  let text = `Basis: €${(pricing.baseFee / 100).toFixed(2)}`;
  
  if (pricing.distanceFee > 0) {
    text += ` + Afstand (${breakdown.distance.toFixed(1)}km`;
    if (breakdown.freeDistanceKm > 0) {
      text += `, eerste ${breakdown.freeDistanceKm}km gratis`;
    }
    text += `): €${(pricing.distanceFee / 100).toFixed(2)}`;
  }
  
  return text;
}

