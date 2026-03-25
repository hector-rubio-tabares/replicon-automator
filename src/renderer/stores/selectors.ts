import { useCSVEditorStore } from './csv-editor-store';
import { useThemeStore } from './theme-store';
import { useToastStore } from './toast-store';
import { useExecutionHistoryStore } from './execution-history-store';
import { useSoundStore } from './sound-store';
import { useUnsavedChangesStore } from './unsaved-changes-store';
import { useCSVHistoryStore } from './csv-history-store';

// CSV Editor selectors
export const useSelectedYear = () => useCSVEditorStore(state => state.selectedYear);
export const useSelectedMonth = () => useCSVEditorStore(state => state.selectedMonth);
export const useSetSelectedYearMonth = () => useCSVEditorStore(state => state.setSelectedYearMonth);
export const useDefaultAccount = () => useCSVEditorStore(state => state.defaultAccount);
export const useSetDefaultAccount = () => useCSVEditorStore(state => state.setDefaultAccount);
export const useShowPreview = () => useCSVEditorStore(state => state.showPreview);
export const useSetShowPreview = () => useCSVEditorStore(state => state.setShowPreview);
export const useShowCsvOutput = () => useCSVEditorStore(state => state.showCsvOutput);
export const useSetShowCsvOutput = () => useCSVEditorStore(state => state.setShowCsvOutput);
export const useCSVEditorHydrated = () => useCSVEditorStore(state => state._hasHydrated);
export const useTheme = () => useThemeStore(state => state.theme);
export const useSetTheme = () => useThemeStore(state => state.setTheme);
export const useToggleTheme = () => useThemeStore(state => state.toggleTheme);
export const useResolvedTheme = () => useThemeStore(state => state.resolvedTheme);
export const useToasts = () => useToastStore(state => state.toasts);
export const useAddToast = () => useToastStore(state => state.addToast);
export const useRemoveToast = () => useToastStore(state => state.removeToast);
export const useClearAllToasts = () => useToastStore(state => state.clearAll);
export const useToastSuccess = () => useToastStore(state => state.success);
export const useToastError = () => useToastStore(state => state.error);
export const useToastWarning = () => useToastStore(state => state.warning);
export const useToastInfo = () => useToastStore(state => state.info);
export const useExecutionHistory = () => useExecutionHistoryStore(state => state.history);
export const useAddExecution = () => useExecutionHistoryStore(state => state.addExecution);
export const useClearExecutionHistory = () => useExecutionHistoryStore(state => state.clearHistory);
export const useGetExecutionStats = () => useExecutionHistoryStore(state => state.getStats);
export const useSoundEnabled = () => useSoundStore(state => state.enabled);
export const useSoundVolume = () => useSoundStore(state => state.volume);
export const useToggleSoundEnabled = () => useSoundStore(state => state.toggleEnabled);
export const useSetSoundVolume = () => useSoundStore(state => state.setVolume);
export const usePlaySound = () => useSoundStore(state => state.play);
export const usePlaySuccess = () => useSoundStore(state => state.playSuccess);
export const usePlayError = () => useSoundStore(state => state.playError);
export const useHasUnsavedChanges = () => useUnsavedChangesStore(state => state.hasUnsavedChanges);
export const useSetUnsavedChanges = () => useUnsavedChangesStore(state => state.setUnsavedChanges);
export const useMarkSaved = () => useUnsavedChangesStore(state => state.markSaved);
export const useMarkAllSaved = () => useUnsavedChangesStore(state => state.markAllSaved);
export const useChangedSections = () => useUnsavedChangesStore(state => state.changedSections);
export const useCSVHistoryCanUndo = () => useCSVHistoryStore(state => state.canUndo);
export const useCSVHistoryCanRedo = () => useCSVHistoryStore(state => state.canRedo);
export const useCSVHistoryUndo = () => useCSVHistoryStore(state => state.undo);
export const useCSVHistoryRedo = () => useCSVHistoryStore(state => state.redo);
export const useCSVHistoryPush = () => useCSVHistoryStore(state => state.pushState);
export const useCSVHistoryClear = () => useCSVHistoryStore(state => state.clearHistory);
export const useCSVHistoryInitialize = () => useCSVHistoryStore(state => state.initialize);
export const useCSVHistoryInfo = () => useCSVHistoryStore(state => state.getHistoryInfo);
export function createSelector<TStore, TSelected>(
  useStore: (selector: (state: TStore) => TSelected) => TSelected,
  selector: (state: TStore) => TSelected
): () => TSelected {
  return () => useStore(selector);
}
