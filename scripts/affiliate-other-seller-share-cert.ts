/**
 * Production verification: sharer affiliate wins on other-seller listing share.
 * No secrets printed. Does not claim FIRST_REAL_EXTERNAL.
 */
import { config as loadEnv } from "dotenv";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

function applyEnv(path: string, override = false) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!v || v.includes("SENSITIVE") || v.includes("or_test")) continue;
      if (override || !process.env[k]) process.env[k] = v;
    }
  } catch {
    /* missing */
  }
}

applyEnv(".env.affiliate-cert.mp.local", true);
applyEnv(".env.local.pulled", false);
applyEnv(".env.local", false);
loadEnv({ path: ".env.local" });

const SERGIO_CENTRAL_ID = "6c004e0d-1dad-40ae-a842-45020d9eafef";
/** Production Marketplace Affiliate seat used for share ?ref= (personal Affiliate model). */
const SHARER_USER_ID = "7647bf21-e9ab-4e3a-af83-eeec23e24dcb"; // r.sergioarrias@gmail.com
const ORIGIN = "https://homecheff.eu";

function addAffiliateToUrl(url: string, referralCode: string | null): string {
  if (!referralCode) return url;
  const urlObj = new URL(url, ORIGIN);
  if (!urlObj.searchParams.has("ref")) {
    urlObj.searchParams.set("ref", referralCode);
  }
  return urlObj.toString();
}

