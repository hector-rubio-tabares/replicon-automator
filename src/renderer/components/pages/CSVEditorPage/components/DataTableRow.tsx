import { memo } from 'react';
import type { CSVRow, AccountMappings } from '@shared/types';
import { pad2 } from '@shared/utils';
import type { DayInfo, ParseExtResult } from '../CSVEditorTab.types';
import { useTranslation } from '@/i18n';
export interface DataTableRowProps {
  index: number;
  row: CSVRow;
  dayInfo: DayInfo | null;
  mappings: AccountMappings;
  accountCodes: string[];
  parseExtString: (extras: string) => ParseExtResult;
  onUpdateRow: (index: number, field: keyof CSVRow, value: string) => void;
  onRemoveRow: (index: number) => void;
  onOpenExtEditor: (index: number) => void;
  onConfigureManually: (index: number) => void;
}
const DataTableRow = memo(function DataTableRow({
  index,
  row,
  dayInfo,
  mappings,
  accountCodes,
  parseExtString,
  onUpdateRow,
  onRemoveRow,
  onOpenExtEditor,
  onConfigureManually,
}: DataTableRowProps) {
  const { t } = useTranslation();
  const validation = parseExtString(row.extras || '');
  const showError = Boolean((row.extras || '').trim()) && Boolean(validation.error);
  return (
    <tr className="border-t border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
      {}
      <td className="py-2 px-4 text-gray-500 dark:text-slate-500 font-mono">{index + 1}</td>
      {}
      <td className="py-2 px-4 text-gray-700 dark:text-slate-300 font-mono text-sm">
        {dayInfo ? (
          <>
            {pad2(dayInfo.dayNumber)} {dayInfo.dowLabel}
            {dayInfo.isWeekend && <span className="ml-2 text-gray-400 dark:text-slate-500">{t('common.weekend')}</span>}
            {dayInfo.isHoliday && <span className="ml-2 text-amber-500 dark:text-amber-400">★</span>}
          </>
        ) : (
          '--'
        )}
      </td>
      {}
      <td className="py-2 px-4">
        <select
          value={row.cuenta}
          onChange={(e) => onUpdateRow(index, 'cuenta', e.target.value)}
          className="w-full bg-white dark:bg-dark-200 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
          aria-label={`${t('csvEditor.accountLabel')} ${index + 1}`}
        >
          <option value="">{t('csvEditor.select')}</option>
          {accountCodes.map((code) => {
            // Defensive: handle both old {name, projects} and new string format
            const mapping = mappings[code];
            const accountName = typeof mapping === 'string' 
              ? mapping 
              : (mapping && typeof mapping === 'object' && 'name' in mapping) 
                ? (mapping as { name: string }).name 
                : 'N/A';
            
            return (
              <option key={code} value={code}>
                {code} - {accountName}
              </option>
            );
          })}
        </select>
      </td>
      {}
      <td className="py-2 px-4">
        <div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={row.extras || ''}
              onChange={(e) => onUpdateRow(index, 'extras', e.target.value)}
              placeholder="0900-1100;1300-1700"
              className={`w-full bg-white dark:bg-dark-200 border rounded-lg text-gray-900 dark:text-white ${showError ? 'border-red-500/60' : 'border-gray-300 dark:border-slate-600'}`}
              aria-label={`${t('csvEditor.extrasLabel')} ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => onOpenExtEditor(index)}
              className="btn btn-secondary"
              title={t('csvEditor.editExtras')}
              aria-label={`${t('csvEditor.editExtras')} ${index + 1}`}
            >
              ⏱️
            </button>
          </div>
          {showError && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1" role="alert">{validation.error}</p>
          )}
        </div>
      </td>
      {}
      <td className="py-2 px-4 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
          <button
            type="button"
            onClick={() => onConfigureManually(index)}
            className="btn btn-secondary"
            title={t('csvEditor.configureManually')}
            aria-label={`${t('csvEditor.configureManually')} ${index + 1}`}
          >
            ✍️
          </button>
          <button
            onClick={() => onRemoveRow(index)}
            className="inline-flex items-center justify-center text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            title={t('csvEditor.deleteRow')}
            type="button"
            aria-label={`${t('csvEditor.deleteRow')} ${index + 1}`}
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
});
export default DataTableRow;
