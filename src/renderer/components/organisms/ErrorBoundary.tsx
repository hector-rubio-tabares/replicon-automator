import { Component, type ReactNode } from 'react';
import { translations, type Language } from '@/i18n/translations';
function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let result: unknown = translations[lang];
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof result === 'string' ? result : key;
}
function getCurrentLanguage(): Language {
  try {
    const stored = localStorage.getItem('i18n-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.language || 'es';
    }
  } catch {
  }
  return 'es';
}
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Solo en dev mostrar en consola, siempre enviar al main
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
    window.electronAPI?.sendLogToMain?.('ERROR', 'ReactErrorBoundary', `${error.message}\n${info.componentStack}`);
  }
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const lang = getCurrentLanguage();
      const t = (key: string) => getTranslation(lang, key);
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-dark-200 rounded-xl border border-red-500/30 p-6 text-center">
            <div className="text-5xl mb-4">💥</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('common.somethingWentWrong')}</h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
              {t('common.unexpectedError')}
            </p>
            {this.state.error && (
              <pre className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-dark-300 p-3 rounded-lg mb-4 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              className="btn btn-primary px-6"
            >
              🔄 {t('common.retry')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
