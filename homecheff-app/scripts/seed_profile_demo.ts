const { PrismaClient, $Enums } = require("@prisma/client");
const { randomUUID } = require("crypto");

// Gebruik de Prisma enum via $Enums
// Gebruik string literals voor UserRole
const UserRole = { BUYER: "BUYER", SELLER: "SELLER" };
const prisma = new PrismaClient();

async function main() {
  // Seed demo users, seller profile, products, order, favorite, follow
  const [buyer, seller] = await Promise.all([
    prisma.user.upsert({
      where: { email: "buyer@example.com" },
      update: {},
      create: {
        name: "Test Buyer",
    // role hierboven al correct
        bio: "Ik hou van lokale gerechten.",
        interests: ["cheff", "garden"],
      },
    }),
    prisma.user.upsert({
      where: { email: "seller@example.com" },
      update: {},
      create: {
        name: "Test Seller",
    // role hierboven al correct
        bio: "Huiskok met passie voor pasta.",
      },
    })
  ]);

  // maak seller
  await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      email: "seller@example.com",
      name: "Test Seller",
      role: "SELLER" as any,
      bio: "Huiskok met passie voor pasta.",
    },
  });

  // SellerProfile aanmaken of ophalen
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      id: randomUUID(),
      userId: seller.id,
      displayName: seller.name ?? "Test Seller",
      bio: seller.bio ?? "Huiskok met passie voor pasta."
    }
  });
  // ...existing code...
  console.log('Seller ID:', seller.id, 'Type:', typeof seller.id);

  // Producten batch aanmaken
  const [p1, p2] = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: sellerProfile.id,
        title: "Lasagne",
  category: $Enums.ProductCategory.CHEFF,
  unit: $Enums.Unit.STUK,
  delivery: $Enums.DeliveryMode.PICKUP
  // ...unit en delivery zijn hierboven al correct met $Enums
      }
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile.id,
        title: "Tuin kruidenmix",
  category: $Enums.ProductCategory.GROWN,
  unit: $Enums.Unit.STUK,
  delivery: $Enums.DeliveryMode.PICKUP
  // ...unit en delivery zijn hierboven al correct met $Enums
      }
    })
  ]);

  // Order aanmaken
  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      items: {
        create: [
          { productId: p1.id, priceCents: p1.priceCents, quantity: 1 },
          { productId: p2.id, priceCents: p2.priceCents, quantity: 1 },
        ]
      }
    }
  });

  // Favorite en follow aanmaken
  await Promise.all([
    prisma.favorite.create({ data: { userId: buyer.id, productId: p1.id } }),
    prisma.follow.create({ data: { followerId: buyer.id, sellerId: seller.id } })
  ]);

  console.log("Seed klaar:", { buyer: buyer.email, seller: seller.email, order: order.id });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
