import { useCallback } from 'react';
import { generateId } from '@shared/utils';
import type { ConfigTabProps } from './ConfigTab.types';
import {
  addHorario,
  removeHorario,
  updateHorario,
} from '@shared/config-helpers';
import {
  HorariosSection,
  AppConfigSection,
} from './components';
export default function ConfigTab({
  horarios,
  onHorariosChange,
  appConfig,
  onAppConfigChange,
}: ConfigTabProps) {
  const handleAddHorario = useCallback(() => {
    onHorariosChange(addHorario(horarios, { id: generateId(), start_time: '9:00am', end_time: '12:00pm' }));
  }, [horarios, onHorariosChange]);
  const handleRemoveHorario = useCallback((id: string) => {
    onHorariosChange(removeHorario(horarios, id));
  }, [horarios, onHorariosChange]);
  const handleUpdateHorario = useCallback((id: string, field: 'start_time' | 'end_time', value: string) => {
    onHorariosChange(updateHorario(horarios, id, field, value));
  }, [horarios, onHorariosChange]);
  return (
    <div className="space-y-6 animate-fade-in">
      <HorariosSection
        horarios={horarios}
        onAddHorario={handleAddHorario}
        onRemoveHorario={handleRemoveHorario}
        onUpdateHorario={handleUpdateHorario}
      />
   
      <AppConfigSection
        appConfig={appConfig}
        onAppConfigChange={onAppConfigChange}
      />
    </div>
  );
}
