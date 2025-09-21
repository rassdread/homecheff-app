import { PrismaClient } from '@prisma/client';

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

export class OrderMessagingService {
  /**
   * Send automatic order update message to chat
   */
  static async sendOrderUpdate(data: OrderUpdateData, updateType: string) {
    try {
      // Find conversation for this order
      const conversation = await prisma.conversation.findFirst({
        where: { orderId: data.orderId },
        include: {
          ConversationParticipant: true
        }
      });

      if (!conversation) {
        console.log(`No conversation found for order ${data.orderId}`);
        return;
      }

      let messageText = '';
      let messageType: string = 'SYSTEM';

      switch (updateType) {
        case 'ORDER_CONFIRMED':
          messageText = `✅ Bestelling ${data.orderNumber} is bevestigd!\n\nJe bestelling is ontvangen en wordt voorbereid.`;
          messageType = 'ORDER_STATUS_UPDATE';
          break;

        case 'ORDER_PROCESSING':
          messageText = `🔄 Bestelling ${data.orderNumber} wordt verwerkt\n\nDe verkoper bereidt je bestelling voor.`;
          messageType = 'ORDER_STATUS_UPDATE';
          break;

        case 'ORDER_READY_PICKUP':
          messageText = `📦 Bestelling ${data.orderNumber} is klaar voor afhaling!\n\n` +
                       `📍 Afhaaladres: ${data.pickupAddress}\n` +
                       `📅 Afhaaldatum: ${data.pickupDate ? new Date(data.pickupDate).toLocaleDateString('nl-NL') : 'Af te spreken'}\n\n` +
                       `Neem contact op met de verkoper voor de exacte afhaaltijd.`;
          messageType = 'ORDER_PICKUP_INFO';
          break;

        case 'ORDER_SHIPPED':
          messageText = `🚚 Bestelling ${data.orderNumber} is onderweg!\n\n` +
                       `📍 Bezorgadres: ${data.deliveryAddress}\n` +
                       `📅 Verwachte bezorging: ${data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString('nl-NL') : 'Binnenkort'}\n\n` +
                       `Je ontvangt een bericht zodra de bestelling is bezorgd.`;
          messageType = 'ORDER_DELIVERY_INFO';
          break;

        case 'ORDER_DELIVERED':
          messageText = `🎉 Bestelling ${data.orderNumber} is bezorgd!\n\n` +
                       `Je bestelling is succesvol bezorgd. Bedankt voor je aankoop! 🛍️\n\n` +
                       `Je kunt nu een review achterlaten voor de verkoper.`;
          messageType = 'ORDER_STATUS_UPDATE';
          break;

        case 'ORDER_CANCELLED':
          messageText = `❌ Bestelling ${data.orderNumber} is geannuleerd\n\n` +
                       `Je bestelling is geannuleerd. ${data.notes || 'Neem contact op voor meer informatie.'}`;
          messageType = 'ORDER_STATUS_UPDATE';
          break;

        case 'ADDRESS_UPDATE':
          if (data.deliveryMode === 'PICKUP') {
            messageText = `📍 Afhaaladres bijgewerkt voor bestelling ${data.orderNumber}\n\n` +
                         `Nieuw afhaaladres: ${data.pickupAddress}`;
            messageType = 'ORDER_ADDRESS_UPDATE';
          } else {
            messageText = `📍 Bezorgadres bijgewerkt voor bestelling ${data.orderNumber}\n\n` +
                         `Nieuw bezorgadres: ${data.deliveryAddress}`;
            messageType = 'ORDER_ADDRESS_UPDATE';
          }
          break;

        case 'PICKUP_TIME_UPDATE':
          messageText = `⏰ Afhaaltijd bijgewerkt voor bestelling ${data.orderNumber}\n\n` +
                       `Nieuwe afhaaltijd: ${data.pickupDate ? new Date(data.pickupDate).toLocaleString('nl-NL') : 'Af te spreken'}`;
          messageType = 'ORDER_PICKUP_INFO';
          break;

        case 'DELIVERY_TIME_UPDATE':
          messageText = `⏰ Bezorgtijd bijgewerkt voor bestelling ${data.orderNumber}\n\n` +
                       `Nieuwe bezorgtijd: ${data.deliveryDate ? new Date(data.deliveryDate).toLocaleString('nl-NL') : 'Binnenkort'}`;
          messageType = 'ORDER_DELIVERY_INFO';
          break;

        default:
          messageText = `ℹ️ Update voor bestelling ${data.orderNumber}\n\n${data.notes || 'Er is een update voor je bestelling.'}`;
          messageType = 'SYSTEM';
      }

      // Create system message
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: conversation.ConversationParticipant[0].userId, // Use first participant as sender (system message)
          text: messageText,
          messageType: messageType as any,
          orderNumber: data.orderNumber
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true
            }
          }
        }
      });

      // Update conversation last message time
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });

      // Emit socket event if available
      if (typeof global !== 'undefined' && (global as any).io) {
        (global as any).io.to(conversation.id).emit('new-message', message);
      }

      console.log(`Order update message sent for order ${data.orderNumber}`);
      return message;

    } catch (error) {
      console.error('Error sending order update message:', error);
      throw error;
    }
  }

  /**
   * Send pickup/delivery information when order is confirmed
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
                seller: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const orderData: OrderUpdateData = {
      orderId: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
      deliveryMode: order.deliveryMode as any,
      pickupAddress: order.pickupAddress || undefined,
      deliveryAddress: order.deliveryAddress || undefined,
      pickupDate: order.pickupDate || undefined,
      deliveryDate: order.deliveryDate || undefined,
      notes: order.notes || undefined
    };

    // Send confirmation message
    await this.sendOrderUpdate(orderData, 'ORDER_CONFIRMED');

    // Send pickup/delivery info if available
    if (order.deliveryMode === 'PICKUP' && order.pickupAddress) {
      await this.sendOrderUpdate(orderData, 'ORDER_READY_PICKUP');
    } else if (order.deliveryMode === 'DELIVERY' && order.deliveryAddress) {
      await this.sendOrderUpdate(orderData, 'ORDER_SHIPPED');
    }
  }

  /**
   * Update order status and send notification
   */
  static async updateOrderStatus(orderId: string, newStatus: string, additionalData?: Partial<OrderUpdateData>) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as any,
        ...additionalData
      }
    });

    const orderData: OrderUpdateData = {
      orderId: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
      ...additionalData
    };

    // Send appropriate update message
    switch (newStatus) {
      case 'CONFIRMED':
        await this.sendOrderUpdate(orderData, 'ORDER_CONFIRMED');
        break;
      case 'PROCESSING':
        await this.sendOrderUpdate(orderData, 'ORDER_PROCESSING');
        break;
      case 'SHIPPED':
        await this.sendOrderUpdate(orderData, 'ORDER_SHIPPED');
        break;
      case 'DELIVERED':
        await this.sendOrderUpdate(orderData, 'ORDER_DELIVERED');
        break;
      case 'CANCELLED':
        await this.sendOrderUpdate(orderData, 'ORDER_CANCELLED');
        break;
    }
  }

  /**
   * Update pickup/delivery address and notify
   */
  static async updateOrderAddress(orderId: string, addressData: {
    pickupAddress?: string;
    deliveryAddress?: string;
    deliveryMode?: 'PICKUP' | 'DELIVERY' | 'BOTH';
  }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: addressData
    });

    const orderData: OrderUpdateData = {
      orderId: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
      ...addressData
    };

    await this.sendOrderUpdate(orderData, 'ADDRESS_UPDATE');
  }

  /**
   * Update pickup/delivery time and notify
   */
  static async updateOrderTime(orderId: string, timeData: {
    pickupDate?: Date;
    deliveryDate?: Date;
  }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: timeData
    });

    const orderData: OrderUpdateData = {
      orderId: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
      ...timeData
    };

    if (timeData.pickupDate) {
      await this.sendOrderUpdate(orderData, 'PICKUP_TIME_UPDATE');
    } else if (timeData.deliveryDate) {
      await this.sendOrderUpdate(orderData, 'DELIVERY_TIME_UPDATE');
    }
  }
}



