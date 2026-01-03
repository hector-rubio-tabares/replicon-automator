import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Header from './components/layout/Header';
import TabNavigation from './components/layout/TabNavigation';
import { ThemeToggle } from './components/organisms/ThemeToggle';
import { LanguageSelectorCompact } from './components/organisms/LanguageSelector';
import { UpdateChecker } from './components/organisms/UpdateChecker';
import { useAutomation } from './hooks/useAutomation';
import { useCSV } from './hooks/useCSV';
import { useConfig } from './hooks/useConfig';
import { useTranslation } from './i18n';
import { useToastStore } from './stores/toast-store';
import type { Credentials } from '@shared/types';

const AutomationTab = lazy(() => import('./components/pages/AutomationPage/AutomationTab'));
const CSVEditorTab = lazy(() => import('./components/pages/CSVEditorPage/CSVEditorTab'));
const ConfigTab = lazy(() => import('./components/pages/ConfigPage/ConfigTab'));
const LogsTab = lazy(() => import('./components/pages/LogsPage/LogsTab'));

const TabLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  </div>
);
type TabId = 'automation' | 'csv-editor' | 'config' | 'logs';
export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('automation');
  const [credentials, setCredentials] = useState<Credentials>({ email: '', password: '', rememberMe: false });
  const automation = useAutomation();
  const csv = useCSV();
  const config = useConfig();
  const { t } = useTranslation();
  const toast = useToastStore();
  const handleStart = useCallback(async () => {
    if (!csv.data?.length) {
      toast.warning(t('automation.requiresCsv'));
      return;
    }
    if (!credentials.email || !credentials.password) {
      toast.warning(t('automation.requiresCredentials'));
      return;
    }
    if (credentials.rememberMe) await window.electronAPI.saveCredentials(credentials);
    await automation.start({ credentials, csvData: csv.data, horarios: config.horarios, mappings: config.mappings, config: config.appConfig });
  }, [csv.data, credentials, automation, config.horarios, config.mappings, config.appConfig, t, toast]);
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'automation', label: t('nav.automation'), icon: '⚡' },
    { id: 'csv-editor', label: t('nav.csv'), icon: '📄' },
    { id: 'config', label: t('nav.config'), icon: '⚙️' },
    { id: 'logs', label: t('nav.dashboard'), icon: '📋' },
  ];
  useEffect(() => { window.electronAPI.loadCredentials().then(s => s && setCredentials(s)); }, []);
  useEffect(() => {
    window.electronAPI?.sendLogToMain?.('INFO', 'App', `Active tab: ${activeTab}`);
  }, [activeTab]);
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-dark-100 transition-colors overflow-auto">
      <Header status={automation.status} progress={automation.progress}>
        <div className="flex items-center gap-2">
          <LanguageSelectorCompact />
          <ThemeToggle />
        </div>
      </Header>
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6">
        <Suspense fallback={<TabLoader />}>
          {activeTab === 'automation' && <AutomationTab credentials={credentials} onCredentialsChange={setCredentials} csvData={csv.data} csvFileName={csv.fileName} onLoadCSV={csv.loadCSV} onStartAutomation={handleStart} onStopAutomation={automation.stop} onPauseAutomation={automation.togglePause} status={automation.status} progress={automation.progress} isPaused={automation.isPaused} logs={automation.logs} />}
          {activeTab === 'csv-editor' && <CSVEditorTab data={csv.data} onDataChange={csv.setData} onLoadCSV={csv.loadCSV} onSaveCSV={csv.saveCSV} mappings={config.mappings} />}
          {activeTab === 'config' && <ConfigTab horarios={config.horarios} onHorariosChange={config.setHorarios} mappings={config.mappings} onMappingsChange={config.setMappings} appConfig={config.appConfig} onAppConfigChange={config.setAppConfig} />}
          {activeTab === 'logs' && <LogsTab />}
        </Suspense>
      </main>
      <footer className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-200">
        <div className="flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          <UpdateChecker />
        </div>
      </footer>
    </div>
  );
}
