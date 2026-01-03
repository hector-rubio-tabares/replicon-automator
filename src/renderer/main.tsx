import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useThemeStore } from './stores/theme-store';
import { useI18n } from './i18n';
import './styles/globals.css';
const showErrorOnScreen = (title: string, error: string) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.9); color: white; padding: 20px;
    font-family: monospace; font-size: 14px; z-index: 99999;
    overflow: auto; white-space: pre-wrap;
  `;
  errorDiv.innerHTML = `
    <h1 style="color: #ff6b6b; margin-bottom: 20px;">🚨 ${title}</h1>
    <pre style="background: #1a1a2e; padding: 15px; border-radius: 8px; overflow: auto;">${error}</pre>
    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #4ecdc4; border: none; border-radius: 5px;">
      Reload App
    </button>
  `;
  document.body.appendChild(errorDiv);
};
const sendLog = (level: string, source: string, message: string) => {
  try {
    window.electronAPI?.sendLogToMain?.(level, source, message);
  } catch (e) {
    const err = e as Error;
    console.error('[IPC Error] Failed to send log to main:', err);
    showErrorOnScreen('IPC Error', `Failed to send log to main:\n${err.message}\n\nStack:\n${err.stack}`);
  }
};
window.onerror = (message, source, lineno, colno, error) => {
  const errorMsg = `${message}\n\nSource: ${source}\nLine: ${lineno}, Col: ${colno}\n\nStack:\n${error?.stack || 'No stack available'}`;
  console.error(`[GLOBAL ERROR]`, errorMsg);
  sendLog('ERROR', 'GlobalError', errorMsg);
  showErrorOnScreen('JavaScript Error', errorMsg);
  return false;
};
window.onunhandledrejection = (event) => {
  const errorMsg = `Unhandled Promise Rejection\n\n${event.reason?.stack || event.reason?.message || String(event.reason)}`;
  // eslint-disable-next-line no-console
  console.error('[UNHANDLED REJECTION]', errorMsg);
  sendLog('ERROR', 'UnhandledRejection', errorMsg);
  showErrorOnScreen('Unhandled Promise Rejection', errorMsg);
};
// eslint-disable-next-line no-console
console.log('[Renderer] Starting renderer process...');
sendLog('INFO', 'Main', 'Starting renderer process');
const initializeApp = () => {
  try {
    // eslint-disable-next-line no-console
    console.log('[Renderer] Initializing app...');
    sendLog('INFO', 'Main', 'Initializing app');
    const themeState = useThemeStore.getState();
    const resolvedTheme = themeState.theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : themeState.theme;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    const langState = useI18n.getState();
    document.documentElement.lang = langState.language;
    // eslint-disable-next-line no-console
    console.log('[Renderer] App initialized');
    sendLog('INFO', 'Main', 'App initialized');
  } catch (error) {
    const err = error as Error;
    const errorMsg = `Init Error: ${err.message}\n\nStack:\n${err.stack}`;
    console.error('[INIT ERROR]', errorMsg);
    sendLog('ERROR', 'InitError', errorMsg);
    showErrorOnScreen('Initialization Error', errorMsg);
  }
};
initializeApp();
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  const err = error as Error;
  const errorMsg = `React Render Error: ${err.message}\n\nStack:\n${err.stack}`;
  console.error('[RENDER ERROR]', errorMsg);
  sendLog('ERROR', 'RenderError', errorMsg);
  showErrorOnScreen('React Render Error', errorMsg);
}
