/**
 * TemplateList Component - Displays categorized list of templates
 */
import { memo } from 'react';
import { useTranslation } from '@/i18n';
import type { CSVTemplate } from '@/stores/csv-templates-store';
import { TemplateCard } from './TemplateCard';

interface TemplateListProps {
  defaultTemplates: CSVTemplate[];
  userTemplates: CSVTemplate[];
  selectedId: string | null;
  searchQuery: string;
  onSelect: (id: string) => void;
  onLoad: (template: CSVTemplate) => void;
  onDuplicate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp: number) => string;
}

export const TemplateList = memo(function TemplateList({
  defaultTemplates,
  userTemplates,
  selectedId,
  searchQuery,
  onSelect,
  onLoad,
  onDuplicate,
  onDelete,
  formatDate,
}: TemplateListProps) {
  const { t } = useTranslation();

  const isEmpty = defaultTemplates.length === 0 && userTemplates.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
        <span className="text-4xl block mb-2">📄</span>
        {searchQuery ? t('templates.noResults') : t('templates.noTemplates')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Default templates */}
      {defaultTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span>📌</span> {t('templates.defaultTemplates')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {defaultTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedId === template.id}
                onSelect={() => onSelect(template.id)}
                onLoad={() => onLoad(template)}
                onDuplicate={() => onDuplicate(template.id, template.name)}
                onDelete={() => onDelete(template.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* User templates */}
      {userTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span>👤</span> {t('templates.myTemplates')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedId === template.id}
                onSelect={() => onSelect(template.id)}
                onLoad={() => onLoad(template)}
                onDuplicate={() => onDuplicate(template.id, template.name)}
                onDelete={() => onDelete(template.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
