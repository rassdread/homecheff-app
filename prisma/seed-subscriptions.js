// Seed subscriptions for test/demo
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.subscription.upsert({
    where: { name: "Basic" },
    update: {},
    create: {
      name: "Basic",
      priceCents: 3900,
      feeBps: 700,
      durationDays: 365,
    },
  });
  await prisma.subscription.upsert({
    where: { name: "Pro" },
    update: {},
    create: {
      name: "Pro",
      priceCents: 9900,
      feeBps: 400,
      durationDays: 365,
    },
  });
  await prisma.subscription.upsert({
    where: { name: "Premium" },
    update: {},
    create: {
      name: "Premium",
      priceCents: 19900,
      feeBps: 200,
      durationDays: 365,
    },
  });
  console.log("Subscriptions seeded");
}

main().catch(e => { console.error(e); process.exit(1); });
