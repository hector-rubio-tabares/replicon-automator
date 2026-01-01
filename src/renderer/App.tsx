import { useState, useEffect } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import AutomationTab from './components/tabs/AutomationTab';
import CSVEditorTab from './components/tabs/CSVEditorTab';
import ConfigTab from './components/tabs/ConfigTab';
import LogsTab from './components/tabs/LogsTab';
import { useAutomation } from './hooks/useAutomation';
import { useCSV } from './hooks/useCSV';
import { useConfig } from './hooks/useConfig';
import type { Credentials } from './shared/types';

type TabId = 'automation' | 'csv-editor' | 'config' | 'logs';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('automation');
  const [credentials, setCredentials] = useState<Credentials>({ email: '', password: '', rememberMe: false });
  const automation = useAutomation();
  const csv = useCSV();
  const config = useConfig();

  useEffect(() => { window.electronAPI.loadCredentials().then(s => s && setCredentials(s)); }, []);

  const tabs = [
    { id: 'automation' as TabId, label: 'Automatizacion', icon: '' },
    { id: 'csv-editor' as TabId, label: 'Editor CSV', icon: '' },
    { id: 'config' as TabId, label: 'Configuracion', icon: '' },
    { id: 'logs' as TabId, label: 'Logs', icon: '' },
  ];

  const handleStart = async () => {
    if (!csv.data?.length) return alert('Carga un CSV');
    if (!credentials.email || !credentials.password) return alert('Ingresa credenciales');
    if (credentials.rememberMe) await window.electronAPI.saveCredentials(credentials);
    await automation.start({ credentials, csvData: csv.data, horarios: config.horarios, mappings: config.mappings, config: config.appConfig });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header status={automation.status} progress={automation.progress} />
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'automation' && <AutomationTab credentials={credentials} onCredentialsChange={setCredentials} csvData={csv.data} csvFileName={csv.fileName} onLoadCSV={csv.loadCSV} onStartAutomation={handleStart} onStopAutomation={automation.stop} onPauseAutomation={automation.togglePause} status={automation.status} progress={automation.progress} isPaused={automation.isPaused} />}
        {activeTab === 'csv-editor' && <CSVEditorTab data={csv.data} onDataChange={csv.setData} onLoadCSV={csv.loadCSV} onSaveCSV={csv.saveCSV} mappings={config.mappings} />}
        {activeTab === 'config' && <ConfigTab horarios={config.horarios} onHorariosChange={config.setHorarios} mappings={config.mappings} onMappingsChange={config.setMappings} appConfig={config.appConfig} onAppConfigChange={config.setAppConfig} />}
        {activeTab === 'logs' && <LogsTab logs={automation.logs} />}
      </main>
      <footer className="p-4 text-center text-slate-500 text-sm border-t border-slate-800">Replicon Automator v3.0</footer>
    </div>
  );
}
