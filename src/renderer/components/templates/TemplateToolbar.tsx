/**
 * TemplateToolbar Component - Search and action buttons for templates
 */
import { memo } from 'react';
import { useTranslation } from '@/i18n';

interface TemplateToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasData: boolean;
  hasUserTemplates: boolean;
  onSaveClick: () => void;
  onImport: () => void;
  onExport: () => void;
}

export const TemplateToolbar = memo(function TemplateToolbar({
  searchQuery,
  onSearchChange,
  hasData,
  hasUserTemplates,
  onSaveClick,
  onImport,
  onExport,
}: TemplateToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder={t('templates.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSaveClick}
          disabled={!hasData}
          className="btn btn-primary whitespace-nowrap"
          title={!hasData ? t('templates.noDataToSave') : ''}
        >
          💾 {t('templates.saveAs')}
        </button>
        <button onClick={onImport} className="btn btn-secondary">
          📤 {t('common.import')}
        </button>
        <button
          onClick={onExport}
          disabled={!hasUserTemplates}
          className="btn btn-secondary"
        >
          📥 {t('common.export')}
        </button>
      </div>
    </div>
  );
});
