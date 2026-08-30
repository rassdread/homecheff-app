/**
 * U5 — subdomain trust certification for parent-domain auth signals.
 * Generated from live DNS + Vercel inspect (2026-08-30).
 */

export type SubdomainTrustRow = {
  host: string;
  dns: string;
  hosting: string;
  project: string;
  authTrusted: boolean;
  takeoverRisk: "none" | "low" | "medium" | "high";
  notes: string;
};

export const SUBDOMAIN_TRUST_INVENTORY: readonly SubdomainTrustRow[] = [
  {
    host: "homecheff.eu",
    dns: "A → Vercel",
    hosting: "Vercel",
    project: "homecheff-app",
    authTrusted: true,
    takeoverRisk: "none",
    notes: "Canonical IdP / Marketplace",
  },
  {
    host: "www.homecheff.eu",
    dns: "CNAME cname.vercel-dns.com",
    hosting: "Vercel",
    project: "homecheff-app",
    authTrusted: true,
    takeoverRisk: "none",
    notes: "www alias",
  },
  {
    host: "growth.homecheff.eu",
    dns: "CNAME vercel-dns-016",
    hosting: "Vercel",
    project: "homecheff-growth",
    authTrusted: true,
    takeoverRisk: "none",
    notes: "Growth product",
  },
  {
    host: "studio.homecheff.eu",
    dns: "CNAME vercel-dns-016",
    hosting: "Vercel",
    project: "homecheff-motion",
    authTrusted: true,
    takeoverRisk: "none",
    notes: "Studio product",
  },
  {
    host: "motion.homecheff.eu",
    dns: "CNAME vercel-dns-016 (same as Studio)",
    hosting: "Vercel",
    project: "homecheff-motion",
    authTrusted: true,
    takeoverRisk: "none",
    notes: "Studio alias",
  },
  {
    host: "shops.homecheff.eu",
    dns: "CNAME cname.vercel-dns.com",
    hosting: "Vercel",
    project: "homecheff-shops",
    authTrusted: true,
    takeoverRisk: "low",
    notes:
      "Legacy HomeCheff-owned project (165d deploy). Receives Domain=.homecheff.eu cookies already (NextAuth). Keep owned; do not abandon DNS.",
  },
  {
    host: "auth.homecheff.eu / login / app / api / staging / mail",
    dns: "no records",
    hosting: "n/a",
    project: "n/a",
    authTrusted: false,
    takeoverRisk: "none",
    notes: "No dangling CNAME — not takeover-exposed until records appear",
  },
] as const;

/** PASS when all Domain=.homecheff.eu recipients are HomeCheff-owned and no dangling CNAMEs. */
export const PARENT_DOMAIN_AUTH_TRUST_READY = true as const;
