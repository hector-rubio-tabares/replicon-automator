import { useState, useEffect, useCallback } from 'react';
import type { TimeSlot, AccountMappings, AppConfig } from '../../shared/types';
import { DEFAULT_HORARIOS, DEFAULT_CONFIG, DEFAULT_MAPPINGS } from '../../shared/constants';

export function useConfig() {
  const [horarios, setHorariosState] = useState<TimeSlot[]>(DEFAULT_HORARIOS);
  const [mappings, setMappingsState] = useState<AccountMappings>(DEFAULT_MAPPINGS);
  const [appConfig, setAppConfigState] = useState<AppConfig>(DEFAULT_CONFIG);

  // Cargar configuración al inicio
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedHorarios = await window.electronAPI.getConfig('horarios');
        if (savedHorarios) {
          setHorariosState(savedHorarios as TimeSlot[]);
        }

        const savedMappings = await window.electronAPI.getConfig('mappings');
        if (savedMappings) {
          setMappingsState(savedMappings as AccountMappings);
        }

        const savedAppConfig = await window.electronAPI.getConfig('config');
        if (savedAppConfig) {
          setAppConfigState(savedAppConfig as AppConfig);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadConfig();
  }, []);

  const setHorarios = useCallback((newHorarios: TimeSlot[]) => {
    setHorariosState(newHorarios);
    window.electronAPI.setConfig('horarios', newHorarios);
  }, []);

  const setMappings = useCallback((newMappings: AccountMappings) => {
    setMappingsState(newMappings);
    window.electronAPI.setConfig('mappings', newMappings);
  }, []);

  const setAppConfig = useCallback((newConfig: AppConfig) => {
    setAppConfigState(newConfig);
    window.electronAPI.setConfig('config', newConfig);
  }, []);

  return {
    horarios,
    setHorarios,
    mappings,
    setMappings,
    appConfig,
    setAppConfig,
  };
}
