import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import type { CSVRow } from '@shared/types';
import type { CSVEditorTabProps, DayInfo, ExtDraftEntry } from './CSVEditorTab.types';
import {
  DEFAULT_HOLIDAY_CODE,
  DEFAULT_WEEKEND_CODE,
} from './CSVEditorTab.constants';
import {
  buildExtString,
  computeDayInfo,
  parseExtString as parseExtStringUtil,
} from './CSVEditorTab.utils';
import {
  ToolbarSection,
  DataTable,
  ExtrasEditorModal,
} from './components';
import { useCSVEditorStore } from '../../../stores/csv-editor-store';
export default function CSVEditorTab({
  data,
  onDataChange,
  mappings,
}: CSVEditorTabProps) {
  const {
    selectedYear,
    selectedMonth,
    setSelectedYearMonth,
    defaultAccount,
  } = useCSVEditorStore();
  const [dayInfo, setDayInfo] = useState<DayInfo[] | null>(null);
  const [extEditorRowIndex, setExtEditorRowIndex] = useState<number | null>(null);
  const [extDraftEntries, setExtDraftEntries] = useState<ExtDraftEntry[]>([
    { inicio: '', fin: '' },
  ]);
  const [extDraftError, setExtDraftError] = useState<string | null>(null);
  
  // Datos del mes seleccionado - MEMOIZADOS para evitar recalcular en cada render
  const displayYear = useMemo(() => selectedYear, [selectedYear]);
  const displayMonthIndex = useMemo(() => selectedMonth - 1, [selectedMonth]);
  const daysInSelectedMonth = useMemo(
    () => new Date(displayYear, displayMonthIndex + 1, 0).getDate(),
    [displayYear, displayMonthIndex]
  );
  
  // Navegación de mes: actualiza directamente el mes base en store
  const handleNavigateMonth = useCallback((offset: -1 | 0 | 1) => {
    if (offset === 0) {
      // Volver a mes actual
      const now = new Date();
      setSelectedYearMonth(now.getFullYear(), now.getMonth() + 1);
    } else {
      // Navegar ±1 mes
      const newDate = new Date(selectedYear, selectedMonth - 1 + offset, 1);
      setSelectedYearMonth(newDate.getFullYear(), newDate.getMonth() + 1);
    }
    // NO borrar la tabla - mantener datos y recalcular dayInfo automáticamente
  }, [selectedYear, selectedMonth, setSelectedYearMonth]);
  
  // Calcular si puede navegar (solo ±1 mes desde actual) - MEMOIZADO
  const { canGoPrevious, canGoNext } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const nextMonthDate = new Date(currentYear, currentMonth, 1);
    
    return {
      canGoPrevious: selectedYear > prevMonthDate.getFullYear() || 
                     (selectedYear === prevMonthDate.getFullYear() && selectedMonth > prevMonthDate.getMonth() + 1),
      canGoNext: selectedYear < nextMonthDate.getFullYear() || 
                 (selectedYear === nextMonthDate.getFullYear() && selectedMonth < nextMonthDate.getMonth() + 1)
    };
  }, [selectedYear, selectedMonth]);
  
  // SOLID: Single Responsibility - Actualizar estado de una fila según festivos/fines (MEMOIZADO)
  const updateRowState = useCallback((row: CSVRow, dayData: DayInfo): CSVRow => {
    const currentState = row.cuenta;
    
    // Si es fin de semana → FDS y borrar extras
    if (dayData.isWeekend) {
      return { ...row, cuenta: DEFAULT_WEEKEND_CODE, extras: '' };
    }
    
    // Si es festivo → V y borrar extras
    if (dayData.isHoliday) {
      return { ...row, cuenta: DEFAULT_HOLIDAY_CODE, extras: '' };
    }
    
    // Si era FDS/V pero ya no lo es → cambiar a W
    if (currentState === DEFAULT_WEEKEND_CODE || currentState === DEFAULT_HOLIDAY_CODE) {
      return { ...row, cuenta: defaultAccount };
    }
    
    // Mantener estado manual del usuario (y sus extras)
    return row;
  }, [defaultAccount]);
  
  // SOLID: Single Responsibility - Crear nueva fila con valores por defecto (MEMOIZADO)
  const createNewRow = useCallback((dayData: DayInfo): CSVRow => {
    if (dayData.isWeekend) {
      return { cuenta: DEFAULT_WEEKEND_CODE, extras: '' };
    }
    if (dayData.isHoliday) {
      return { cuenta: DEFAULT_HOLIDAY_CODE, extras: '' };
    }
    return { cuenta: defaultAccount, extras: '' };
  }, [defaultAccount]);
  
  // Ref para evitar loops infinitos en el effect
  const isAdjustingRef = useRef(false);
  
  useEffect(() => {
    window.setTimeout(() => setDayInfo(null), 0);
  }, [selectedYear, selectedMonth]);

  // Auto-ajustar datos al cambiar mes: agregar/quitar filas según días del mes
  useEffect(() => {
    const adjustDataToMonth = async () => {
      if (!data || data.length === 0 || isAdjustingRef.current) {
        setDayInfo(null);
        return;
      }
      
      isAdjustingRef.current = true;

      try {
        const currentDays = data.length;
        const targetDays = daysInSelectedMonth;
        
        // Calcular dayInfo para mostrar fechas correctas
        const info = await computeDayInfo(displayYear, displayMonthIndex, targetDays);
        
        // Aplicar lógica según diferencia de días (usando funciones memoizadas)
        let newData: CSVRow[];
        
        if (currentDays === targetDays) {
          // Mismo número: solo actualizar festivos/fines
          newData = data.map((row, i) => updateRowState(row, info[i]));
        } else if (currentDays > targetDays) {
          // Menos días: recortar y actualizar
          newData = data.slice(0, targetDays).map((row, i) => updateRowState(row, info[i]));
        } else {
          // Más días: actualizar existentes + agregar nuevos
          newData = data.map((row, i) => updateRowState(row, info[i]));
          
          for (let i = currentDays; i < targetDays; i++) {
            newData.push(createNewRow(info[i]));
          }
        }
        
        onDataChange(newData);
        setDayInfo(info);
      } finally {
        isAdjustingRef.current = false;
      }
    };
    adjustDataToMonth();
  }, [displayYear, displayMonthIndex, daysInSelectedMonth, data, onDataChange, updateRowState, createNewRow]);
  const buildMonthlyTemplateAuto = useCallback(async () => {
    const daysInMonth = daysInSelectedMonth;
    const existing = data ?? [];
    
    // SOLID: Usar función centralizada de utils
    const info = await computeDayInfo(displayYear, displayMonthIndex, daysInMonth);
    
    const rows: CSVRow[] = [];
    for (let d = 0; d < daysInMonth; d++) {
      const dayData = info[d];
      const prevExtras = existing[d]?.extras ?? '';
      
      if (dayData.isWeekend) {
        rows.push({ cuenta: DEFAULT_WEEKEND_CODE, extras: prevExtras });
      } else if (dayData.isHoliday) {
        rows.push({ cuenta: DEFAULT_HOLIDAY_CODE, extras: prevExtras });
      } else {
        rows.push({ cuenta: defaultAccount, extras: prevExtras });
      }
    }
    
    onDataChange(rows);
    setDayInfo(info);
  }, [displayMonthIndex, displayYear, daysInSelectedMonth, data, defaultAccount, onDataChange]);
  const parseExtString = useCallback(
    (extras: string) => parseExtStringUtil(extras),
    []
  );
  const handleAddRow = useCallback(() => {
    const newRow: CSVRow = { cuenta: 'W', extras: '' };
    onDataChange([...(data || []), newRow]);
    setDayInfo(null);
  }, [data, onDataChange]);
  const handleClearTable = useCallback(() => {
    onDataChange([]);
    setDayInfo(null);
  }, [onDataChange]);
  const handleRemoveRow = useCallback((index: number) => {
    if (!data) return;
    const newData = data.filter((_, i) => i !== index);
    onDataChange(newData);
    setDayInfo(null);
  }, [data, onDataChange]);
  const handleUpdateRow = useCallback((index: number, field: keyof CSVRow, value: string) => {
    if (!data) return;
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onDataChange(newData);
  }, [data, onDataChange]);
  const openExtEditorForRow = useCallback((rowIndex: number) => {
    const current = data?.[rowIndex]?.extras ?? '';
    const parsed = parseExtString(current);
    if (parsed.entries.length > 0 && !parsed.error) {
      setExtDraftEntries(parsed.entries);
      setExtDraftError(null);
    } else {
      setExtDraftEntries([{ inicio: '', fin: '' }]);
      setExtDraftError(parsed.error);
    }
    setExtEditorRowIndex(rowIndex);
  }, [data, parseExtString]);
  const closeExtEditor = useCallback(() => {
    setExtEditorRowIndex(null);
    setExtDraftError(null);
  }, []);
  const applyExtEditor = useCallback(() => {
    if (extEditorRowIndex === null) return;
    const nextExtras = buildExtString(extDraftEntries);
    const validation = parseExtString(nextExtras);
    if (nextExtras && validation.error) {
      setExtDraftError(validation.error);
      return;
    }
    handleUpdateRow(extEditorRowIndex, 'extras', nextExtras);
    closeExtEditor();
  }, [extEditorRowIndex, extDraftEntries, parseExtString, handleUpdateRow, closeExtEditor]);
  const handleConfigureDayManually = useCallback((rowIndex: number) => {
    handleUpdateRow(rowIndex, 'cuenta', DEFAULT_WEEKEND_CODE);
    openExtEditorForRow(rowIndex);
  }, [handleUpdateRow, openExtEditorForRow]);
  return (
    <div className="space-y-6 animate-fade-in">
      {}
      <ToolbarSection
        onNavigateMonth={handleNavigateMonth}
        selectedYear={displayYear}
        selectedMonthIndex={displayMonthIndex}
        daysInSelectedMonth={daysInSelectedMonth}
        onGenerate={() => void buildMonthlyTemplateAuto()}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />
      {}
      <DataTable
        data={data || []}
        dayInfo={dayInfo}
        mappings={mappings}
        selectedMonthIndex={displayMonthIndex}
        selectedYear={displayYear}
        daysInSelectedMonth={daysInSelectedMonth}
        parseExtString={parseExtString}
        onUpdateRow={handleUpdateRow}
        onRemoveRow={handleRemoveRow}
        onOpenExtEditor={openExtEditorForRow}
        onConfigureManually={handleConfigureDayManually}
        onAddRow={handleAddRow}
        onClearTable={handleClearTable}
      />
      {}
      {extEditorRowIndex !== null && (
        <ExtrasEditorModal
          rowIndex={extEditorRowIndex}
          entries={extDraftEntries}
          error={extDraftError}
          onEntriesChange={setExtDraftEntries}
          onApply={applyExtEditor}
          onClose={closeExtEditor}
        />
      )}
    </div>
  );
}
