import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react';
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement?.focus();
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
  return containerRef;
}
export function useScreenReaderAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', priority);
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
      document.body.removeChild(el);
    }, 1000);
  }, []);
  return announce;
}
export function useRovingTabIndex<T extends HTMLElement>(
  itemCount: number,
  initialIndex = 0
) {
  const currentIndex = useRef(initialIndex);
  const itemsRef = useRef<(T | null)[]>([]);
  const setItemRef = useCallback((index: number) => (el: T | null) => {
    itemsRef.current[index] = el;
  }, []);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let newIndex = currentIndex.current;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (currentIndex.current + 1) % itemCount;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (currentIndex.current - 1 + itemCount) % itemCount;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = itemCount - 1;
        break;
      default:
        return;
    }
    currentIndex.current = newIndex;
    itemsRef.current[newIndex]?.focus();
  }, [itemCount]);
  const getTabIndex = useCallback((index: number) => {
    return index === currentIndex.current ? 0 : -1;
  }, []);
  return { setItemRef, handleKeyDown, getTabIndex };
}
export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50
                 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg
                 focus:shadow-lg focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}
export function AccessibleLoading({ 
  message = 'Loading...',
  size = 'md' 
}: { 
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  return (
    <div 
      role="status" 
      aria-live="polite"
      className="flex items-center gap-2"
    >
      <svg
        className={`animate-spin text-primary-600 ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{message}</span>
    </div>
  );
}
export function AccessibleProgress({
  value,
  max = 100,
  label,
  showValue = true,
}: {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
}) {
  const percentage = Math.round((value / max) * 100);
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </span>
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div 
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2"
      >
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
export function AccessibleError({
  id,
  message,
}: {
  id: string;
  message: string;
}) {
  return (
    <p 
      id={id}
      role="alert"
      className="text-sm text-red-600 dark:text-red-400 mt-1"
    >
      {message}
    </p>
  );
}
export function AccessibleField({
  id,
  label,
  error,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1">
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
      <div
        aria-describedby={[
          hint ? hintId : null,
          error ? errorId : null,
        ].filter(Boolean).join(' ') || undefined}
      >
        {children}
      </div>
      {error && <AccessibleError id={errorId} message={error} />}
    </div>
  );
}
