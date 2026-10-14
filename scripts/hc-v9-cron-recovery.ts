/**
 * Outage, real backoff, then one cron grant. Local databases only.
 */
import { NextRequest } from "next/server";

import { prisma } from "../lib/prisma";
import { retryPendingCampaignGrant } from "../lib/hc/qualify-first-listing";
import { GET as cronGet } from "../app/api/cron/hc-campaign-grant-retry/route";

const USER = "22222222-2222-4222-8222-222222222222";
const PRODUCT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab";

function assertSafe() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (url.hostname !== "127.0.0.1" || url.pathname !== "/hc_v6_mkt") throw new Error(`refusing ${url.hostname}${url.pathname}`);
  if ((process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_")) throw new Error("refusing live stripe key");
  const growth = process.env.GROWTH_HC_QUOTE_BASE_URL ?? "";
  if (!growth.startsWith("http://127.0.0.1:")) throw new Error(`refusing growth ${growth}`);
}

async function ensureUser(code: string) {
  await prisma.user.upsert({
    where: { id: USER },
    create: { id: USER, email: "v9-cron@example.test", updatedAt: new Date() },
    update: { email: "v9-cron@example.test" },
  });
  await prisma.user.update({
    where: { id: USER },
    data: {
      hcCampaignCode: code,
      hcCampaignGrantPending: true,
      hcCampaignGrantAttemptAt: null,
      firstValidListingAt: new Date("2026-10-13T00:00:00Z"),
      firstValidListingProductId: PRODUCT,
      emailVerified: new Date(),
    },
  });
}

async function main() {
  assertSafe();
  const code = process.env.V9_PROMO_CODE ?? "";
  if (!/^[A-Z0-9]{4,32}$/.test(code)) throw new Error("promo code missing");
  await ensureUser(code);
  const outageUrl = "http://127.0.0.1:9";
  process.env.GROWTH_HC_QUOTE_BASE_URL = outageUrl;
  await retryPendingCampaignGrant(USER);
  const pending = await prisma.user.findUniqueOrThrow({
    where: { id: USER },
    select: { hcCampaignGrantPending: true },
  });
  if (!pending.hcCampaignGrantPending) throw new Error("outage cleared the pending reward");
  await new Promise((resolve) => setTimeout(resolve, 125_000));
  process.env.GROWTH_HC_QUOTE_BASE_URL = "http://127.0.0.1:4017";
  const [direct, cron] = await Promise.all([
    retryPendingCampaignGrant(USER),
    cronGet(new NextRequest("http://127.0.0.1/api/cron/hc-campaign-grant-retry", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })),
  ]);
  const body = (await cron.json()) as { retried?: number; failed?: number; scanned?: number };
  const after = await prisma.user.findUniqueOrThrow({
    where: { id: USER },
    select: { hcCampaignGrantPending: true },
  });
  if (after.hcCampaignGrantPending) throw new Error("pending was not closed");
  console.log(JSON.stringify({ outageKeptPending: true, direct: direct ?? null, cron: cron.status, ...body }));
  console.log("CRON_RECOVERY_OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.user.update({
      where: { id: USER },
      data: {
        hcCampaignCode: null,
        hcCampaignGrantPending: false,
        hcCampaignGrantAttemptAt: null,
        firstValidListingAt: null,
        firstValidListingProductId: null,
      },
    }).catch(() => undefined);
    await prisma.$disconnect();
  });
