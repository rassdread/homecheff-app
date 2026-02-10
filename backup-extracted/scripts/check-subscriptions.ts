import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        SellerProfile: {
          select: {
            id: true,
            subscriptionValidUntil: true,
            User: {
              select: {
                email: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        priceCents: "asc",
      },
    });

    if (subscriptions.length === 0) {
      console.log("Geen abonnementen gevonden in de database.");
      return;
    }

    for (const subscription of subscriptions) {
      console.log("--------------------------------------------------");
      console.log(`ID          : ${subscription.id}`);
      console.log(`Naam        : ${subscription.name}`);
      console.log(`Prijs       : €${(subscription.priceCents / 100).toFixed(2)}`);
      console.log(`Fee (bps)   : ${subscription.feeBps}`);
      console.log(`Duur (dagen): ${subscription.durationDays}`);
      console.log(`Actief      : ${subscription.isActive ? "Ja" : "Nee"}`);
      console.log(`SellerProfiles gekoppeld: ${subscription.SellerProfile.length}`);

      if (subscription.SellerProfile.length > 0) {
        for (const seller of subscription.SellerProfile) {
          console.log(
            `  - SellerProfile ${seller.id} | gebruiker: ${seller.User?.email ?? seller.User?.username ?? "onbekend"} | geldig tot: ${
              seller.subscriptionValidUntil ?? "onbekend"
            }`
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Fout bij ophalen van abonnementen:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


