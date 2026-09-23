'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`AdminPortal Error in tab [${this.props.tabName || 'Unknown'}]:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border border-red-200 rounded-3xl bg-red-50/50 text-center min-h-[400px]">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Failed to load {this.props.tabName || 'this section'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while fetching section data.'}
          </p>
          <Button
            onClick={this.handleRetry}
            className="bg-gvsuBlue text-white hover:bg-midnight font-bold text-xs px-5 h-10 rounded-xl uppercase tracking-widest shadow-md"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
