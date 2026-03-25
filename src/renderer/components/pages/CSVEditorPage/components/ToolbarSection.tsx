import { memo } from 'react';
import { MONTHS_ES } from '../CSVEditorTab.constants';
export interface ToolbarSectionProps {
  onNavigateMonth: (offset: -1 | 0 | 1) => void; // 0 = volver a hoy
  selectedYear: number;
  selectedMonthIndex: number;
  daysInSelectedMonth: number;
  onGenerate: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}
const ToolbarSection = memo(function ToolbarSection({
  onNavigateMonth,
  selectedYear,
  selectedMonthIndex,
  daysInSelectedMonth,
  onGenerate,
  canGoPrevious,
  canGoNext,
}: ToolbarSectionProps) {
  const selectedMonthLabel = MONTHS_ES[selectedMonthIndex];
  
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateMonth(-1)}
            disabled={!canGoPrevious}
            className="btn btn-secondary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Mes anterior"
          >
            ‹‹
          </button>
          <button
            onClick={() => onNavigateMonth(0)}
            className="btn btn-secondary px-3 py-1 text-sm"
            title="Volver al mes actual"
          >
            Hoy
          </button>
          <button
            onClick={() => onNavigateMonth(1)}
            disabled={!canGoNext}
            className="btn btn-secondary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Mes siguiente"
          >
            ››
          </button>
          <span className="text-gray-700 dark:text-slate-300 font-medium min-w-32 text-center">
            {selectedMonthLabel} {selectedYear}
          </span>
          <span className="text-gray-500 dark:text-slate-400 text-sm">
            ({daysInSelectedMonth} días)
          </span>
        </div>
        <button
          onClick={onGenerate}
          className="btn btn-primary px-6"
          title="Generar calendario del mes"
        >
          🗓️ Generar
        </button>
      </div>
    </div>
  );
});
export default ToolbarSection;
