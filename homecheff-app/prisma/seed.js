/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function ensureUser(email, name, image) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, image },
    select: { id: true, email: true, name: true, image: true }
  });
}

async function main() {
  const me = await ensureUser("test@homecheff.local", "Test User", null);
  const seller = await ensureUser("chef.anna@homecheff.local", "Chef Anna", null);

  const any = prisma;
  const hasListing = !!any.listing;
  let listingIds = [];
  if (hasListing) {
    const l1 = await any.listing.create({ data: { title: "Lasagne al Forno", price: 1299, image: "/placeholder-lasagne.jpg", userId: seller.id } });
    const l2 = await any.listing.create({ data: { title: "Verse Oogstbox", price: 899, image: "/placeholder-oogst.jpg", userId: seller.id } });
    listingIds = [l1.id, l2.id];
  }

  const hasFavorite = !!any.favorite;
  if (hasFavorite && listingIds.length) {
    for (const lid of listingIds) {
      await any.favorite.upsert({
        where: { userId_listingId: { userId: me.id, listingId: lid } },
        update: {},
        create: { userId: me.id, listingId: lid }
      });
    }
  }

  const hasFollow = !!any.follow;
  if (hasFollow) {
    await any.follow.upsert({
      where: { followerId_sellerId: { followerId: me.id, sellerId: seller.id } },
      update: {},
      create: { followerId: me.id, sellerId: seller.id }
    });
  }

  const hasOrder = !!any.order;
  const hasOrderItem = !!any.orderItem;
  if (hasOrder) {
    const order = await any.order.create({
      data: { userId: me.id, status: "paid", total: 2198 }
    });
    if (hasOrderItem) {
      await any.orderItem.create({ data: { orderId: order.id, listingId: listingIds[0] || null, title: "Lasagne al Forno", price: 1299, quantity: 1, image: "/placeholder-lasagne.jpg" } });
      await any.orderItem.create({ data: { orderId: order.id, listingId: listingIds[1] || null, title: "Verse Oogstbox", price: 899, quantity: 1, image: "/placeholder-oogst.jpg" } });
    }
  }

  // seed published dishes
  try {
    await prisma.dish.create({
      data: {
        userId: seller.id,
        title: "Dagverse pompoensoep",
        description: "Romig, met kokos en gember.",
        status: "PUBLISHED",
        priceCents: 650,
        deliveryMode: "PICKUP",
        lat: 52.3702,
        lng: 4.8952,
        place: "Amsterdam",
        photos: { create: [{ url: "/placeholder-soup.jpg", idx: 0 }] }
      }
    });
  } catch {}

  console.log("Seed klaar ✅");
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
