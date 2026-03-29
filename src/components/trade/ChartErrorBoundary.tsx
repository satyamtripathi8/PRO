import React from 'react';

interface State { hasError: boolean; error?: Error }
interface Props { children: React.ReactNode; fallback?: React.ReactNode }

export default class ChartErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ChartErrorBoundary] Chart crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg border border-dashed">
          <div className="text-center px-4">
            <p className="text-gray-400 text-sm mb-2">Chart failed to load</p>
            <button
              className="text-xs text-blue-500 hover:underline"
              onClick={() => this.setState({ hasError: false })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
