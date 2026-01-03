import { useState, useCallback } from 'react';
import type { CSVRow, AccountMappings } from '@shared/types';
import type { ExtDraftEntry } from '../components/pages/CSVEditorPage/CSVEditorTab.types';
import { buildExtString, parseExtString as parseExtStringUtil } from '../components/pages/CSVEditorPage/CSVEditorTab.utils';
export interface UseExtrasEditorReturn {
  rowIndex: number | null;
  entries: ExtDraftEntry[];
  error: string | null;
  isOpen: boolean;
  open: (rowIndex: number, currentExtras: string) => void;
  close: () => void;
  apply: (onUpdateRow: (index: number, field: keyof CSVRow, value: string) => void) => void;
  setEntries: (entries: ExtDraftEntry[]) => void;
  addEntry: () => void;
  removeEntry: (index: number) => void;
  updateEntry: (index: number, field: keyof ExtDraftEntry, value: string) => void;
}
export function useExtrasEditor(mappings: AccountMappings): UseExtrasEditorReturn {
  const [rowIndex, setRowIndex] = useState<number | null>(null);
  const [entries, setEntries] = useState<ExtDraftEntry[]>([
    { cuenta: '', proyecto: '', inicio: '', fin: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const parseExtString = useCallback(
    (extras: string) => parseExtStringUtil(extras, mappings),
    [mappings]
  );
  const open = useCallback((index: number, currentExtras: string) => {
    const parsed = parseExtString(currentExtras);
    if (parsed.entries.length > 0 && !parsed.error) {
      setEntries(parsed.entries);
      setError(null);
    } else {
      setEntries([{ cuenta: '', proyecto: '', inicio: '', fin: '' }]);
      setError(parsed.error);
    }
    setRowIndex(index);
  }, [parseExtString]);
  const close = useCallback(() => {
    setRowIndex(null);
    setError(null);
  }, []);
  const apply = useCallback((onUpdateRow: (index: number, field: keyof CSVRow, value: string) => void) => {
    if (rowIndex === null) return;
    const nextExtras = buildExtString(entries);
    const validation = parseExtString(nextExtras);
    if (nextExtras && validation.error) {
      setError(validation.error);
      return;
    }
    onUpdateRow(rowIndex, 'extras', nextExtras);
    close();
  }, [rowIndex, entries, parseExtString, close]);
  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, { cuenta: '', proyecto: '', inicio: '', fin: '' }]);
  }, []);
  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const updateEntry = useCallback((index: number, field: keyof ExtDraftEntry, value: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);
  return {
    rowIndex,
    entries,
    error,
    isOpen: rowIndex !== null,
    open,
    close,
    apply,
    setEntries,
    addEntry,
    removeEntry,
    updateEntry,
  };
}
