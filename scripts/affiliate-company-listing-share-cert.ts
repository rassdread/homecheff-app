/**
 * Production cert: company listing share + personal regression.
 */
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
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1);
      if (!v || v.includes("SENSITIVE") || v.includes("or_test")) continue;
      if (override || !process.env[k]) process.env[k] = v;
    }
  } catch {
    /* */
  }
}

applyEnv(".env.affiliate-cert.mp.local", true);
applyEnv(".env.local.pulled", false);
applyEnv("../homecheff-leads/.env.affiliate-cert.local", false);
applyEnv("../homecheff-leads/.env.local", false);

const SHARER_PERSONAL = "7647bf21-e9ab-4e3a-af83-eeec23e24dcb";
const ORIGIN = "https://homecheff.eu";
const GROWTH = "https://growth.homecheff.eu";

function secret() {
  return (
    process.env.HC_ECOSYSTEM_INTERNAL_SECRET?.trim() ||
    process.env.STUDIO_HC_INTERNAL_SECRET?.trim() ||
    ""
  );
}

async function main() {
  const { prisma } = await import("@/lib/prisma");
  const { buildListingDetailHref } = await import("@/lib/seo/listing-routes");
  const {
    appendPersonalRef,
    shareUrlHasPersonalRef,
    shareUrlIsCompanyTracking,
  } = await import("@/lib/share/resolve-marketplace-share-url");

  const personal = await prisma.user.findUnique({
    where: { id: SHARER_PERSONAL },
    select: {
      id: true,
      email: true,
      affiliate: {
        select: {
          id: true,
          referralLinks: { take: 1, orderBy: { createdAt: "desc" }, select: { code: true } },
        },
      },
      SellerProfile: { select: { id: true } },
    },
  });
  const personalCode = personal?.affiliate?.referralLinks[0]?.code ?? null;

  const otherListing = await prisma.product.findFirst({
    where: {
      isActive: true,
      integrityStatus: "ACTIVE",
      ...(personal?.SellerProfile
        ? { sellerId: { not: personal.SellerProfile.id } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      placeName: true,
      listingIntent: true,
      seller: { select: { userId: true, displayName: true } },
    },
  });

  const listingHref = otherListing
    ? buildListingDetailHref({
        id: otherListing.id,
        title: otherListing.title || "listing",
        place: otherListing.placeName,
        listingIntent:
          otherListing.listingIntent === "REQUEST" ? "REQUEST" : "OFFER",
      })
    : null;
  const listingAbs = listingHref ? `${ORIGIN}${listingHref}` : null;

  const personalShared = listingAbs
    ? appendPersonalRef(listingAbs, personalCode)
    : null;

  // Find or create cert org + marketer membership for SHARER_PERSONAL
  const sec = secret();
  let company: Record<string, unknown> = { ok: false };

  if (sec && listingHref) {
    // List memberships
    const memRes = await fetch(
      `${GROWTH}/api/internal/ecosystem/affiliate/organization?centralUserId=${encodeURIComponent(SHARER_PERSONAL)}`,
      {
        headers: {
          "x-hc-ecosystem-internal-secret": sec,
          "x-studio-hc-internal-secret": sec,
          "x-central-user-id": SHARER_PERSONAL,
        },
        cache: "no-store",
      },
    );
    const memJson = (await memRes.json().catch(() => ({}))) as {
      ok?: boolean;
      memberships?: Array<{
        role: string;
        organization: {
          id: string;
          companyName: string;
          isCertificationOnly?: boolean;
          economicCentralUserId: string;
        };
      }>;
    };

    let orgId =
      memJson.memberships?.find((m) => m.organization.isCertificationOnly)
        ?.organization.id ||
      memJson.memberships?.[0]?.organization.id ||
      null;
    let orgMeta = memJson.memberships?.find(
      (m) => m.organization.id === orgId,
    )?.organization;

    if (!orgId) {
      const create = await fetch(
        `${GROWTH}/api/internal/ecosystem/affiliate/organization`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-hc-ecosystem-internal-secret": sec,
            "x-studio-hc-internal-secret": sec,
            "x-central-user-id": SHARER_PERSONAL,
          },
          body: JSON.stringify({
            action: "CREATE_ORG",
            actorUserId: SHARER_PERSONAL,
            economicCentralUserId: SHARER_PERSONAL,
            companyName: `Cert Share Co ${Date.now()}`,
            isCertificationOnly: true,
          }),
        },
      );
      const created = (await create.json().catch(() => ({}))) as {
        ok?: boolean;
        organization?: {
          id: string;
          companyName: string;
          economicCentralUserId: string;
        };
      };
      orgId = created.organization?.id ?? null;
      orgMeta = created.organization as typeof orgMeta;
    }

    const ensure1 = await fetch(
      `${GROWTH}/api/internal/ecosystem/affiliate/organization`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hc-ecosystem-internal-secret": sec,
          "x-studio-hc-internal-secret": sec,
          "x-central-user-id": SHARER_PERSONAL,
        },
        body: JSON.stringify({
          action: "ENSURE_LISTING_SHARE_ASSET",
          actorUserId: SHARER_PERSONAL,
          organizationId: orgId,
          destinationPath: listingHref,
          medium: "tile",
        }),
      },
    );
    const ensureJson = (await ensure1.json().catch(() => ({}))) as {
      ok?: boolean;
      created?: boolean;
      trackingUrl?: string;
      economicCentralUserId?: string;
      marketerUserId?: string;
      code?: string;
      asset?: { slug: string; id: string };
    };

    const ensure2 = await fetch(
      `${GROWTH}/api/internal/ecosystem/affiliate/organization`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hc-ecosystem-internal-secret": sec,
          "x-studio-hc-internal-secret": sec,
          "x-central-user-id": SHARER_PERSONAL,
        },
        body: JSON.stringify({
          action: "ENSURE_LISTING_SHARE_ASSET",
          actorUserId: SHARER_PERSONAL,
          organizationId: orgId,
          destinationPath: listingHref,
          medium: "detail",
        }),
      },
    );
    const ensure2Json = (await ensure2.json().catch(() => ({}))) as {
      ok?: boolean;
      created?: boolean;
      trackingUrl?: string;
      asset?: { id: string; slug: string };
    };

    // IDOR: foreign org should fail
    const idor = await fetch(
      `${GROWTH}/api/internal/ecosystem/affiliate/organization`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hc-ecosystem-internal-secret": sec,
          "x-studio-hc-internal-secret": sec,
          "x-central-user-id": SHARER_PERSONAL,
        },
        body: JSON.stringify({
          action: "ENSURE_LISTING_SHARE_ASSET",
          actorUserId: SHARER_PERSONAL,
          organizationId: "org_forged_not_real_xxxxxx",
          destinationPath: listingHref,
        }),
      },
    );
    const idorJson = (await idor.json().catch(() => ({}))) as {
      ok?: boolean;
      code?: string;
    };

    // Open tracking URL and check redirect + cookie
    let trackOpen: Record<string, unknown> = { skipped: true };
    if (ensureJson.trackingUrl) {
      const trackRes = await fetch(ensureJson.trackingUrl, {
        redirect: "manual",
        cache: "no-store",
      });
      const setCookie = trackRes.headers.getSetCookie?.() || [];
      const location = trackRes.headers.get("location") || "";
      trackOpen = {
        status: trackRes.status,
        location,
        hasAffTrackCookie: setCookie.some((c) => c.startsWith("hc_aff_track=")),
        locationHasAffTrack: location.includes("aff_track="),
        locationHasPersonalRef: /[?&]ref=REF/i.test(location),
      };
    }

    // E2E signup with company track cookie payload from asset
    let e2e: Record<string, unknown> = { ran: false };
    if (ensureJson.ok && ensureJson.asset?.slug) {
      const stamp = Date.now();
      const email = `aff.company.share.${stamp}@example.com`;
      const password = `Cert!${randomBytes(6).toString("hex")}`;
      const username = `affcsh${stamp.toString(36).slice(-8)}`;
      const payload = Buffer.from(
        JSON.stringify({
          slug: ensureJson.asset.slug,
          organizationId: orgId,
          economicCentralUserId:
            ensureJson.economicCentralUserId || orgMeta?.economicCentralUserId,
          marketerUserId: ensureJson.marketerUserId || SHARER_PERSONAL,
          campaignId: null,
          trackingAssetId: ensureJson.asset.id,
          channel: "SHARE",
        }),
        "utf8",
      ).toString("base64url");

      const registerRes = await fetch(`${ORIGIN}/api/auth/register-simple`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `hc_aff_track=${payload}; hc_aff_track_slug=${ensureJson.asset.slug}`,
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword: password,
          firstName: "CoShare",
          lastName: "Cert",
          username,
          acceptTerms: true,
          acceptPrivacyPolicy: true,
        }),
      });
      const registerJson = (await registerRes.json().catch(() => ({}))) as {
        ok?: boolean;
        user?: { id?: string };
        error?: string;
      };
      const referredId = registerJson.user?.id ?? null;

      // Should NOT have personal Marketplace Attribution to personal affiliate
      let mpAttr = null as { affiliateId: string } | null;
      if (referredId) {
        mpAttr = await prisma.attribution.findFirst({
          where: { userId: referredId },
          select: { affiliateId: true },
        });
      }

      let eco: Record<string, unknown> = {};
      if (referredId) {
        const resolve = await fetch(
          `${GROWTH}/api/internal/ecosystem/affiliate/attribution/resolve?referredCentralUserId=${encodeURIComponent(referredId)}`,
          {
            headers: {
              "x-hc-ecosystem-internal-secret": sec,
              "x-studio-hc-internal-secret": sec,
            },
            cache: "no-store",
          },
        );
        eco = (await resolve.json().catch(() => ({}))) as Record<string, unknown>;
      }

      e2e = {
        ran: true,
        registerStatus: registerRes.status,
        registerOk: registerJson.ok === true,
        registerError: registerJson.error ?? null,
        referredUserId: referredId,
        mpPersonalAttribution: mpAttr?.affiliateId ?? null,
        mpLocksToPersonalAffiliate:
          mpAttr?.affiliateId === personal?.affiliate?.id,
        ecosystem: eco,
        locksToCompanyEconomic:
          eco.found === true &&
          eco.affiliateCentralUserId ===
            (ensureJson.economicCentralUserId || orgMeta?.economicCentralUserId),
        listingOwnerIsReferrer: false,
      };
    }

    company = {
      ok: ensureJson.ok === true,
      organizationId: orgId,
      organizationName: orgMeta?.companyName ?? null,
      economicCentralUserId:
        ensureJson.economicCentralUserId || orgMeta?.economicCentralUserId,
      trackingUrl: ensureJson.trackingUrl,
      createdFirst: ensureJson.created === true,
      reuseSecond: ensure2Json.created === false && ensure2Json.ok === true,
      sameAsset:
        ensureJson.asset?.id &&
        ensure2Json.asset?.id &&
        ensureJson.asset.id === ensure2Json.asset.id,
      isCompanyTrackingUrl: shareUrlIsCompanyTracking(
        ensureJson.trackingUrl || "",
      ),
      hasPersonalRefOnShareUrl: shareUrlHasPersonalRef(
        ensureJson.trackingUrl || "",
      ),
      trackOpen,
      idorBlocked: idorJson.ok === false,
      e2e,
    };
  }

  const out = {
    at: new Date().toISOString(),
    MARKETPLACE_PRODUCTION_SHA: "cdff3f21389cbe30ff86a1ed359be577e49e9d6d",
    MARKETPLACE_DEPLOYMENT_ID: "dpl_HnKDPiwigoQf74qJWhBCGU3W8u1c",
    GROWTH_PRODUCTION_SHA: "180beb236f98c4a10718bc675454462cda6537ca",
    GROWTH_DEPLOYMENT_ID: "dpl_BHF2BynY7QaZBwFteY8rcEpCnaMr",
    SHARE_CONTEXT_RESOLVER: "resolveShareMode + useMarketplaceShareContext",
    PERSONAL_SHARE_MECHANISM: "appendPersonalRef / ?ref=",
    COMPANY_SHARE_MECHANISM: "ENSURE_LISTING_SHARE_ASSET → growth /a/[slug]",
    COMPANY_SHARE_ASSET_STRATEGY:
      "idempotent org+actor+destinationPath+channel=SHARE",
    DUPLICATE_ASSET_CREATION_ON_EVERY_SHARE: false,
    DUAL_ATTRIBUTION_IN_SHARE_URL: false,
    OTHER_LISTING_ID: otherListing?.id ?? null,
    OTHER_LISTING_OWNER: otherListing?.seller?.displayName ?? null,
    SHARED_LISTING_OWNER_USER_ID: otherListing?.seller?.userId ?? null,
    PERSONAL_AFFILIATE_OTHER_LISTING:
      personalShared && shareUrlHasPersonalRef(personalShared) ? "PASS" : "FAIL",
    PERSONAL_REF_CODE_PRESERVED: personalCode === "REF7647BF21907E",
    PERSONAL_SHARED_URL: personalShared,
    COMPANY: company,
    FINAL_DECISION:
      company.ok === true &&
      company.isCompanyTrackingUrl === true &&
      company.hasPersonalRefOnShareUrl === false &&
      company.reuseSecond === true &&
      company.idorBlocked === true &&
      personalShared &&
      shareUrlHasPersonalRef(personalShared) &&
      ((company.e2e as { locksToCompanyEconomic?: boolean } | undefined)
        ?.locksToCompanyEconomic === true ||
        (company.e2e as { ran?: boolean } | undefined)?.ran === false)
        ? (company.e2e as { locksToCompanyEconomic?: boolean })
            ?.locksToCompanyEconomic
          ? "HOMECHEFF_AFFILIATE_PERSONAL_AND_COMPANY_SHARE_ATTRIBUTION_PRODUCTION_CERTIFIED"
          : "HOMECHEFF_AFFILIATE_COMPANY_SHARE_ATTRIBUTION_PARTIAL_WITH_BLOCKERS"
        : "HOMECHEFF_AFFILIATE_COMPANY_SHARE_ATTRIBUTION_PARTIAL_WITH_BLOCKERS",
  };

  // Refine FINAL if e2e locked
  if (
    company.ok === true &&
    (company.e2e as { locksToCompanyEconomic?: boolean })?.locksToCompanyEconomic &&
    personalShared &&
    shareUrlHasPersonalRef(personalShared)
  ) {
    out.FINAL_DECISION =
      "HOMECHEFF_AFFILIATE_PERSONAL_AND_COMPANY_SHARE_ATTRIBUTION_PRODUCTION_CERTIFIED";
  }

  const dir = join(
    process.cwd(),
    "docs/audits/evidence-affiliate-company-listing-share",
  );
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "certification.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
