"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card p-8 text-center max-w-sm mx-auto">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-brand-blue opacity-70" />
          <h3 className="font-bold text-lg mb-2">משהו השתבש</h3>
          <p className="text-sm text-secondary mb-4">
            {this.props.fallbackMessage || "נסו לרענן את הדף"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary text-sm flex items-center gap-2 mx-auto px-6 py-2"
          >
            <RotateCcw className="w-4 h-4" />
            נסו שוב
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
