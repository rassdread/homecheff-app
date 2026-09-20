'use client';

import React from 'react';
import { trackVerdienCheckFunnelEvent, VERDIENCHECK_FUNNEL_EVENTS } from '@/lib/analytics/verdiencheck-funnel';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

/**
 * Technical render errors only. Never logs wizard state or answers.
 */
export default class VerdienCheckErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(): void {
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.wizardRenderError, {
      error_code: 'WIZARD_RENDER',
      component: 'VerdienCheckWizard',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="font-medium text-gray-900">VerdienCheck kon niet worden geladen.</p>
          <p className="mt-2 text-sm text-gray-600">Probeer de pagina te vernieuwen.</p>
          <a
            href="/"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Naar HomeCheff
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
