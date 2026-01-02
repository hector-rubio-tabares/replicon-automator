/**
 * TemplateManager Component - Refactored using sub-components and useTemplates hook
 */
import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTemplates } from '@/hooks/useTemplates';
import { useCSVTemplatesStore, type CSVTemplate } from '@/stores/csv-templates-store';
import { useTranslation } from '@/i18n';
import type { CSVRow } from '@shared/types';
import { TemplateList } from './TemplateList';
import { TemplateToolbar } from './TemplateToolbar';
import { SaveTemplateDialog } from './SaveTemplateDialog';

interface TemplateManagerProps {
  currentData: CSVRow[] | null;
  onLoadTemplate: (data: CSVRow[]) => void;
  onClose?: () => void;
}

export const TemplateManager = memo(function TemplateManager({
  currentData,
  onLoadTemplate,
  onClose,
}: TemplateManagerProps) {
  const {
    defaultTemplates,
    userTemplates,
    searchQuery,
    selectedId,
    setSearchQuery,
    toggleSelection,
    loadTemplate,
    deleteTemplate,
    duplicateTemplate,
    exportTemplates,
    importTemplates,
    formatDate,
    saveTemplate,
  } = useTemplates();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  const handleSaveTemplate = useCallback(() => {
    if (!newTemplateName.trim() || !currentData?.length) return;
    saveTemplate(newTemplateName.trim(), currentData, newTemplateDesc.trim() || undefined);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setShowSaveDialog(false);
  }, [newTemplateName, newTemplateDesc, currentData, saveTemplate]);

  const handleLoadTemplate = useCallback(
    (template: CSVTemplate) => {
      onLoadTemplate(loadTemplate(template));
      onClose?.();
    },
    [onLoadTemplate, loadTemplate, onClose]
  );

  const handleCancelSave = useCallback(() => {
    setShowSaveDialog(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
  }, []);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <TemplateToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hasData={Boolean(currentData?.length)}
        hasUserTemplates={userTemplates.length > 0}
        onSaveClick={() => setShowSaveDialog(true)}
        onImport={() => void importTemplates()}
        onExport={exportTemplates}
      />

      {/* Save dialog */}
      {showSaveDialog && (
        <SaveTemplateDialog
          name={newTemplateName}
          description={newTemplateDesc}
          onNameChange={setNewTemplateName}
          onDescriptionChange={setNewTemplateDesc}
          onSave={handleSaveTemplate}
          onCancel={handleCancelSave}
        />
      )}

      {/* Template lists */}
      <TemplateList
        defaultTemplates={defaultTemplates}
        userTemplates={userTemplates}
        selectedId={selectedId}
        searchQuery={searchQuery}
        onSelect={toggleSelection}
        onLoad={handleLoadTemplate}
        onDuplicate={duplicateTemplate}
        onDelete={deleteTemplate}
        formatDate={formatDate}
      />
    </div>
  );
});

// Compact template selector for quick access
interface TemplateSelectorProps {
  onSelectTemplate: (data: CSVRow[]) => void;
  className?: string;
}

export const TemplateSelector = memo(function TemplateSelector({
  onSelectTemplate,
  className = '',
}: TemplateSelectorProps) {
  const { t } = useTranslation();
  const { templates } = useCSVTemplatesStore();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (template: CSVTemplate) => {
      onSelectTemplate(JSON.parse(JSON.stringify(template.data)));
      setIsOpen(false);
    },
    [onSelectTemplate]
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <span>📄</span>
        {t('templates.templates')}
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            <div
              className="fixed w-72 bg-white dark:bg-dark-100 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-[9999] overflow-hidden"
              style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
            >
              <div className="max-h-80 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-700 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {template.name}
                      </span>
                      {template.isDefault && (
                        <span className="px-1 py-0.5 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                          {t('templates.default')}
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {template.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
});

export default TemplateManager;
