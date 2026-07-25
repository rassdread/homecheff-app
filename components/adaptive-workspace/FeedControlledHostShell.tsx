/**
 * Phase 3B.3.1 — Dormant Feed Controlled Host Shell.
 *
 * Always returns null. Does not import Feed component modules.
 * No effects, state, observers, timers, requests, or DOM.
 * Host activation is not possible in this phase.
 */

import type { ControlledFeedHostContract } from "@/lib/adaptive-workspace";

export type FeedControlledHostShellProps = {
  /** Validated dormant host contract (metadata only). */
  contract: ControlledFeedHostContract;
};

/**
 * Dormant shell — output is always null regardless of props.
 * Does not validate on render (validation is pure / offline).
 */
export default function FeedControlledHostShell(
  _props: FeedControlledHostShellProps,
): null {
  return null;
}
