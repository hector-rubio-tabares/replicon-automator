import { DashboardStats } from '../../organisms/DashboardStats';
import { ExecutionHistoryCompact } from '../../organisms/ExecutionHistory';
export default function LogsTab() {
  return (
    <div className="animate-fade-in">
      <div className="space-y-6">
        <DashboardStats />
        <ExecutionHistoryCompact />
      </div>
    </div>
  );
}
