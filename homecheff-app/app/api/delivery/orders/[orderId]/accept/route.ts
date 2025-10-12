import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { orderId } = params;

    // Get user's delivery profile
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session.user as any).id }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Geen bezorger profiel gevonden' }, { status: 404 });
    }

    // Check if order exists and is still available
    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id: orderId },
      include: {
        order: {
          include: {
            items: {
              include: {
                Product: {
                  include: {
                    Image: {
                      select: { fileUrl: true },
                      take: 1
                    },
                    seller: {
                      include: {
                        User: {
                          select: {
                            name: true,
                            username: true,
                            phoneNumber: true,
                            lat: true,
                            lng: true,
                            place: true,
                            address: true,
                            city: true,
                            postalCode: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phoneNumber: true,
                lat: true,
                lng: true,
                address: true,
                city: true,
                postalCode: true
              }
            }
          }
        }
      }
    });

    if (!deliveryOrder) {
      return NextResponse.json({ error: 'Bezorgopdracht niet gevonden' }, { status: 404 });
    }

    if (deliveryOrder.status !== 'PENDING') {
      return NextResponse.json({ error: 'Deze opdracht is al geaccepteerd door een andere bezorger' }, { status: 400 });
    }

    if (deliveryOrder.deliveryProfileId && deliveryOrder.deliveryProfileId !== profile.id) {
      return NextResponse.json({ error: 'Deze opdracht is al toegewezen aan een andere bezorger' }, { status: 400 });
    }

    // Update delivery order - assign to this deliverer and mark as ACCEPTED
    const updatedOrder =       await prisma.deliveryOrder.update({
        where: { id: orderId },
        data: {
          deliveryProfileId: profile.id,
          status: 'ACCEPTED'
        },
      include: {
        order: {
          include: {
            items: {
              include: {
                Product: {
                  include: {
                    Image: true,
                    seller: {
                      include: {
                        User: true
                      }
                    }
                  }
                }
              }
            },
            User: true
          }
        }
      }
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { name: true, username: true }
    });

    // Create or get conversation for delivery communication
    let deliveryConversation = await prisma.conversation.findFirst({
      where: {
        orderId: updatedOrder.orderId,
        ConversationParticipant: {
          some: {
            userId: updatedOrder.order.userId
          }
        }
      }
    });

    // If no conversation exists yet, create one
    if (!deliveryConversation) {
      deliveryConversation = await prisma.conversation.create({
        data: {
          id: `delivery_conv_${updatedOrder.orderId}_${Date.now()}`,
          orderId: updatedOrder.orderId,
          title: `Bezorging ${updatedOrder.order.orderNumber || 'bestelling'}`,
          lastMessageAt: new Date(),
          ConversationParticipant: {
            create: [
              { id: `participant_customer_${Date.now()}`, userId: updatedOrder.order.userId },
              { id: `participant_deliverer_${Date.now()}`, userId: (session.user as any).id }
            ]
          }
        }
      });
    } else {
      // Add deliverer as participant if not already in conversation
      const existingParticipant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: deliveryConversation.id,
          userId: (session.user as any).id
        }
      });

      if (!existingParticipant) {
        await prisma.conversationParticipant.create({
          data: {
            id: `participant_deliverer_${Date.now()}`,
            conversationId: deliveryConversation.id,
            userId: (session.user as any).id
          }
        });
      }
    }

    // Send system message to customer about delivery acceptance
    const delivererName = user?.name || user?.username || 'Een bezorger';
    const deliveryMessageText = `🚴 **Je bezorging gaat gedaan worden door ${delivererName}**\n\n` +
      `Je bestelling wordt bezorgd door ${delivererName}. ` +
      `Je kunt hieronder een bericht sturen om de bezorging af te stemmen.\n\n` +
      `📍 Geschatte bezorgtijd: ~30 minuten\n` +
      `✅ Status: Geaccepteerd`;

    await prisma.message.create({
      data: {
        id: `msg_delivery_accept_${orderId}_${Date.now()}`,
        conversationId: deliveryConversation.id,
        senderId: (session.user as any).id,
        text: deliveryMessageText,
        messageType: 'SYSTEM',
        isEncrypted: false,
      }
    });

    // Create notification for customer with link to conversation
    await prisma.notification.create({
      data: {
        id: `notif_delivery_accepted_${orderId}_${Date.now()}`,
        userId: updatedOrder.order.userId,
        type: 'MESSAGE_RECEIVED',
        payload: {
          title: '🚴 Bezorger gevonden!',
          message: `${delivererName} heeft je bestelling geaccepteerd. Stuur een bericht om de bezorging af te stemmen.`,
          orderId: updatedOrder.orderId,
          deliveryOrderId: updatedOrder.id,
          delivererName: delivererName,
          conversationId: deliveryConversation.id,
          link: `/messages?conversation=${deliveryConversation.id}`
        }
      }
    });

    console.log(`✅ Order ${orderId} accepted by deliverer ${delivererName}`);
    console.log(`✅ Delivery conversation created: ${deliveryConversation.id}`);

    // Transform for frontend
    const product = updatedOrder.order.items[0]?.Product;
    const sellerAddress = [
      product?.seller?.User?.address,
      product?.seller?.User?.postalCode,
      product?.seller?.User?.city
    ].filter(Boolean).join(', ') || product?.seller?.User?.place || 'Ophaaladres niet beschikbaar';

    const customerAddress = [
      updatedOrder.order.User?.address,
      updatedOrder.order.User?.postalCode,
      updatedOrder.order.User?.city
    ].filter(Boolean).join(', ') || updatedOrder.deliveryAddress || 'Bezorgadres niet beschikbaar';

    const transformedOrder = {
      id: updatedOrder.id,
      orderId: updatedOrder.orderId,
      status: 'ACCEPTED' as const,
      deliveryFee: updatedOrder.deliveryFee,
      estimatedTime: updatedOrder.estimatedTime || 30,
      distance: 5, // Would calculate from GPS
      customerName: updatedOrder.order.User?.name || updatedOrder.order.User?.username || 'Klant',
      customerAddress: customerAddress,
      customerPhone: updatedOrder.order.User?.phoneNumber || 'Niet beschikbaar',
      notes: updatedOrder.notes || updatedOrder.order.notes || '',
      createdAt: updatedOrder.createdAt,
      acceptedAt: new Date(),
      conversationId: deliveryConversation.id,
      product: {
        title: product?.title || 'Product',
        image: product?.Image?.[0]?.fileUrl || '',
        seller: {
          name: product?.seller?.User?.name || 'Verkoper',
          address: sellerAddress,
          phone: product?.seller?.User?.phoneNumber || 'Niet beschikbaar'
        }
      }
    };

    return NextResponse.json({ 
      success: true, 
      order: transformedOrder 
    });

  } catch (error) {
    console.error('Order acceptance error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het accepteren van de bestelling' 
    }, { status: 500 });
  }
}


