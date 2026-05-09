import { PrismaClient } from '@prisma/client';
import { orderChatContextLine } from '@/lib/orders/sellerOrderTabs';

const prisma = new PrismaClient();

export interface OrderUpdateData {
  orderId: string;
  orderNumber: string;
  status?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupDate?: Date;
  deliveryDate?: Date;
  deliveryMode?: 'PICKUP' | 'DELIVERY' | 'BOTH';
  notes?: string;
}

/** Korte systeemregel: geen orderbeheer in chat, alleen context + verwijzing. */
function minimalOrderNotice(displayNumber: string, kind: string): string {
  const base = orderChatContextLine(displayNumber);
  switch (kind) {
    case 'ORDER_CONFIRMED':
      return `${base} Status: bevestigd.`;
    case 'ORDER_PROCESSING':
      return `${base} Status: in behandeling.`;
    case 'ORDER_READY_PICKUP':
      return `${base} Status: klaar voor ophalen.`;
    case 'ORDER_SHIPPED':
      return `${base} Status: verzonden / onderweg.`;
    case 'ORDER_DELIVERED':
      return `${base} Status: afgerond.`;
    case 'ORDER_CANCELLED':
      return `${base} Status: geannuleerd.`;
    case 'ADDRESS_UPDATE':
      return `${base} Adres bijgewerkt.`;
    case 'PICKUP_TIME_UPDATE':
    case 'DELIVERY_TIME_UPDATE':
      return `${base} Tijd bijgewerkt.`;
    default:
      return base;
  }
}

export class OrderMessagingService {
  /**
   * Minimale chatregel bij order-events (orderbeheer blijft bij Verkooporders / Mijn bestellingen).
   */
  static async sendOrderUpdate(data: OrderUpdateData, updateType: string) {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: { orderId: data.orderId },
        include: {
          ConversationParticipant: true,
        },
      });

      if (!conversation) {
        return;
      }

      const text = minimalOrderNotice(data.orderNumber, updateType);

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: conversation.ConversationParticipant[0].userId,
          text,
          messageType: 'SYSTEM',
          orderNumber: data.orderNumber,
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          },
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      if (typeof global !== 'undefined' && (global as any).io) {
        (global as any).io.to(conversation.id).emit('new-message', message);
      }
      return message;
    } catch (error) {
      console.error('Error sending order update message:', error);
      throw error;
    }
  }

  /**
   * Eén korte bevestigingsregel na plaatsing (geen pickup/verzend-spam in chat).
   */
  static async sendOrderConfirmation(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        User: true,
        items: {
          include: {
            Product: {
              include: {
                seller: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const orderData: OrderUpdateData = {
      orderId: order.id,
      orderNumber: (
        await import('@/lib/orderNumberGenerator')
      ).OrderNumberGenerator.getDisplayNumber(order.orderNumber, order.id),
      deliveryMode: order.deliveryMode as any,
      pickupAddress: order.pickupAddress || undefined,
      deliveryAddress: order.deliveryAddress || undefined,
      pickupDate: order.pickupDate || undefined,
      deliveryDate: order.deliveryDate || undefined,
      notes: order.notes || undefined,
    };

    await this.sendOrderUpdate(orderData, 'ORDER_CONFIRMED');
  }

  static async updateOrderStatus(
    orderId: string,
    newStatus: string,
    additionalData?: Partial<OrderUpdateData>
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as any,
        ...additionalData,
      },
    });

    const orderData: OrderUpdateData = {
      orderId: order.id,
      orderNumber: (
        await import('@/lib/orderNumberGenerator')
      ).OrderNumberGenerator.getDisplayNumber(order.orderNumber, order.id),
      ...additionalData,
    };

    const typeMap: Record<string, string> = {
      CONFIRMED: 'ORDER_CONFIRMED',
      PROCESSING: 'ORDER_PROCESSING',
      SHIPPED: 'ORDER_SHIPPED',
      DELIVERED: 'ORDER_DELIVERED',
      CANCELLED: 'ORDER_CANCELLED',
    };
    const updateType = typeMap[newStatus] || 'ORDER_PROCESSING';
    if (typeMap[newStatus]) {
      await this.sendOrderUpdate(orderData, updateType);
    }
  }

  static async updateOrderAddress(
    orderId: string,
    addressData: {
      pickupAddress?: string;
      deliveryAddress?: string;
      deliveryMode?: 'PICKUP' | 'DELIVERY' | 'BOTH';
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: addressData,
    });

    const orderData: OrderUpdateData = {
      orderId: order.id,
      orderNumber: (
        await import('@/lib/orderNumberGenerator')
      ).OrderNumberGenerator.getDisplayNumber(order.orderNumber, order.id),
      ...addressData,
    };

    await this.sendOrderUpdate(orderData, 'ADDRESS_UPDATE');
  }

  static async updateOrderTime(
    orderId: string,
    timeData: {
      pickupDate?: Date;
      deliveryDate?: Date;
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: timeData,
    });

    const orderData: OrderUpdateData = {
      orderId: order.id,
      orderNumber: (
        await import('@/lib/orderNumberGenerator')
      ).OrderNumberGenerator.getDisplayNumber(order.orderNumber, order.id),
      ...timeData,
    };

    if (timeData.pickupDate) {
      await this.sendOrderUpdate(orderData, 'PICKUP_TIME_UPDATE');
    } else if (timeData.deliveryDate) {
      await this.sendOrderUpdate(orderData, 'DELIVERY_TIME_UPDATE');
    }
  }
}
