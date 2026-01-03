import { useState, useEffect, useCallback } from 'react';
import type { TimeSlot, AccountMappings, AppConfig } from '@shared/types';
import { DEFAULT_HORARIOS, DEFAULT_CONFIG, DEFAULT_MAPPINGS } from '@shared/constants';
import { getTranslation } from '../i18n';
const sendLog = (level: string, message: string) => {
  window.electronAPI?.sendLogToMain?.(level, 'useConfig', message);
};
export function useConfig() {
  const [horarios, setHorariosState] = useState<TimeSlot[]>(DEFAULT_HORARIOS);
  const [mappings, setMappingsState] = useState<AccountMappings>(DEFAULT_MAPPINGS);
  const [appConfig, setAppConfigState] = useState<AppConfig>(DEFAULT_CONFIG);
  useEffect(() => {
    const loadConfig = async () => {
      sendLog('INFO', 'Loading config...');
      try {
        const savedHorarios = await window.electronAPI.getConfig('horarios');
        if (savedHorarios) {
          setHorariosState(savedHorarios as TimeSlot[]);
          sendLog('INFO', 'Loaded horarios');
        }
        const savedMappings = await window.electronAPI.getConfig('mappings');
        if (savedMappings) {
          setMappingsState(savedMappings as AccountMappings);
          sendLog('INFO', 'Loaded mappings');
        }
        const savedAppConfig = await window.electronAPI.getConfig('config');
        if (savedAppConfig) {
          setAppConfigState(savedAppConfig as AppConfig);
          sendLog('INFO', 'Loaded appConfig');
        }
        sendLog('INFO', 'Config loaded successfully');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        sendLog('ERROR', getTranslation('errors.loadingConfig') + ': ' + errorMsg);
        sendLog('ERROR', `Failed to load config: ${errorMsg}`);
      }
    };
    loadConfig();
  }, []);
  const setHorarios = useCallback((newHorarios: TimeSlot[]) => {
    sendLog('INFO', 'Setting horarios...');
    try {
      setHorariosState(newHorarios);
      window.electronAPI.setConfig('horarios', newHorarios);
      sendLog('INFO', 'Horarios saved');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      sendLog('ERROR', `Failed to save horarios: ${errorMsg}`);
    }
  }, []);
  const setMappings = useCallback((newMappings: AccountMappings) => {
    sendLog('INFO', 'Setting mappings...');
    try {
      setMappingsState(newMappings);
      window.electronAPI.setConfig('mappings', newMappings);
      sendLog('INFO', 'Mappings saved');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      sendLog('ERROR', `Failed to save mappings: ${errorMsg}`);
    }
  }, []);
  const setAppConfig = useCallback((newConfig: AppConfig) => {
    sendLog('INFO', `Setting appConfig: ${JSON.stringify(newConfig)}`);
    try {
      setAppConfigState(newConfig);
      window.electronAPI.setConfig('config', newConfig);
      sendLog('INFO', 'AppConfig saved');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      sendLog('ERROR', `Failed to save appConfig: ${errorMsg}`);
    }
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
