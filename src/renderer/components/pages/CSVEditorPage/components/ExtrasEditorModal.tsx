import { memo } from 'react';
import type { ExtDraftEntry } from '../CSVEditorTab.types';
import { useTranslation } from '@/i18n';
export interface ExtrasEditorModalProps {
  rowIndex: number;
  entries: ExtDraftEntry[];
  error: string | null;
  onEntriesChange: (entries: ExtDraftEntry[]) => void;
  onApply: () => void;
  onClose: () => void;
}
const ExtrasEditorModal = memo(function ExtrasEditorModal({
  rowIndex,
  entries,
  error,
  onEntriesChange,
  onApply,
  onClose,
}: ExtrasEditorModalProps) {
  const { t } = useTranslation();
  const handleEntryChange = (index: number, field: keyof ExtDraftEntry, value: string) => {
    const next = [...entries];
    if (field === 'inicio' || field === 'fin') {
      next[index] = { ...next[index], [field]: value.replace(/[^0-9]/g, '').slice(0, 4) };
    }
    onEntriesChange(next);
  };
  const handleAddEntry = () => {
    onEntriesChange([...entries, { inicio: '', fin: '' }]);
  };
  const handleRemoveEntry = (index: number) => {
    const next = entries.filter((_, idx) => idx !== index);
    onEntriesChange(next.length ? next : [{ inicio: '', fin: '' }]);
  };
  return (
    <div
      className="fixed left-1/2 top-24 -translate-x-1/2 z-50 w-[95vw] max-w-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ext-editor-title"
    >
      <div className="card bg-white dark:bg-dark-200 border border-gray-200 dark:border-slate-700 shadow-xl">
        {}
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 id="ext-editor-title" className="text-gray-900 dark:text-white font-semibold">
            ⏱️ {t('extrasEditor.title')} — {t('csvEditor.day')} {rowIndex + 1}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            title={t('common.close')}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>
        {}
        <div className="overflow-auto">
          <table className="w-full text-sm" role="grid" aria-label={t('extrasEditor.title')}>
            <thead className="text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-2">{t('configExt.start')}</th>
                <th className="text-left py-2">{t('configExt.end')}</th>
                <th className="text-center py-2 w-16"> </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                return (
                  <tr key={i} className="border-b border-gray-100 dark:border-slate-700/50">
                    {}
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={entry.inicio}
                        onChange={(e) => handleEntryChange(i, 'inicio', e.target.value)}
                        placeholder="0900"
                        className="w-full bg-gray-50 dark:bg-dark-300 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
                        aria-label={`${t('extrasEditor.startTime')} ${t('extrasEditor.extraN')} ${i + 1}`}
                      />
                    </td>
                    {}
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={entry.fin}
                        onChange={(e) => handleEntryChange(i, 'fin', e.target.value)}
                        placeholder="1100"
                        className="w-full bg-gray-50 dark:bg-dark-300 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white"
                        aria-label={`${t('extrasEditor.endTime')} ${t('extrasEditor.extraN')} ${i + 1}`}
                      />
                    </td>
                    {}
                    <td className="py-2 text-center">
                      <button
                        className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                        title={t('extrasEditor.removeExtra')}
                        onClick={() => handleRemoveEntry(i)}
                        aria-label={`${t('extrasEditor.removeExtra')} ${i + 1}`}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {}
        {error && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-2" role="alert">{error}</p>
        )}
        {}
        <div className="flex flex-wrap gap-2 justify-between items-center mt-4">
          <button
            className="btn btn-secondary"
            onClick={handleAddEntry}
            title={t('extrasEditor.addSlot')}
            aria-label={t('extrasEditor.addSlot')}
          >
            +
          </button>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-success" onClick={onApply}>
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
export default ExtrasEditorModal;
