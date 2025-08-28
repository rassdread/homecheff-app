const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: "demo-user" },
    update: {},
    create: {
      id: "demo-user",
      email: "demo@homecheff.app",
      name: "Demo User",
      place: "Rotterdam, NL",
      lat: 51.9244,
      lng: 4.4777,
    },
  });
  console.log("Seed klaar: demo-user");
}

main().finally(() => prisma.$disconnect());
