import { useState } from 'react';
import type { CSVRow } from '@shared/types';

export function useCSV() {
  const [data, setData] = useState<CSVRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return {
    data,
    setData,
    fileName,
    setFileName,
  };
}
