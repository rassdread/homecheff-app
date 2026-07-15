#!/usr/bin/env node
/**
 * Preview credentials session probe — safe diagnostics only (no secrets, no real credentials).
 *
 * Usage:
 *   node scripts/probe-preview-credentials-session.mjs [baseUrl]
 *
 * Checks:
 * - deployment reachable (or SSO redirect documented)
 * - /api/auth/providers exposes credentials
 * - /api/auth/csrf returns token
 * - /api/debug-session authOrigin diagnostics
 * - Google sign-in URL host matches preview host (when reachable)
 */
const baseUrl = (process.argv[2] || 'https://homecheff-app-git-performance-0f5539-sergio-s-projects-f7b64ee1.vercel.app').replace(/\/$/, '');

async function fetchSafe(path, opts = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...opts,
    headers: { 'User-Agent': 'HomeCheffPreviewAuthProbe/1.0', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, headers: res.headers, text: text.slice(0, 500), json };
}

const out = {
  measuredAt: new Date().toISOString(),
  baseUrl,
  reachable: false,
  ssoProtected: false,
  providers: null,
  csrf: null,
  debugSession: null,
  googleSignInHost: null,
  issues: [],
};

const home = await fetchSafe('/');
if (home.status === 302 && home.headers.get('location')?.includes('vercel.com/sso-api')) {
  out.ssoProtected = true;
  out.issues.push('Vercel Deployment Protection SSO — automated probe cannot reach app; use manual browser test');
} else if (home.status >= 200 && home.status < 400) {
  out.reachable = true;
} else {
  out.issues.push(`home status ${home.status}`);
}

const providers = await fetchSafe('/api/auth/providers');
if (providers.json) {
  out.providers = {
    status: providers.status,
    hasCredentials: Boolean(providers.json.credentials),
    hasGoogle: Boolean(providers.json.google),
  };
} else if (providers.status === 302) {
  out.issues.push('providers endpoint SSO-redirected');
}

const csrf = await fetchSafe('/api/auth/csrf');
if (csrf.json?.csrfToken) {
  out.csrf = { status: csrf.status, hasToken: true };
} else {
  out.issues.push(`csrf missing (${csrf.status})`);
}

const debug = await fetchSafe('/api/debug-session');
if (debug.json?.authOrigin) {
  out.debugSession = {
    status: debug.status,
    requestHost: debug.json.requestHost,
    authOrigin: debug.json.authOrigin,
    cookiePresent: debug.json.cookiePresent,
    hasSession: debug.json.hasSession,
  };
  const canonicalHost = debug.json.authOrigin?.canonicalAuthOriginHost;
  const requestHost = debug.json.requestHost;
  if (canonicalHost && requestHost && canonicalHost !== requestHost) {
    out.issues.push(`canonical host ${canonicalHost} != request ${requestHost}`);
  }
} else if (debug.status === 302) {
  out.issues.push('debug-session SSO-redirected');
}

if (out.providers?.hasGoogle) {
  const signIn = await fetchSafe('/api/auth/signin/google', { method: 'GET' });
  const loc = signIn.headers.get('location') || '';
  try {
    out.googleSignInHost = loc ? new URL(loc).hostname : null;
  } catch {
    out.googleSignInHost = null;
  }
  if (out.googleSignInHost && !out.googleSignInHost.includes('accounts.google.com')) {
    out.issues.push(`unexpected google sign-in redirect host: ${out.googleSignInHost}`);
  }
}

out.pass = out.issues.length === 0 || (out.ssoProtected && out.issues.length === 1);
console.log(JSON.stringify(out, null, 2));
process.exit(out.pass ? 0 : 1);
