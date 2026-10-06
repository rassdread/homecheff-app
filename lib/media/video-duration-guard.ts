import { MAX_VIDEO_DURATION } from "@/lib/videoUtils";
import { probeIsoBmff, type IsoBmffProbe } from "@/lib/media/iso-bmff-probe";

export type VideoDurationDecision =
  | { ok: true; probe: Extract<IsoBmffProbe, { ok: true }> }
  | { ok: false; status: 400; error: string };

const DURATION_TOLERANCE_SECONDS = 0.05;

export function decideVideoDuration(
  bytes: Uint8Array,
  maxSeconds = MAX_VIDEO_DURATION,
): VideoDurationDecision {
  const probe = probeIsoBmff(bytes);
  if (!probe.ok) {
    return {
      ok: false,
      status: 400,
      error: "Deze video kan niet worden gecontroleerd. Gebruik een MP4 of MOV.",
    };
  }
  if (probe.durationSeconds > maxSeconds + DURATION_TOLERANCE_SECONDS) {
    return {
      ok: false,
      status: 400,
      error: `Video is te lang (${Math.ceil(probe.durationSeconds)} seconden). Maximum ${maxSeconds} seconden.`,
    };
  }
  return { ok: true, probe };
}
