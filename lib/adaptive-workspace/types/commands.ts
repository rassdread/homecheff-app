import type { PanelMode, RegionId } from "./workspace";

/** Pure command contract — no dispatcher in Phase 2A. */
export type WorkspaceCommand =
  | {
      type: "SET_PRESENTATION";
      widgetId: string;
      mode: PanelMode;
      sizeHint?: { widthPx?: number; heightPx?: number };
    }
  | { type: "SET_VISIBILITY"; widgetId: string; visible: boolean }
  | { type: "REQUEST_FOCUS"; widgetId: string }
  | { type: "PREPARE_TRANSITION"; intent: string }
  | { type: "RESTORE_FOCUS"; targetWidgetId?: string };

/** Pure event contract — payloads MUST NOT carry domain state. */
export type WorkspaceEvent =
  | {
      type: "REQUEST_OPEN_PANEL";
      widgetId: string;
      preferredMode?: PanelMode;
      preferredRegion?: RegionId;
    }
  | { type: "REQUEST_CLOSE_PANEL"; widgetId: string }
  | { type: "REQUEST_PIN_PANEL"; widgetId: string }
  | { type: "REQUEST_UNPIN_PANEL"; widgetId: string }
  | { type: "DECLARE_MIN_SIZE"; widgetId: string; widthPx: number; heightPx: number }
  | {
      type: "ANNOUNCE";
      message: string;
      politeness?: "polite" | "assertive";
    }
  | { type: "REPORT_WIDGET_ERROR"; widgetId: string; code: string };
