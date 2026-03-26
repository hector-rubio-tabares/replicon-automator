import type { TimeSlot, AppConfig } from '@shared/types';
export interface ConfigTabProps {
  horarios: TimeSlot[];
  onHorariosChange: (horarios: TimeSlot[]) => void;
  appConfig: AppConfig;
  onAppConfigChange: (config: AppConfig) => void;
}
export interface AccountItemProps {
  code: string;
  account: string;
  onRemove: () => void;
}
