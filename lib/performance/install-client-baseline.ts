/**
 * Installs Phase 2 client instrumentation (opt-in only).
 */

import { installFeedPerfBaselineReporter } from '@/lib/feed/feed-performance-baseline';
import { installDuplicateRequestDetector } from '@/lib/performance/duplicate-request-detector';

let installed = false;

export function installClientBaselineInstrumentation(): void {
  if (typeof window === 'undefined' || installed) return;
  installed = true;
  installDuplicateRequestDetector();
  installFeedPerfBaselineReporter();
}
