// Seed subscriptions for test/demo
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.subscription.upsert({
    where: { name: "Basic" },
    update: { feeBps: 900, priceCents: 3900 },
    create: {
      name: "Basic",
      priceCents: 3900,
      feeBps: 900,
      durationDays: 365,
    },
  });
  await prisma.subscription.upsert({
    where: { name: "Pro" },
    update: { feeBps: 700, priceCents: 9900 },
    create: {
      name: "Pro",
      priceCents: 9900,
      feeBps: 700,
      durationDays: 365,
    },
  });
  await prisma.subscription.upsert({
    where: { name: "Premium" },
    update: { feeBps: 500, priceCents: 19900 },
    create: {
      name: "Premium",
      priceCents: 19900,
      feeBps: 500,
      durationDays: 365,
    },
  });
  console.log("Subscriptions seeded");
}

main().catch(e => { console.error(e); process.exit(1); });