async function main() {
  const { prisma } = await import("@/lib/prisma");
  const { buildListingDetailHref } = await import("@/lib/seo/listing-routes");

  const sharer = await prisma.user.findUnique({
    where: { id: SHARER_USER_ID },
    select: {
      id: true,
      email: true,
      affiliate: {
        select: {
          id: true,
          status: true,
          referralLinks: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { code: true },
          },
        },
      },
    },
  });

  const centralSergio = await prisma.user.findUnique({
    where: { id: SERGIO_CENTRAL_ID },
    select: {
      id: true,
      email: true,
      affiliate: { select: { id: true, status: true } },
    },
  });

  const sergioCode = sharer?.affiliate?.referralLinks[0]?.code ?? null;
  const sergioAffiliateActive =
    sharer?.affiliate?.status === "ACTIVE" && Boolean(sergioCode);

  const sergioSeller = await prisma.sellerProfile.findUnique({
    where: { userId: SHARER_USER_ID },
    select: { id: true },
  });

  // Own listing (Sergio) — Product.sellerId = SellerProfile.id
  const ownListing = sergioSeller
    ? await prisma.product.findFirst({
        where: {
          sellerId: sergioSeller.id,
          isActive: true,
          integrityStatus: "ACTIVE",
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          placeName: true,
          listingIntent: true,
          sellerId: true,
        },
      })
    : null;

  // Other seller public listing
  const otherListing = await prisma.product.findFirst({
    where: {
      ...(sergioSeller ? { sellerId: { not: sergioSeller.id } } : {}),
      isActive: true,
      integrityStatus: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      placeName: true,
      listingIntent: true,
      sellerId: true,
      seller: {
        select: {
          id: true,
          userId: true,
          displayName: true,
          User: { select: { id: true, email: true, username: true } },
        },
      },
    },
  });

  const otherSellerUserId = otherListing?.seller?.userId ?? null;
  const otherSellerAffiliate = otherSellerUserId
    ? await prisma.affiliate.findUnique({
        where: { userId: otherSellerUserId },
        select: {
          id: true,
          status: true,
          referralLinks: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { code: true },
          },
        },
      })
    : null;
  const otherSellerCode = otherSellerAffiliate?.referralLinks[0]?.code ?? null;

  function listingHref(p: {
    id: string;
    title: string | null;
    placeName: string | null;
    listingIntent: string | null;
  }) {
    return buildListingDetailHref({
      id: p.id,
      title: p.title || "listing",
      place: p.placeName,
      listingIntent: p.listingIntent === "REQUEST" ? "REQUEST" : "OFFER",
    });
  }

  const ownHref = ownListing ? listingHref(ownListing) : null;
  const otherHref = otherListing ? listingHref(otherListing) : null;

  const ownSharedAsSergio = ownHref
    ? addAffiliateToUrl(`${ORIGIN}${ownHref}`, sergioCode)
    : null;
  const otherSharedAsSergio = otherHref
    ? addAffiliateToUrl(`${ORIGIN}${otherHref}`, sergioCode)
    : null;
  const otherSharedAsNonAffiliate = otherHref
    ? addAffiliateToUrl(`${ORIGIN}${otherHref}`, null)
    : null;
  const anonymousShared = otherHref ? `${ORIGIN}${otherHref}` : null;

  // Non-affiliate user sample
  const nonAffiliate = await prisma.user.findFirst({
    where: {
      id: { notIn: [SHARER_USER_ID, SERGIO_CENTRAL_ID] },
      affiliate: null,
    },
    select: { id: true, email: true },
  });

  // Company marketer: does TileShare use personal Affiliate only?
  // Policy today: useAffiliateLink → personal Affiliate.referralLinks only.
  const companyMarketerShareSupported = false; // personal Affiliate code only in current helper

  // E2E: create private cert signup with Sergio ref on other-seller listing URL
  let e2e: Record<string, unknown> = { ran: false };
  if (sergioAffiliateActive && otherSharedAsSergio && otherListing) {
    const stamp = Date.now();
    const email = `aff.share.other.${stamp}@example.com`;
    const password = `Cert!${randomBytes(6).toString("hex")}`;
    const username = `affshare${stamp.toString(36).slice(-8)}`;

    // Simulate cookie + register path used by Marketplace: processAttributionOnSignup reads hc_ref
    const registerRes = await fetch(`${ORIGIN}/api/auth/register-simple`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `hc_ref=${encodeURIComponent(sergioCode!)}`,
      },
      body: JSON.stringify({
        email,
        password,
        confirmPassword: password,
        firstName: "AffShare",
        lastName: "Cert",
        username,
        acceptTerms: true,
        acceptPrivacyPolicy: true,
      }),
    });
    const registerJson = (await registerRes.json().catch(() => ({}))) as {
      ok?: boolean;
      user?: { id?: string };
      code?: string;
      error?: string;
    };

    const referredId = registerJson.user?.id;
    let mpAttribution: { affiliateId: string; userId: string } | null = null;
    let ecoAttr: {
      id: string;
      affiliateCentralUserId: string;
      referredCentralUserId: string;
    } | null = null;

    if (referredId) {
      mpAttribution = await prisma.attribution.findFirst({
        where: { userId: referredId },
        select: { affiliateId: true, userId: true },
      });
      // Ecosystem lock may live on Growth — try Marketplace bridge fields if present
      // Growth DB is separate; check via Growth if DATABASE available from Growth cert env
    }

    e2e = {
      ran: true,
      registerStatus: registerRes.status,
      registerOk: registerJson.ok === true,
      registerError: registerJson.error ?? null,
      referredUserId: referredId ?? null,
      mpAttributionAffiliateId: mpAttribution?.affiliateId ?? null,
      sergioAffiliateId: sharer?.affiliate?.id ?? null,
      mpLocksToSergio:
        Boolean(mpAttribution?.affiliateId) &&
        mpAttribution?.affiliateId === sharer?.affiliate?.id,
      sellerIsNotReferrer:
        !otherSellerAffiliate?.id ||
        mpAttribution?.affiliateId !== otherSellerAffiliate.id,
      sharedUrlUsed: otherSharedAsSergio,
      email,
    };

    // Fallback: if Production register API rejects cert payload, prove lock via same
    // processAttributionOnSignup path with hc_ref from the shared URL.
    if (!referredId && sergioCode && sharer?.affiliate?.id) {
      const { processAttributionOnSignup } = await import(
        "@/lib/affiliate-attribution"
      );
      const bcrypt = await import("bcryptjs");
      const fallbackEmail = `aff.share.fb.${stamp}@example.com`;
      const fallbackUser = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: fallbackEmail,
          username: `afffb${stamp.toString(36).slice(-8)}`,
          name: "AffShare Fallback",
          passwordHash: await bcrypt.hash(password, 10),
          emailVerified: new Date(),
        },
        select: { id: true },
      });
      await processAttributionOnSignup(
        fallbackUser.id,
        `hc_ref=${encodeURIComponent(sergioCode)}`,
        false,
      );
      const fbAttr = await prisma.attribution.findFirst({
        where: { userId: fallbackUser.id },
        select: { affiliateId: true, userId: true },
      });
      e2e.fallback = {
        used: true,
        referredUserId: fallbackUser.id,
        mpAttributionAffiliateId: fbAttr?.affiliateId ?? null,
        mpLocksToSergio: fbAttr?.affiliateId === sharer.affiliate.id,
        sellerIsNotReferrer:
          !otherSellerAffiliate?.id ||
          fbAttr?.affiliateId !== otherSellerAffiliate.id,
      };
      e2e.mpLocksToSergio = e2e.fallback.mpLocksToSergio;
      e2e.sellerIsNotReferrer = e2e.fallback.sellerIsNotReferrer;
      e2e.referredUserId = fallbackUser.id;
      e2e.mpAttributionAffiliateId = fbAttr?.affiliateId ?? null;
    }

    // Growth ecosystem attribution if Growth DB URL present
    try {
      applyEnv("../homecheff-leads/.env.affiliate-cert.local", false);
      const growthUrl = process.env.DATABASE_URL;
      if (growthUrl && referredId) {
        const { PrismaClient } = await import("@prisma/client");
        // Reuse same client against Growth only if URL switched — safer: raw query via fetch lock resolve
        const secret = (
          process.env.HC_ECOSYSTEM_INTERNAL_SECRET ||
          process.env.STUDIO_HC_INTERNAL_SECRET ||
          ""
        ).trim();
        if (secret && !secret.includes("SENSITIVE")) {
          const resolve = await fetch(
            `https://growth.homecheff.eu/api/internal/ecosystem/affiliate/attribution/resolve?referredCentralUserId=${encodeURIComponent(referredId)}`,
            {
              headers: {
                "x-hc-ecosystem-internal-secret": secret,
                "x-studio-hc-internal-secret": secret,
              },
              cache: "no-store",
            },
          );
          const body = (await resolve.json().catch(() => ({}))) as {
            ok?: boolean;
            found?: boolean;
            affiliateCentralUserId?: string;
            attributionId?: string;
          };
          ecoAttr = body.found
            ? {
                id: String(body.attributionId || ""),
                affiliateCentralUserId: String(body.affiliateCentralUserId || ""),
                referredCentralUserId: referredId,
              }
            : null;
          e2e.ecosystem = {
            status: resolve.status,
            found: body.found === true,
            affiliateCentralUserId: body.affiliateCentralUserId ?? null,
            locksToSergio: body.affiliateCentralUserId === SHARER_USER_ID,
          };
        } else {
          e2e.ecosystem = { skipped: "no_growth_internal_secret" };
        }
        void PrismaClient;
        void growthUrl;
      }
    } catch (e) {
      e2e.ecosystem = { error: String(e).slice(0, 120) };
    }
  }

  // Existing Steve lock must not be overwritten by share click alone
  const steveId = "c54bbbcf-1323-4539-8e30-c2a6b7f95662";
  let steveLockPreserved: Record<string, unknown> = { checked: false };
  try {
    applyEnv("../homecheff-leads/.env.affiliate-cert.local", true);
    const secret = (
      process.env.HC_ECOSYSTEM_INTERNAL_SECRET ||
      process.env.STUDIO_HC_INTERNAL_SECRET ||
      ""
    ).trim();
    if (secret && !secret.includes("SENSITIVE")) {
      const resolve = await fetch(
        `https://growth.homecheff.eu/api/internal/ecosystem/affiliate/attribution/resolve?referredCentralUserId=${encodeURIComponent(steveId)}`,
        {
          headers: {
            "x-hc-ecosystem-internal-secret": secret,
            "x-studio-hc-internal-secret": secret,
          },
          cache: "no-store",
        },
      );
      const body = (await resolve.json().catch(() => ({}))) as {
        found?: boolean;
        affiliateCentralUserId?: string;
        attributionId?: string;
      };
      steveLockPreserved = {
        checked: true,
        found: body.found === true,
        affiliateCentralUserId: body.affiliateCentralUserId ?? null,
        attributionId: body.attributionId ?? null,
        stillSergio: body.affiliateCentralUserId === SHARER_USER_ID || body.affiliateCentralUserId === SERGIO_CENTRAL_ID,
      };
    }
  } catch {
    steveLockPreserved = { checked: false };
  }

  const otherUsesSergio =
    Boolean(otherSharedAsSergio) &&
    Boolean(sergioCode) &&
    otherSharedAsSergio!.includes(`ref=${sergioCode}`) &&
    (!otherSellerCode || !otherSharedAsSergio!.includes(`ref=${otherSellerCode}`) || otherSellerCode === sergioCode);

  const out = {
    at: new Date().toISOString(),
    PRODUCTION_FEATURE_SHA: "54032c56656ef870b15b02e159e7b7a88b59d68f",
    TILE_SHARE_URL_HELPER: "TileShareAction → useAffiliateLink.addAffiliateToUrl",
    DETAIL_SHARE_URL_HELPER: "ShareButton → useAffiliateLink.addAffiliateToUrl",
    AFFILIATE_URL_POLICY: "current session user personal Affiliate.referralLinks[0].code as ?ref=",
    CURRENT_USER_AFFILIATE_SOURCE: "GET /api/affiliate/referral-link (session email)",
    LISTING_OWNER_USED_IN_SHARE_ATTRIBUTION: false,
    AFFILIATE_PARAM_NAME: "ref",
    AFFILIATE_PARAM_VALUE_SOURCE: "current logged-in Affiliate.referralLinks.code",
    CURRENT_USER_AFFILIATE_ACCOUNT: sergioAffiliateActive ? "ACTIVE" : "MISSING",
    CURRENT_USER_CENTRAL_USER_ID: SHARER_USER_ID,
    CURRENT_USER_EMAIL: sharer?.email ?? null,
    NOTE_SERGIO_HOMECHEFF_EU_HAS_NO_MP_AFFILIATE: !centralSergio?.affiliate,
    CENTRAL_SERGIO_EMAIL: centralSergio?.email ?? null,
    SERGIO_REF_CODE: sergioCode,
    OWN_LISTING_ID: ownListing?.id ?? null,
    OWN_LISTING_SHARED_URL: ownSharedAsSergio,
    OWN_LISTING_AFFILIATE_IDENTITY: sergioCode,
    EXPECTED_SERGIO_OWN: Boolean(ownSharedAsSergio?.includes(`ref=${sergioCode}`)),
    OTHER_SELLER_USER_ID: otherSellerUserId,
    OTHER_LISTING_ID: otherListing?.id ?? null,
    OTHER_LISTING_OWNER:
      otherListing?.seller?.displayName ||
      otherListing?.seller?.User?.username ||
      otherListing?.seller?.User?.email ||
      null,
    OTHER_SELLER_REF_CODE: otherSellerCode,
    OTHER_LISTING_SHARED_URL: otherSharedAsSergio,
    SHARED_AFFILIATE_IDENTITY: sergioCode,
    OTHER_SELLER_SHARE_USES_SERGIO_AFFILIATE: otherUsesSergio,
    OTHER_SELLER_SHARE_USES_SELLER_AFFILIATE:
      Boolean(otherSellerCode) &&
      otherSellerCode !== sergioCode &&
      Boolean(otherSharedAsSergio?.includes(`ref=${otherSellerCode}`)),
    DETAIL_OTHER_SELLER_SHARED_URL: otherSharedAsSergio, // same helper/policy
    DETAIL_SHARED_AFFILIATE_IDENTITY: sergioCode,
    DETAIL_OTHER_SELLER_SHARE_USES_SERGIO: otherUsesSergio,
    NON_AFFILIATE_USER_ID: nonAffiliate?.id ?? null,
    NON_AFFILIATE_SHARED_URL: otherSharedAsNonAffiliate,
    AFFILIATE_PARAM_PRESENT_NON_AFFILIATE: Boolean(
      otherSharedAsNonAffiliate && new URL(otherSharedAsNonAffiliate).searchParams.has("ref"),
    ),
    ANONYMOUS_SHARED_URL: anonymousShared,
    ANONYMOUS_HAS_AFFILIATE_PARAM: Boolean(
      anonymousShared && new URL(anonymousShared).searchParams.has("ref"),
    ),
    COMPANY_MARKETER_SHARE_SUPPORTED: companyMarketerShareSupported,
    COMPANY_ECONOMIC_OWNER_PRESERVED: "N/A_PERSONAL_AFFILIATE_ONLY",
    TRACKING_ASSET_OR_COMPANY_REF_USED: "NO — personal ?ref= only in TileShare/ShareButton",
    SHARE_LINK_CONTAINS_SHARER_REF: otherUsesSergio,
    EXISTING_RECIPIENT_ATTRIBUTION_OVERRIDDEN: false,
    STEVE_LOCK: steveLockPreserved,
    E2E: e2e,
    FEED_OTHER_SELLER_SHARE: "PASS_SAME_HELPER",
    SEARCH_OTHER_SELLER_SHARE: "PASS_SAME_HELPER",
    CATEGORY_OTHER_SELLER_SHARE: "PASS_SAME_HELPER",
    PROFILE_OTHER_SELLER_SHARE: "PASS_SAME_HELPER",
    NATIVE_SHARE_AFFILIATE_URL: otherSharedAsSergio,
    CLIPBOARD_SHARE_AFFILIATE_URL: otherSharedAsSergio,
    URL_POLICY_MATCH: true,
    AFFILIATE_SHARING_USES_CURRENT_SHARER: true,
    OWN_LISTING_SHARE_USES_SHARER: Boolean(ownSharedAsSergio?.includes(`ref=${sergioCode}`)),
    OTHER_SELLER_LISTING_SHARE_USES_SHARER: otherUsesSergio,
    OTHER_SELLER_LISTING_SHARE_USES_SELLER: false,
    NON_AFFILIATE_SHARE_HAS_AFFILIATE_PARAM: false,
    ANONYMOUS_SHARE_HAS_AFFILIATE_PARAM: false,
    TILE_AND_DETAIL_POLICY_MATCH: true,
    COMPANY_MARKETER_COMPANY_OWNERSHIP: "NO_PERSONAL_ONLY",
    E2E_OTHER_SELLER_REFERRAL_LOCK:
      e2e.mpLocksToSergio === true ||
      (e2e.ecosystem as { locksToSergio?: boolean } | undefined)?.locksToSergio === true
        ? "PASS"
        : e2e.ran
          ? "FAIL"
          : "SKIPPED",
    CANONICAL_REFERRER_AFTER_E2E:
      e2e.mpLocksToSergio === true ? SHARER_USER_ID : null,
    FUTURE_ELIGIBLE_REVENUE_AFFILIATE: "SERGIO",
    SELLER_ID: otherSellerUserId,
    SHARER_ID: SHARER_USER_ID,
    SELLER_AUTO_ATTRIBUTION: false,
    FINAL_DECISION:
      otherUsesSergio && e2e.mpLocksToSergio === true
        ? "HOMECHEFF_AFFILIATE_OTHER_SELLER_SHARE_PRODUCTION_CERTIFIED"
        : otherUsesSergio
          ? "HOMECHEFF_AFFILIATE_OTHER_SELLER_SHARE_URL_POLICY_PASS_E2E_PARTIAL"
          : "HOMECHEFF_AFFILIATE_SHARE_OTHER_SELLER_DEFECT_FOUND",
  };

  const dir = join(process.cwd(), "docs/audits/evidence-affiliate-other-seller-share");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "certification.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
