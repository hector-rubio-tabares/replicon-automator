import { useState, useCallback } from 'react';
import type { CSVRow } from '@shared/types';
import { useToastStore } from '../stores/toast-store';
import { useTranslation } from '../i18n';

export function useCSV() {
  const [data, setData] = useState<CSVRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const toast = useToastStore();
  const { t } = useTranslation();

  const loadCSV = useCallback(async () => {
    try {
      const result = await window.electronAPI.loadCSV();
      if (result.success && result.data) {
        setData(result.data);
        setFileName(result.filePath?.split(/[\\/]/).pop() || 'archivo.csv');
      } else if (result.error) {
        toast.error(t('csv.csvLoadError'), result.error);
      }
    } catch (error) {
      toast.error(t('csv.csvLoadError'), String(error));
    }
  }, [toast, t]);

  const saveCSV = useCallback(async () => {
    if (!data || data.length === 0) {
      toast.warning(t('csv.noDataToSave'));
      return;
    }
    try {
      const result = await window.electronAPI.saveCSV(data);
      if (result.success) {
        toast.success(t('csv.csvSaved'));
      } else if (result.error) {
        toast.error(t('csv.csvSaveError'), result.error);
      }
    } catch (error) {
      toast.error(t('csv.csvSaveError'), String(error));
    }
  }, [data, toast, t]);

  return {
    data,
    setData,
    fileName,
    loadCSV,
    saveCSV,
  };
}
