/**
 * TemplateCard Component - Individual template card in the template manager
 */
import { memo } from 'react';
import { useTranslation } from '@/i18n';
import type { CSVTemplate } from '@/stores/csv-templates-store';

interface TemplateCardProps {
  template: CSVTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onLoad: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  formatDate: (timestamp: number) => string;
}

export const TemplateCard = memo(function TemplateCard({
  template,
  isSelected,
  onSelect,
  onLoad,
  onDuplicate,
  onDelete,
  formatDate,
}: TemplateCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {template.name}
            </h4>
            {template.isDefault && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                {t('templates.default')}
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-slate-500">
            <span>
              {template.data.length} {t('templates.rows')}
            </span>
            <span>•</span>
            <span>{formatDate(template.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Expanded actions */}
      {isSelected && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLoad();
            }}
            className="btn btn-primary text-sm py-1.5"
          >
            📥 {t('templates.load')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="btn btn-secondary text-sm py-1.5"
          >
            📋 {t('common.duplicate')}
          </button>
          {!template.isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="btn btn-danger text-sm py-1.5"
            >
              🗑️ {t('common.delete')}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
