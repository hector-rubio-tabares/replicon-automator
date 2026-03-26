import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { normalizeAccountCode } from '@shared/utils';
interface CSVEditorState {
  // Persistir el mes/año seleccionado para restaurar al volver
  selectedYear: number;
  selectedMonth: number; // 1-12 (enero-diciembre)
  setSelectedYearMonth: (year: number, month: number) => void;
  defaultAccount: string;
  setDefaultAccount: (account: string) => void;
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  showCsvOutput: boolean;
  setShowCsvOutput: (show: boolean) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}
export const useCSVEditorStore = create<CSVEditorState>()(
  persist(
    (set) => {
      const now = new Date();
      return {
        // Por defecto: mes/año actual
        selectedYear: now.getFullYear(),
        selectedMonth: now.getMonth() + 1, // 1-12
        setSelectedYearMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),
        defaultAccount: 'W',
        setDefaultAccount: (account) => set({ defaultAccount: account }),
        showPreview: false,
        setShowPreview: (show) => set({ showPreview: show }),
        showCsvOutput: false,
        setShowCsvOutput: (show) => set({ showCsvOutput: show }),
        _hasHydrated: false,
        setHasHydrated: (state) => set({ _hasHydrated: state }),
      };
    },
    {
      name: 'csv-editor-state',
      version: 2, // v2: Agregar selectedYear/selectedMonth persistidos
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const now = new Date();
        // Migración v0 → v1: forzar defaultAccount a 'W'
        if (version === 0) {
          return {
            ...(persistedState as Partial<CSVEditorState>),
            defaultAccount: 'W',
            selectedYear: now.getFullYear(),
            selectedMonth: now.getMonth() + 1,
          };
        }
        // Migración v1 → v2: agregar selectedYear/selectedMonth
        if (version === 1) {
          return {
            ...(persistedState as Partial<CSVEditorState>),
            selectedYear: now.getFullYear(),
            selectedMonth: now.getMonth() + 1,
          };
        }
        return persistedState as Partial<CSVEditorState>;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        selectedYear: state.selectedYear,
        selectedMonth: state.selectedMonth,
        defaultAccount: state.defaultAccount,
        showPreview: state.showPreview,
        showCsvOutput: state.showCsvOutput,
      }),
    }
  )
);
export const SPECIAL_ACCOUNT_CODES = ['V', 'W', 'M', 'ND', 'FDS'];

export function isSpecialAccount(code: string): boolean {
  return SPECIAL_ACCOUNT_CODES.includes(normalizeAccountCode(code));
}
