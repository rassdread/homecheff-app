/**
 * Production hygiene — SAFE hide/private only (no deletes, no ledger changes).
 *
 * APPLY_HYGIENE=YES npx tsx --env-file=.env.local scripts/hygiene-marketplace-safe-hide.ts
 */
import { PrismaClient } from "@prisma/client";

function redact(email: string | null | undefined): string {
  if (!email) return "(none)";
  const [u, d] = email.split("@");
  return `${(u ?? "?").slice(0, 1)}***@${(d ?? "?").slice(0, 1)}***.${(d ?? "").split(".").slice(-1)[0] ?? ""}`;
}

async function main() {
  const apply = process.env.APPLY_HYGIENE === "YES";
  const prisma = new PrismaClient();
  try {
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { endsWith: ".test", mode: "insensitive" } },
          { email: { contains: "homecheff.test", mode: "insensitive" } },
          { name: { contains: "e2e-", mode: "insensitive" } },
          { name: { contains: "MediaCert", mode: "insensitive" } },
          { name: { contains: "Cert Link", mode: "insensitive" } },
          { name: { contains: "legacy-cross", mode: "insensitive" } },
          { name: { contains: "legacy-g-only", mode: "insensitive" } },
          { name: { contains: "legacy-s-only", mode: "insensitive" } },
          { username: { equals: "MediaCertHC", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        showProfileToEveryone: true,
        role: true,
      },
    });

    const pilotListings = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: "Pilot", mode: "insensitive" } },
          { title: { contains: "AutoHC", mode: "insensitive" } },
          { title: { contains: "MediaCert", mode: "insensitive" } },
          { title: { contains: "test", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        integrityStatus: true,
        sellerId: true,
      },
    });

    console.log(
      JSON.stringify(
        {
          apply,
          testUsers: testUsers.map((u) => ({
            id: u.id.slice(0, 8),
            email: redact(u.email),
            name: u.name,
            username: u.username,
            showProfileToEveryone: u.showProfileToEveryone,
          })),
          pilotListings,
        },
        null,
        2,
      ),
    );

    if (!apply) {
      console.log("DRY_RUN only. Set APPLY_HYGIENE=YES to mutate.");
      return;
    }

    const hideIds = testUsers.map((u) => u.id);
    if (hideIds.length) {
      const r = await prisma.user.updateMany({
        where: { id: { in: hideIds } },
        data: { showProfileToEveryone: false },
      });
      console.log("HIDDEN_PROFILES", r.count);
    }

    const deactivate = pilotListings.filter(
      (p) => p.isActive || (p.integrityStatus && p.integrityStatus !== "REMOVED"),
    );
    for (const p of deactivate) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          isActive: false,
          ...(p.integrityStatus !== "REMOVED" ? { integrityStatus: "REMOVED" } : {}),
        },
      });
      console.log("LISTING_PRIVATE", p.id, p.title);
    }

    console.log("DONE");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
