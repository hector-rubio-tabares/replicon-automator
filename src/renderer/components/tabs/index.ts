/**
 * Barrel file para tabs (Organisms)
 * NOTA: Los componentes se exportan para lazy loading desde App.tsx
 * No usar exports estáticos aquí para permitir code-splitting
 */

// Re-export types que puedan necesitarse externamente
export type { ConfigTabProps } from './config/ConfigTab.types';
export type { CSVEditorTabProps } from './csv-editor/CSVEditorTab.types';

// Re-export scheduler components and types
export * from './scheduler';
export type { ScheduledTask } from '@/hooks/useScheduler';
