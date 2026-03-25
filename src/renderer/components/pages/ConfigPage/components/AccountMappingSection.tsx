import { memo } from 'react';
import type { AccountMappings } from '@shared/types';
import AccountItem from '../AccountItem';
import {
  ensureSpecialAccounts,
  getMissingSpecialCodes,
  getSortedMappingEntries,
} from '../ConfigTab.utils';
import { useTranslation } from '@/i18n';

export interface AccountMappingSectionProps {
  mappings: AccountMappings;
  onMappingsChange: (mappings: AccountMappings) => void;
}

const AccountMappingSection = memo(function AccountMappingSection({
  mappings,
  onMappingsChange,
}: AccountMappingSectionProps) {
  const { t } = useTranslation();
  const missingSpecialCodes = getMissingSpecialCodes(mappings);
  const sortedMappingEntries = getSortedMappingEntries(mappings);

  const handleEnsureSpecialAccounts = () => {
    onMappingsChange(ensureSpecialAccounts(mappings));
  };

  return (
    <div className="card" role="region" aria-labelledby="mappings-title">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 id="mappings-title" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          {t('accountMapping.title')}
        </h2>
        {missingSpecialCodes.length > 0 && (
          <button
            onClick={handleEnsureSpecialAccounts}
            className="btn btn-secondary text-sm"
            title={t('accountMapping.specialAccountsTooltip')}
            aria-label={t('accountMapping.addSpecialAccounts')}
          >
            + {t('accountMapping.specialAccounts')}
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
        {t('accountMapping.description')}
        {missingSpecialCodes.length > 0 && (
          <span className="block text-amber-500 dark:text-amber-400 text-xs mt-1" role="alert">
            {t('accountMapping.specialAccounts')}: {missingSpecialCodes.join(', ')}
          </span>
        )}
      </p>

      {/* Account List (Read-only - Fixed 5 accounts) */}
      <div className="space-y-3 max-h-[400px] overflow-auto" role="list" aria-label={t('accountMapping.accountList')}>
        {sortedMappingEntries.map(([code, account]) => (
          <AccountItem
            key={code}
            code={code}
            account={account}
            onRemove={() => {}} // No-op: accounts are fixed
          />
        ))}
      </div>
    </div>
  );
});

export default AccountMappingSection;
