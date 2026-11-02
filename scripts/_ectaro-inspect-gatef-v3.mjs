import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const product = await p.product.findFirst({
  include: {
    seller: {
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            address: true,
            postalCode: true,
            city: true,
            place: true,
            phoneNumber: true,
          },
        },
      },
    },
  },
});
const buyer = await p.user.findUnique({
  where: { id: '11111111-1111-4111-8111-111111111111' },
});
console.log(
  JSON.stringify(
    {
      product: product && {
        id: product.id,
        title: product.title,
        priceCents: product.priceCents,
        stock: product.stock,
        isActive: product.isActive,
        delivery: product.delivery,
        weightGrams: product.weightGrams,
        weightKg: product.weightKg,
        lengthCm: product.lengthCm,
        widthCm: product.widthCm,
        heightCm: product.heightCm,
        fulfillmentOptions: product.fulfillmentOptions,
        sellerId: product.sellerId,
        seller: product.seller,
      },
      buyer: buyer && {
        id: buyer.id,
        email: buyer.email,
        name: buyer.name,
        address: buyer.address,
        postalCode: buyer.postalCode,
        city: buyer.city,
        place: buyer.place,
        phoneNumber: buyer.phoneNumber,
        username: buyer.username,
      },
      orders: await p.order.count(),
      labels: await p.shippingLabel.count(),
    },
    null,
    2,
  ),
);
await p.$disconnect();
