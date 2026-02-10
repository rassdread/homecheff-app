// EctaroShip API Integration
// Shipping label generation and tracking

const ECTAROSHIP_API_KEY = process.env.ECTAROSHIP_API_KEY;
// EctaroShip API base URL - adjust if different
// Common patterns: https://api.ectaroship.nl, https://api.ectaro.com, https://ectaroship.nl/api
const ECTAROSHIP_API_BASE_URL = process.env.ECTAROSHIP_API_BASE_URL || 'https://api.ectaroship.nl';

export interface EctaroShipPriceRequest {
  weight: number; // in kg
  dimensions: {
    length: number; // in cm
    width: number; // in cm
    height: number; // in cm
  };
  origin: {
    postalCode: string;
    country: string;
  };
  destination: {
    postalCode: string;
    country: string;
  };
  carrier?: string; // PostNL, DHL, DPD, etc. (optioneel)
}

export interface EctaroShipPriceResponse {
  price: number; // in EUR
  carrier: string;
  method: string; // Standard, Express, etc.
  estimatedDays: number;
  currency: string;
}

export interface EctaroShipLabelRequest {
  orderId: string;
  recipient: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    email?: string;
    phone?: string;
  };
  sender: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    email?: string;
    phone?: string;
  };
  weight: number; // in kg
  dimensions: {
    length: number; // in cm
    width: number; // in cm
    height: number; // in cm
  };
  carrier?: string; // PostNL, DHL, etc.
  description?: string; // Product beschrijving
}

export interface EctaroShipLabelResponse {
  labelId: string;
  trackingNumber: string;
  pdfUrl: string;
  price: number; // in EUR
  carrier: string;
  status: string;
}

export interface EctaroShipTrackingResponse {
  status: 'label_created' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  trackingNumber: string;
  events: Array<{
    status: string;
    timestamp: string;
    location?: string;
    description?: string;
  }>;
  deliveredAt?: string;
}

/**
 * Calculate shipping price using EctaroShip API
 */
export async function calculateShippingPrice(
  request: EctaroShipPriceRequest
): Promise<EctaroShipPriceResponse | { error: string }> {
  if (!ECTAROSHIP_API_KEY) {
    return { error: 'EctaroShip API key not configured' };
  }

  try {
    const response = await fetch(`${ECTAROSHIP_API_BASE_URL}/v1/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ECTAROSHIP_API_KEY}`,
        'X-API-Key': ECTAROSHIP_API_KEY, // Sommige APIs gebruiken X-API-Key header
      },
      body: JSON.stringify({
        weight: request.weight,
        dimensions: request.dimensions,
        origin: request.origin,
        destination: request.destination,
        carrier: request.carrier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('EctaroShip price calculation error:', errorData);
      return { error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      price: data.price || data.cost || 0,
      carrier: data.carrier || 'PostNL',
      method: data.method || data.service || 'Standard',
      estimatedDays: data.estimatedDays || data.estimated_days || 1,
      currency: data.currency || 'EUR',
    };
  } catch (error: any) {
    console.error('EctaroShip API error:', error);
    return { error: error.message || 'Failed to calculate shipping price' };
  }
}

/**
 * Create shipping label using EctaroShip API
 */
export async function createShippingLabel(
  request: EctaroShipLabelRequest
): Promise<EctaroShipLabelResponse | { error: string }> {
  if (!ECTAROSHIP_API_KEY) {
    return { error: 'EctaroShip API key not configured' };
  }

  try {
    const response = await fetch(`${ECTAROSHIP_API_BASE_URL}/v1/shipping/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ECTAROSHIP_API_KEY}`,
        'X-API-Key': ECTAROSHIP_API_KEY,
      },
      body: JSON.stringify({
        order_id: request.orderId,
        recipient: request.recipient,
        sender: request.sender,
        weight: request.weight,
        dimensions: request.dimensions,
        carrier: request.carrier,
        description: request.description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('EctaroShip label creation error:', errorData);
      return { error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      labelId: data.label_id || data.id || '',
      trackingNumber: data.tracking_number || data.trackingNumber || '',
      pdfUrl: data.pdf_url || data.pdfUrl || data.label_url || '',
      price: data.price || data.cost || 0,
      carrier: data.carrier || 'PostNL',
      status: data.status || 'created',
    };
  } catch (error: any) {
    console.error('EctaroShip API error:', error);
    return { error: error.message || 'Failed to create shipping label' };
  }
}

/**
 * Get tracking status from EctaroShip API
 */
export async function getTrackingStatus(
  labelId: string
): Promise<EctaroShipTrackingResponse | { error: string }> {
  if (!ECTAROSHIP_API_KEY) {
    return { error: 'EctaroShip API key not configured' };
  }

  try {
    const response = await fetch(`${ECTAROSHIP_API_BASE_URL}/v1/shipping/labels/${labelId}/tracking`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ECTAROSHIP_API_KEY}`,
        'X-API-Key': ECTAROSHIP_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    // Map EctaroShip status to our status enum
    const statusMap: Record<string, EctaroShipTrackingResponse['status']> = {
      'created': 'label_created',
      'shipped': 'shipped',
      'in_transit': 'in_transit',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'failed': 'failed',
    };

    return {
      status: statusMap[data.status] || 'label_created',
      trackingNumber: data.tracking_number || data.trackingNumber || '',
      events: data.events || data.tracking_events || [],
      deliveredAt: data.delivered_at || data.deliveredAt,
    };
  } catch (error: any) {
    console.error('EctaroShip tracking error:', error);
    return { error: error.message || 'Failed to get tracking status' };
  }
}

/**
 * Verify webhook signature (if EctaroShip uses webhook secrets)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  if (!secret || !process.env.ECTAROSHIP_WEBHOOK_SECRET) {
    // If no secret configured, accept webhook (less secure but works)
    return true;
  }

  // Implement webhook signature verification based on EctaroShip's method
  // This is a placeholder - adjust based on EctaroShip's actual implementation
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret || process.env.ECTAROSHIP_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

