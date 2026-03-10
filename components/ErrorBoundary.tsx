'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
          <p className="font-medium">Inhoud kon niet geladen worden.</p>
          <p className="text-sm mt-1">Probeer de pagina te vernieuwen.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-2 text-xs overflow-auto max-h-24">{this.state.error.message}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
