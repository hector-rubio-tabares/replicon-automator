import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useI18nStore } from '@/i18n';
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}
const getTranslation = (key: string): string => {
  return useI18nStore.getState().t(key);
};
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Solo en dev mostrar en consola
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
    const errorMsg = `React Error: ${error.message}\nStack: ${error.stack}\nComponent Stack: ${errorInfo.componentStack}`;
    window.electronAPI?.sendLogToMain?.('ERROR', 'ReactErrorBoundary', errorMsg);
  }
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };
  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 max-w-lg w-full">
            <div className="flex items-start gap-4">
              <span className="text-4xl">⚠️</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                  {getTranslation('errors.title')}
                </h2>
                <p className="text-red-600 dark:text-red-300 text-sm mb-4">
                  {getTranslation('errors.description')}
                </p>
                {this.state.error && (
                  <details className="mb-4">
                    <summary className="text-red-500 dark:text-red-400 text-xs cursor-pointer hover:underline">
                      {getTranslation('errors.viewDetails')}
                    </summary>
                    <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-auto max-h-32 text-red-800 dark:text-red-200">
                      {this.state.error.message}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={this.handleRetry}
                    className="btn btn-primary text-sm"
                  >
                    🔄 {getTranslation('errors.retry')}
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-secondary text-sm"
                  >
                    🔃 {getTranslation('errors.reloadApp')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
export default ErrorBoundary;
