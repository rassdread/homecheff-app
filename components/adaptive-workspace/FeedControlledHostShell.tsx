/**
 * Feed Controlled Host Shell — dormant metadata + optional visible host chrome.
 *
 * OFF / SHADOW: returns null (exact legacy zero-DOM sibling after GeoFeed).
 * PREVIEW / ON (when layoutVisible): renders a visible host authority marker
 * and optional landscape outer shell. Does not own GeoFeed requests.
 */

import type { ReactNode } from "react";
import type { ControlledFeedHostContract } from "@/lib/adaptive-workspace";
import type { ControlledFeedHostShadowPlacement } from "@/lib/adaptive-workspace/sealed/controlled-feed-host-shadow-placement";
import type { ControlledHostDescriptor } from "@/lib/adaptive-workspace/sealed/controlled-host-registry";
import type { FeedWorkspaceVisibilityMode } from "@/lib/adaptive-workspace-react";

export type FeedControlledHostShellProps = {
  /** Validated dormant host contract (metadata only). */
  contract: ControlledFeedHostContract;
  /** Phase 3B.3.2 shadow placement registration (metadata only). */
  placement?: ControlledFeedHostShadowPlacement;
  /** Phase 3B.3.3 host registry descriptor (metadata only). */
  hostDescriptor?: ControlledHostDescriptor;
  /** Visibility presentation mode (layout only — not host ACTIVE auth). */
  visibilityMode?: FeedWorkspaceVisibilityMode;
  /**
   * True when PREVIEW query authorized or mode=on.
   * When false, shell stays null even if mode is preview.
   */
  layoutVisible?: boolean;
  /**
   * Optional landscape / outer composed children (single GeoFeed + panels).
   * Only rendered when layoutVisible.
   */
  children?: ReactNode;
};

/**
 * OFF/SHADOW → null.
 * PREVIEW/ON + layoutVisible → visible host chrome (and optional children).
 */
export default function FeedControlledHostShell(
  props: FeedControlledHostShellProps,
): ReactNode {
  const mode = props.visibilityMode ?? "off";
  const layoutVisible = Boolean(props.layoutVisible);

  if (mode === "off" || mode === "shadow" || !layoutVisible) {
    return null;
  }

  return (
    <div
      data-aw-feed-controlled-host=""
      data-aw-visibility-mode={mode}
      data-aw-host-activation={String(props.contract.hostActivation)}
      data-aw-render-activation={String(props.contract.renderActivation)}
      data-aw-layout-authority="workspace-presentation"
      data-aw-feed-data-owner="geofeed"
      className="contents"
    >
      {props.children ?? (
        <span
          data-aw-feed-host-marker=""
          className="sr-only"
          aria-hidden="true"
        >
          Adaptive Workspace feed host (presentation)
        </span>
      )}
    </div>
  );
}
