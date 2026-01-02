/**
 * Components Barrel - Entry Point Principal
 * 
 * Importa desde aquí para acceso limpio:
 * import { Header, TabNavigation } from '@/components';
 * 
 * NOTA: Tabs se importan lazy en App.tsx para code-splitting
 */

// Layout
export * from './layout';

// UI (Toast, ErrorBoundary, Skeleton, VirtualList, Transitions, Accessibility)
export * from './ui';

// Features Components
export { DropZone, MiniDropZone } from './DropZone';
export { ContextMenu, CSVContextMenu, type ContextMenuItem } from './ContextMenu';
export { SearchBar, TableFilter, useTableFilter } from './SearchBar';
export { NetworkStatusIndicator, NetworkErrorBanner, useNetworkStatus } from './NetworkStatus';
export { ExecutionHistory, ExecutionHistoryCompact } from './ExecutionHistory';
export { LogsCompact } from './LogsCompact';
export { UpdateChecker } from './UpdateChecker';

// Templates
export * from './templates';

// Types de tabs (no componentes - esos son lazy)
export type { ConfigTabProps, CSVEditorTabProps, ScheduledTask } from './tabs';
