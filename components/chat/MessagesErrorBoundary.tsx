'use client';

import React from 'react';
import { reportAppDiagnostic } from '@/lib/diagnostics/appDiagnostics';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

/**
 * Isolates Berichten UI crashes; logs a single rate-limited diagnostic (no stack / PII).
 */
export class MessagesErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    reportAppDiagnostic('messages_ui_crash', {
      kind: error.name,
    });
    if (process.env.NODE_ENV === 'development') {
      console.error('[MessagesErrorBoundary]', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-[#e8eaed] p-6 text-center">
          <p className="max-w-md text-sm font-medium text-gray-800">
            Berichten konden niet worden geladen. Vernieuw de pagina of probeer het later
            opnieuw.
          </p>
          <button
            type="button"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            onClick={() => window.location.reload()}
          >
            Vernieuwen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
