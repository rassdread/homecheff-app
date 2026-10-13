/**
 * Cron authorization and a Growth outage on the local Marketplace database only.
 */
import { prisma } from "../lib/prisma";
import { retryPendingCampaignGrant } from "../lib/hc/qualify-first-listing";
import { GET as cronGet } from "../app/api/cron/hc-campaign-grant-retry/route";

const USER = "11111111-1111-4111-8111-111111111111";

function assertSafe() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (url.hostname !== "127.0.0.1" || url.pathname !== "/hc_v6_mkt") {
    throw new Error(`refusing ${url.hostname}${url.pathname}`);
  }
  if ((process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_")) throw new Error("refusing live stripe key");
}

async function main() {
  assertSafe();
  await prisma.user.update({
    where: { id: USER },
    data: {
      hcCampaignCode: "V6OUTAGE",
      hcCampaignGrantPending: true,
      hcCampaignGrantAttemptAt: null,
      firstValidListingAt: new Date("2026-10-13T00:00:00Z"),
      firstValidListingProductId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    },
  });
  await retryPendingCampaignGrant(USER);
  const afterOutage = await prisma.user.findUniqueOrThrow({
    where: { id: USER },
    select: { hcCampaignGrantPending: true },
  });
  if (!afterOutage.hcCampaignGrantPending) throw new Error("outage cleared the pending reward");

  const denied = await cronGet(new Request("http://127.0.0.1/api/cron/hc-campaign-grant-retry"));
  if (denied.status !== 401) throw new Error(`cron without secret returned ${denied.status}`);
  const allowed = await cronGet(
    new Request("http://127.0.0.1/api/cron/hc-campaign-grant-retry", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }),
  );
  const body = (await allowed.json()) as { retried?: number; failed?: number };
  const still = await prisma.user.findUniqueOrThrow({
    where: { id: USER },
    select: { hcCampaignGrantPending: true },
  });
  if (!still.hcCampaignGrantPending) throw new Error("cron granted during the outage");
  console.log(JSON.stringify({ outagePending: true, unauthorized: denied.status, cron: allowed.status, ...body }));
  console.log("CRON_OUTAGE_OK");
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
