import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import React from 'react';

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'errors.title': 'Error Occurred',
    'errors.description': 'Something went wrong',
    'errors.viewDetails': 'View Details',
    'errors.retry': 'Retry',
    'errors.reloadApp': 'Reload App',
  };
  return translations[key] || key;
});

vi.mock('@/i18n', () => ({
  useI18nStore: {
    getState: () => ({ t: mockT }),
  },
}));

global.window.electronAPI = {
  sendLogToMain: vi.fn(),
  saveCredentials: vi.fn(),
  loadCredentials: vi.fn(),
  deleteCredentials: vi.fn(),
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  openExternal: vi.fn(),
  selectFile: vi.fn(),
  selectSaveFile: vi.fn(),
  getAppVersion: vi.fn(),
  onUpdateAvailable: vi.fn(),
  onUpdateDownloaded: vi.fn(),
  installUpdate: vi.fn(),
  checkForUpdates: vi.fn(),
  startAutomation: vi.fn(),
  stopAutomation: vi.fn(),
  onAutomationProgress: vi.fn(),
  onAutomationComplete: vi.fn(),
  getExecutionHistory: vi.fn(),
  clearExecutionHistory: vi.fn(),
  exportExecutionHistory: vi.fn(),
  setLanguage: vi.fn(),
  getSystemInfo: vi.fn(),
  openLogFile: vi.fn(),
} as any;

const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Normal rendering', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should render error UI when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should show retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Retry/)).toBeInTheDocument();
    });

    it('should show reload button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Reload App/)).toBeInTheDocument();
    });

    it('should show error details in expandable section', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        expect.any(Object)
      );
    });

    it('should send error to main process via IPC', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(window.electronAPI.sendLogToMain).toHaveBeenCalledWith(
        'ERROR',
        'ReactErrorBoundary',
        expect.stringContaining('Test error')
      );
    });
  });

  describe('Custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Error Occurred')).not.toBeInTheDocument();
    });

    it('should use default UI when no fallback provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    });
  });

  describe('Error recovery', () => {
    it('should reset state when retry clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Occurred')).toBeInTheDocument();

      const retryButton = screen.getByText(/Retry/);
      retryButton.click();

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Occurred')).not.toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('should use translation function for error messages', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(mockT).toHaveBeenCalledWith('errors.title');
      expect(mockT).toHaveBeenCalledWith('errors.description');
      expect(mockT).toHaveBeenCalledWith('errors.retry');
      expect(mockT).toHaveBeenCalledWith('errors.reloadApp');
    });
  });

  describe('getDerivedStateFromError', () => {
    it('should set hasError to true when error occurs', () => {
      const derivedState = ErrorBoundary.getDerivedStateFromError(new Error('test'));

      expect(derivedState).toEqual({
        hasError: true,
        error: expect.objectContaining({ message: 'test' }),
      });
    });
  });
});
