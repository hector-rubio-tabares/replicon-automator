import { useState, useCallback } from 'react';
import type { CSVRow } from '../../shared/types';

export function useCSV() {
  const [data, setData] = useState<CSVRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const loadCSV = useCallback(async () => {
    try {
      const result = await window.electronAPI.loadCSV();
      
      if (result.success && result.data) {
        setData(result.data);
        setFileName(result.filePath?.split(/[\\/]/).pop() || 'archivo.csv');
      } else if (result.error) {
        alert(`Error al cargar CSV: ${result.error}`);
      }
    } catch (error) {
      alert(`Error al cargar CSV: ${error}`);
    }
  }, []);

  const saveCSV = useCallback(async () => {
    if (!data || data.length === 0) {
      alert('No hay datos para guardar');
      return;
    }

    try {
      const result = await window.electronAPI.saveCSV(data);
      
      if (result.success) {
        alert('Archivo guardado exitosamente');
      } else if (result.error) {
        alert(`Error al guardar CSV: ${result.error}`);
      }
    } catch (error) {
      alert(`Error al guardar CSV: ${error}`);
    }
  }, [data]);

  return {
    data,
    setData,
    fileName,
    loadCSV,
    saveCSV,
  };
}
