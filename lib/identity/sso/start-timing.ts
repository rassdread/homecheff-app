/**
 * SP.2D-C6 — Server-Timing for /auth/sso/start (durations only; no secrets/PII).
 */

export type SsoStartTimingPhase =
  | "parse"
  | "session"
  | "user"
  | "code"
  | "persist"
  | "total";

export class SsoStartTimer {
  private readonly t0 = performance.now();
  private readonly marks = new Map<string, number>();
  private last = this.t0;

  /** Record wall-clock delta since previous mark (or construction). */
  mark(phase: SsoStartTimingPhase | string): void {
    const now = performance.now();
    const delta = Math.max(0, now - this.last);
    this.marks.set(phase, Math.round(delta));
    this.last = now;
  }

  /** Record an absolute duration for a named phase (e.g. authorize sub-steps). */
  setDuration(phase: SsoStartTimingPhase | string, ms: number): void {
    this.marks.set(phase, Math.max(0, Math.round(ms)));
  }

  elapsedTotalMs(): number {
    return Math.round(performance.now() - this.t0);
  }

  /** Header value: `parse;dur=12, session;dur=40, total;dur=180` */
  toHeaderValue(): string {
    const parts: string[] = [];
    for (const [name, dur] of this.marks) {
      if (name === "total") continue;
      parts.push(`${sanitizeName(name)};dur=${dur}`);
    }
    parts.push(`total;dur=${this.elapsedTotalMs()}`);
    return parts.join(", ");
  }
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "phase";
}

export function applySsoStartServerTiming(
  res: Response,
  timer: SsoStartTimer,
): void {
  try {
    res.headers.set("Server-Timing", timer.toHeaderValue());
  } catch {
    /* ignore immutable headers */
  }
}
