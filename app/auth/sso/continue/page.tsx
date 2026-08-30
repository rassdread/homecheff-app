/**
 * SP.2B.3 — Account confirmation before issuing SSO code.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SsoError } from "@/lib/identity/sso/constants";
import { isCentralSsoEnabled } from "@/lib/identity/sso/flags";
import {
  readSsoStartParams,
  ssoStartRelativePath,
} from "@/lib/identity/sso/start-params";

export const dynamic = "force-dynamic";

function productLabel(product: string): string {
  if (product === "studio") return "HomeCheff Studio";
  if (product === "growth") return "HomeCheff Growth";
  return "this product";
}

export default async function SsoContinuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isCentralSsoEnabled()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold">Sign-in unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600">HomeCheff SSO is not enabled.</p>
      </main>
    );
  }

  const raw = await searchParams;
  const url = new URL("https://homecheff.local/auth/sso/continue");
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") url.searchParams.set(k, v);
    else if (Array.isArray(v) && v[0]) url.searchParams.set(k, v[0]);
  }

  let params;
  try {
    params = readSsoStartParams(url);
  } catch (err) {
    const code = err instanceof SsoError ? err.code : "INVALID_REQUEST";
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold">Invalid sign-in request</h1>
        <p className="mt-2 text-sm text-zinc-600">{code}</p>
        <Link href="/login" className="mt-4 inline-block text-emerald-700 underline">
          Back to login
        </Link>
      </main>
    );
  }

  const session = await auth();
  const user = session?.user as
    | { id?: string; name?: string | null; email?: string | null; image?: string | null }
    | undefined;

  if (!user?.id) {
    redirect(ssoStartRelativePath(params));
  }

  const displayName = (user.name?.trim() || user.email?.trim() || "your account").toString();
  const email = user.email?.trim() || null;
  const isClaim = params.interaction === "claim";
  const startPath = ssoStartRelativePath(params);
  const confirmQs = new URLSearchParams({
    product: params.product,
    redirect_uri: params.redirectUri,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: params.codeChallengeMethod,
    interaction: params.interaction,
  });
  if (params.loginHint) confirmQs.set("login_hint", params.loginHint);
  const confirmHref = `/auth/sso/continue/confirm?${confirmQs.toString()}`;
  const switchHref = `/auth/sso/switch?return=${encodeURIComponent(startPath)}`;
  let cancelHref = "/";
  try {
    const dest = new URL(params.redirectUri);
    dest.pathname = "/login";
    dest.search = "";
    dest.hash = "";
    cancelHref = dest.toString();
  } catch {
    cancelHref = "/";
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-sm font-semibold tracking-wide text-emerald-800">HomeCheff</p>
        <p className="mt-1 text-xs tracking-wide text-emerald-800/80">Everybody Eats.</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          {isClaim ? "Bevestig HomeCheff-account" : "Doorgaan met dit HomeCheff-account?"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {isClaim
            ? `Je koppelt ${productLabel(params.product)} aan dit HomeCheff-account. Bevestig dat dit klopt.`
            : `Je bent al ingelogd bij HomeCheff. Open ${productLabel(params.product)} als dit account, of kies een ander account.`}
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            HomeCheff account
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{displayName}</p>
          {email && email !== displayName ? (
            <p className="mt-1 text-sm text-zinc-600">{email}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={confirmHref}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {isClaim ? "Continue with this account" : `Continue as ${displayName}`}
          </a>
          <a
            href={switchHref}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Use another account
          </a>
          <a href={cancelHref} className="text-center text-sm text-zinc-500 underline">
            Cancel
          </a>
        </div>
      </div>
    </main>
  );
}
