/**
 * Phase 3B.3.2 — Dormant Feed Controlled Host Shell (shadow placement).
 *
 * Always returns null. Does not import Feed component modules.
 * No effects, state, observers, timers, requests, or DOM.
 * Placed as a sibling AFTER the legacy GeoFeed mount to preserve React identity.
 * Host activation is not possible in this phase.
 */

import type { ControlledFeedHostContract } from "@/lib/adaptive-workspace";
import type { ControlledFeedHostShadowPlacement } from "@/lib/adaptive-workspace/sealed/controlled-feed-host-shadow-placement";

export type FeedControlledHostShellProps = {
  /** Validated dormant host contract (metadata only). */
  contract: ControlledFeedHostContract;
  /** Phase 3B.3.2 shadow placement registration (metadata only). */
  placement?: ControlledFeedHostShadowPlacement;
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
