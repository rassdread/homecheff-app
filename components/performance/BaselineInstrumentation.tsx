'use client';

import { useEffect } from 'react';
import { installClientBaselineInstrumentation } from '@/lib/performance/install-client-baseline';

/** Mounts opt-in duplicate-fetch detector + baseline reporter. */
export default function BaselineInstrumentation() {
  useEffect(() => {
    installClientBaselineInstrumentation();
  }, []);
  return null;
}
