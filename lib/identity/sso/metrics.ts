/**
 * Phase I.2 — structured SSO metrics (no PII labels).
 */

type Counter = Map<string, number>;

const counters: Counter = new Map();
const latencies: number[] = [];

function inc(name: string, n = 1) {
  counters.set(name, (counters.get(name) ?? 0) + n);
}

export const ssoMetrics = {
  authorizeTotal: () => inc("sso_authorize_total"),
  authorizeFailed: () => inc("sso_authorize_failed"),
  exchangeTotal: () => inc("sso_exchange_total"),
  exchangeSuccess: () => inc("sso_exchange_success"),
  exchangeFailed: () => inc("sso_exchange_failed"),
  replayRejected: () => inc("sso_replay_rejected"),
  clientRejected: () => inc("sso_client_rejected"),
  exchangeLatency(ms: number) {
    latencies.push(ms);
    if (latencies.length > 200) latencies.shift();
  },
  snapshot() {
    return {
      counters: Object.fromEntries(counters),
      exchangeLatencySampleCount: latencies.length,
      exchangeLatencyLastMs: latencies[latencies.length - 1] ?? null,
    };
  },
  resetForTests() {
    counters.clear();
    latencies.length = 0;
  },
};

export function logSsoEvent(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined>,
): void {
  // Structured log line — never log secrets, raw codes, or emails
  const safe: Record<string, unknown> = { event };
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    if (/secret|password|code$|token|email/i.test(k) && typeof v === "string" && v.length > 12) {
      continue;
    }
    safe[k] = v;
  }
  console.info(JSON.stringify(safe));
}
