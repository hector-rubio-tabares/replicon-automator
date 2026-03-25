import { memo } from 'react';
import type { AccountItemProps } from './ConfigTab.types';
import { getSpecialAccountLabel } from './ConfigTab.utils';
import { useTranslation } from '@/i18n';
export default memo(function AccountItem({ code, account, onRemove }: AccountItemProps) {
  const { t } = useTranslation();

  const specialLabel = getSpecialAccountLabel(code);
  const isSpecial = Boolean(specialLabel);
  return (
    <div className={`border rounded-lg overflow-hidden ${isSpecial ? 'border-amber-500/50 dark:border-amber-700/50' : 'border-gray-200 dark:border-slate-700'}`}>
      <div
        className={`flex items-center justify-between p-3 ${isSpecial ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-dark-200'}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-primary-600 dark:text-primary-400 font-mono font-bold">{code}</span>
          <span className="text-gray-700 dark:text-slate-300">{account}</span>
          {isSpecial && (
            <span className="text-xs bg-amber-500 dark:bg-amber-600 text-white px-2 py-0.5 rounded">{specialLabel}</span>
          )}

        </div>
        <div className="flex items-center gap-2">
          {!isSpecial && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
              title={t('accountMapping.deleteAccount')}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
