'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('FICSIT SYSTEM FAILURE:', error, errorInfo);
  }

  // eslint-disable-next-line class-methods-use-this
  handleReset = () => {
    // Hard reset: Clear storage and reload
    localStorage.removeItem('ficsit-factory-v1');
    window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-black text-ficsit-orange flex flex-col items-center justify-center p-8 font-mono">
            <div className="border-4 border-ficsit-orange p-12 rounded-lg max-w-2xl w-full bg-[#1e1e1e] shadow-[0_0_50px_rgba(250,149,73,0.2)]">
                <div className="flex items-center gap-4 mb-8 border-b border-ficsit-orange pb-4">
                    <AlertTriangle size={48} className="text-red-500 animate-pulse" />
                    <h1 className="text-4xl font-bold tracking-tighter text-white">SYSTEM FAILURE</h1>
                </div>

                <div className="space-y-6">
                    <p className="text-xl text-red-400">
                        CRITICAL ERROR DETECTED. PRODUCTION HALTED.
                    </p>

                    <div className="bg-black p-4 rounded border border-gray-800 font-mono text-sm text-gray-400 overflow-auto max-h-48">
                        {error?.message || 'Unknown Error'}
                    </div>

                    <p className="text-gray-300">
                        The FICSIT Pioneer has encountered a fatal exception.
                        Immediate factory reset is recommended to restore productivity.
                    </p>

                    <button
                        type="button"
                        onClick={this.handleReset}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    >
                        <RefreshCw className="animate-spin-slow" />
                        INITIATE FACTORY RESET
                    </button>

                    <p className="text-xs text-center text-gray-600 mt-4">
                        Compliance with FICSIT regulations is mandatory.
                    </p>
                </div>
            </div>
        </div>
      );
    }

    return children;
  }
}
