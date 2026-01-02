/**
 * useTemplates Hook - Manages template operations
 * Wrapper around the Zustand store with additional utilities
 */
import { useCallback, useMemo, useState } from 'react';
import { useCSVTemplatesStore, type CSVTemplate } from '../stores/csv-templates-store';
import { useTranslation } from '../i18n';
import type { CSVRow } from '@shared/types';

export interface UseTemplatesReturn {
  // State
  templates: CSVTemplate[];
  defaultTemplates: CSVTemplate[];
  userTemplates: CSVTemplate[];
  searchQuery: string;
  filteredTemplates: CSVTemplate[];
  selectedId: string | null;
  
  // Search & Selection
  setSearchQuery: (query: string) => void;
  selectTemplate: (id: string | null) => void;
  toggleSelection: (id: string) => void;
  
  // CRUD Operations
  saveTemplate: (name: string, data: CSVRow[], description?: string) => void;
  loadTemplate: (template: CSVTemplate) => CSVRow[];
  deleteTemplate: (id: string) => boolean;
  duplicateTemplate: (id: string, newName?: string) => void;
  
  // Import/Export
  exportTemplates: () => void;
  importTemplates: () => Promise<void>;
  
  // Utilities
  formatDate: (timestamp: number) => string;
}

export function useTemplates(): UseTemplatesReturn {
  const { t } = useTranslation();
  const store = useCSVTemplatesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return store.templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
    );
  }, [store.templates, searchQuery]);

  const defaultTemplates = useMemo(
    () => filteredTemplates.filter((t) => t.isDefault),
    [filteredTemplates]
  );

  const userTemplates = useMemo(
    () => filteredTemplates.filter((t) => !t.isDefault),
    [filteredTemplates]
  );

  const selectTemplate = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const saveTemplate = useCallback(
    (name: string, data: CSVRow[], description?: string) => {
      if (!name.trim() || !data.length) return;
      store.addTemplate(name.trim(), data, description?.trim());
    },
    [store]
  );

  const loadTemplate = useCallback((template: CSVTemplate): CSVRow[] => {
    // Deep clone to prevent mutations
    return JSON.parse(JSON.stringify(template.data));
  }, []);

  const deleteTemplateWithConfirm = useCallback(
    (id: string): boolean => {
      if (confirm(t('templates.confirmDelete'))) {
        store.deleteTemplate(id);
        if (selectedId === id) setSelectedId(null);
        return true;
      }
      return false;
    },
    [store, t, selectedId]
  );

  const duplicateTemplateWithPrompt = useCallback(
    (id: string, newName?: string) => {
      const template = store.templates.find((t) => t.id === id);
      if (!template) return;
      
      const name = newName ?? prompt(t('templates.enterName'), `${template.name} (${t('common.copy')})`);
      if (name) {
        store.duplicateTemplate(id, name);
      }
    },
    [store, t]
  );

  const exportTemplatesHandler = useCallback(() => {
    const data = store.exportTemplates();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'csv-templates.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [store]);

  const importTemplatesHandler = useCallback(async () => {
    return new Promise<void>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve();
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text) as CSVTemplate[];
          store.importTemplates(data);
        } catch {
          alert(t('templates.importError'));
        }
        resolve();
      };
      input.click();
    });
  }, [store, t]);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  }, []);

  return {
    templates: store.templates,
    defaultTemplates,
    userTemplates,
    searchQuery,
    filteredTemplates,
    selectedId,
    setSearchQuery,
    selectTemplate,
    toggleSelection,
    saveTemplate,
    loadTemplate,
    deleteTemplate: deleteTemplateWithConfirm,
    duplicateTemplate: duplicateTemplateWithPrompt,
    exportTemplates: exportTemplatesHandler,
    importTemplates: importTemplatesHandler,
    formatDate,
  };
}
