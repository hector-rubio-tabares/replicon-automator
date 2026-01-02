/**
 * SaveTemplateDialog Component - Dialog for saving new templates
 */
import { memo } from 'react';
import { useTranslation } from '@/i18n';

interface SaveTemplateDialogProps {
  name: string;
  description: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const SaveTemplateDialog = memo(function SaveTemplateDialog({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSave,
  onCancel,
}: SaveTemplateDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
        {t('templates.saveNew')}
      </h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder={t('templates.namePlaceholder')}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full"
          autoFocus
        />
        <input
          type="text"
          placeholder={t('templates.descPlaceholder')}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full"
        />
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={!name.trim()}
            className="btn btn-primary"
          >
            {t('common.save')}
          </button>
          <button onClick={onCancel} className="btn btn-secondary">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
});
