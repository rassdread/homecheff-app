// Create subscriptions in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const subscriptions = [
    {
      id: 'basic',
      name: 'Basic',
      priceCents: 3900,
      feeBps: 700,
      durationDays: 365,
      isActive: true,
      updatedAt: new Date(),
    },
    {
      id: 'pro',
      name: 'Pro',
      priceCents: 9900,
      feeBps: 400,
      durationDays: 365,
      isActive: true,
      updatedAt: new Date(),
    },
    {
      id: 'premium',
      name: 'Premium',
      priceCents: 19900,
      feeBps: 200,
      durationDays: 365,
      isActive: true,
      updatedAt: new Date(),
    },
  ];

  for (const sub of subscriptions) {
    await prisma.subscription.upsert({
      where: { id: sub.id },
      update: {
        name: sub.name,
        priceCents: sub.priceCents,
        feeBps: sub.feeBps,
        durationDays: sub.durationDays,
        isActive: sub.isActive,
        updatedAt: sub.updatedAt,
      },
      create: sub,
    });
    console.log(`✅ Subscription ${sub.name} created/updated`);
  }

  console.log('✅ All subscriptions created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

