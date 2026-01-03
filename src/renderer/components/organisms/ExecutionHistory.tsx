import { memo, useMemo, useState } from 'react';
import { useExecutionHistoryStore, type ExecutionRecord } from '@/stores/execution-history-store';
import { useTranslation } from '@/i18n';
import { FadeTransition } from '@/components/atoms/Transitions';
export const ExecutionHistory = memo(function ExecutionHistory() {
  const { t } = useTranslation();
  const { history, getStats, clearHistory } = useExecutionHistoryStore();
  const [selectedExecution, setSelectedExecution] = useState<ExecutionRecord | null>(null);
  // getStats is stable, history triggers recalc when it changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => getStats(), [getStats, history]);
  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  const statusColors: Record<ExecutionRecord['status'], string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    partial: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  const statusLabels: Record<ExecutionRecord['status'], string> = {
    success: t('automation.status.completed'),
    error: t('automation.status.error'),
    partial: t('common.warning'),
    cancelled: t('automation.status.stopped'),
  };
  return (
    <div className="space-y-6">
      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-100 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('history.totalExecutions')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalExecutions}</p>
        </div>
        <div className="bg-white dark:bg-dark-100 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('history.successRate')}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.successRate.toFixed(0)}%</p>
        </div>
        <div className="bg-white dark:bg-dark-100 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('history.accountsProcessed')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRowsProcessed}</p>
        </div>
        <div className="bg-white dark:bg-dark-100 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('history.avgDuration')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(stats.avgDuration)}</p>
        </div>
      </div>
      {}
      <div className="bg-white dark:bg-dark-100 rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('history.recentExecutions')}
          </h3>
          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm(t('history.confirmClear'))) {
                  clearHistory();
                }
              }}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              {t('history.clearHistory')}
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            <span className="text-4xl mb-2 block">📊</span>
            {t('history.noHistory')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {history.slice(0, 10).map((execution: ExecutionRecord) => (
              <button
                key={execution.id}
                onClick={() => setSelectedExecution(
                  selectedExecution?.id === execution.id ? null : execution
                )}
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 
                           transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[execution.status]}`}>
                      {statusLabels[execution.status]}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {execution.rowsProcessed}/{execution.rowsTotal} {t('automation.accounts')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {formatDate(execution.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDuration(execution.duration)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {selectedExecution?.id === execution.id ? '▲' : '▼'}
                    </p>
                  </div>
                </div>
                {}
                <FadeTransition show={selectedExecution?.id === execution.id}>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {execution.csvFileName && (
                        <div>
                          <span className="text-gray-500 dark:text-slate-400">{t('csv.title')}:</span>{' '}
                          <span className="text-gray-900 dark:text-white">{execution.csvFileName}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 dark:text-slate-400">{t('history.duration')}:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{formatDuration(execution.duration)}</span>
                      </div>
                      {execution.errorMessage && (
                        <div className="col-span-2">
                          <span className="text-red-500 dark:text-red-400">{t('common.error')}:</span>{' '}
                          <span className="text-red-700 dark:text-red-300">{execution.errorMessage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </FadeTransition>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
export const ExecutionHistoryCompact = memo(function ExecutionHistoryCompact() {
  const { t } = useTranslation();
  const { getStats, history } = useExecutionHistoryStore();
  // getStats is stable, history triggers recalc when it changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => getStats(), [getStats, history]);
  if (stats.totalExecutions === 0) return null;
  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {t('history.title')}
      </h3>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600 dark:text-slate-400">
          {t('history.lastRun')}: {stats.lastExecution 
            ? new Date(stats.lastExecution.timestamp).toLocaleDateString() 
            : '-'}
        </span>
        <span className="text-green-600 dark:text-green-400 font-medium">
          {stats.successRate.toFixed(0)}% {t('history.success')}
        </span>
        <span className="text-gray-500 dark:text-slate-500">
          {stats.totalExecutions} {t('history.totalExecutions').toLowerCase()}
        </span>
      </div>
    </div>
  );
});
