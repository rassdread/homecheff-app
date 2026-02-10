/**
 * Order Number Generator
 * Generates user-friendly order numbers for HomeCheff
 */

export class OrderNumberGenerator {
  /**
   * Generate a friendly order number
   * Format: HC-YYYY-NNNN (e.g., HC-2025-0001)
   */
  static async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Count orders for this year (excluding subscription orders)
      const orderCount = await prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`)
          },
          NOT: {
            orderNumber: { startsWith: 'SUB-' }
          }
        }
      });

      const nextNumber = orderCount + 1;
      const paddedNumber = String(nextNumber).padStart(4, '0');
      
      return `HC-${year}-${paddedNumber}`;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Generate a subscription order number
   * Format: HC-SUB-YYYY-MM (e.g., HC-SUB-2025-11)
   */
  static generateSubscriptionNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-4); // Last 4 digits of timestamp
    
    return `HC-SUB-${year}${month}-${timestamp}`;
  }

  /**
   * Generate a recovery order number (for recovered Stripe orders)
   * Uses regular format to blend in seamlessly
   * Format: HC-YYYY-XXXX (e.g., HC-2025-0023)
   */
  static async generateRecoveryNumber(): Promise<string> {
    // Use the same format as regular orders for seamless integration
    return await this.generateOrderNumber();
  }

  /**
   * Generate a delivery order reference
   * Format: HC-DEL-XXXX (e.g., HC-DEL-A1B2)
   */
  static generateDeliveryReference(): string {
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `HC-DEL-${randomSuffix}`;
  }

  /**
   * Check if an order number is valid HomeCheff format
   */
  static isValidOrderNumber(orderNumber: string): boolean {
    const patterns = [
      /^HC-\d{4}-\d{4}$/, // Regular orders (including recovered ones)
      /^HC-SUB-\d{6}-\d{4}$/, // Subscription orders
      /^HC-DEL-[A-Z0-9]{4}$/ // Delivery references
    ];
    
    return patterns.some(pattern => pattern.test(orderNumber));
  }

  /**
   * Get order type from order number
   */
  static getOrderType(orderNumber: string): 'regular' | 'subscription' | 'delivery' | 'legacy' {
    if (orderNumber.startsWith('HC-SUB-')) return 'subscription';
    if (orderNumber.startsWith('HC-DEL-')) return 'delivery';
    if (orderNumber.startsWith('HC-')) return 'regular';
    return 'legacy';
  }

  /**
   * Generate fallback order number for existing orders without proper numbers
   * Format: HC-LEGACY-XXXX (e.g., HC-LEGACY-A1B2)
   */
  static generateFallbackNumber(orderId: string): string {
    // Use last 6 characters of order ID for consistency
    const suffix = orderId.slice(-6).toUpperCase();
    return `HC-LEGACY-${suffix}`;
  }

  /**
   * Get or generate order number (for fallback scenarios)
   */
  static getDisplayNumber(orderNumber: string | null | undefined, orderId: string): string {
    if (orderNumber && this.isValidOrderNumber(orderNumber)) {
      return orderNumber;
    }
    if (orderNumber && orderNumber.startsWith('ORD-')) {
      // Legacy format, keep as is for now
      return orderNumber;
    }
    // Generate fallback for missing order numbers
    return this.generateFallbackNumber(orderId);
  }

  /**
   * Format order number for display (add emoji based on type)
   */
  static formatForDisplay(orderNumber: string): string {
    const type = this.getOrderType(orderNumber);
    
    switch (type) {
      case 'regular':
        return `🛍️ ${orderNumber}`;
      case 'subscription':
        return `⭐ ${orderNumber}`;
      case 'delivery':
        return `🚚 ${orderNumber}`;
      default:
        return `📦 ${orderNumber}`;
    }
  }
}
