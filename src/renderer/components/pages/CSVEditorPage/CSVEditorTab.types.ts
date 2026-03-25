import type { CSVRow, AccountMappings } from '@shared/types';
export interface CSVEditorTabProps {
  data: CSVRow[] | null;
  onDataChange: (data: CSVRow[]) => void;
  onLoadCSV: () => Promise<void>;
  onSaveCSV: () => Promise<void>;
  mappings: AccountMappings;
}
export type DayInfo = {
  date: string; 
  dayNumber: number; 
  dowLabel: string; 
  isWeekend: boolean;
  isHoliday: boolean;
};
export type ExtDraftEntry = {
  inicio: string; 
  fin: string; 
};
export type ParseExtResult = {
  entries: ExtDraftEntry[];
  error: string | null;
};
