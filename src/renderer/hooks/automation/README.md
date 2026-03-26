# Automation Hooks

React Query hooks for managing the automation lifecycle in the renderer process.

## Architecture

The automation system uses a dual-state approach:

1. **React Query Mutations** - Handle async IPC operations (start/stop/pause)
   - Provides mutation states: `idle` → `pending` → `success` / `error`
   - Integrates with execution history store
   - Handles errors and success callbacks

2. **Zustand Store** - Holds real-time state from IPC events
   - Updated by worker thread via IPC events
   - Stores progress, logs, and current status
   - Components subscribe via selectors

## Available Hooks

### `useAutomationMutation()`

Mutation hook for starting automation. Returns React Query mutation object.

```tsx
const automationMutation = useAutomationMutation();

// Start automation
automationMutation.mutate({
  credentials: { email, password, rememberMe },
  csvData: rows,
  horarios: timeSlots,
  mappings: accountMappings,
  config: appConfig,
});

// Mutation states
automationMutation.status;      // 'idle' | 'pending' | 'success' | 'error'
automationMutation.isPending;   // boolean
automationMutation.isSuccess;   // boolean
automationMutation.isError;     // boolean
automationMutation.error;       // Error | null
```

### `useStopAutomation()`

Mutation hook for stopping the running automation.

```tsx
const stopMutation = useStopAutomation();

stopMutation.mutate(); // Stops automation and records as 'cancelled'
```

### `usePauseAutomation()`

Mutation hook for pausing/resuming automation.

```tsx
const pauseMutation = usePauseAutomation();

pauseMutation.mutate(); // Toggles between 'running' and 'paused'
```

### `useAutomationStatus()`

Hook for real-time automation status from IPC events.

```tsx
const { 
  status,       // 'idle' | 'running' | 'paused' | 'completed' | 'error'
  progress,     // Full AutomationProgress object or null
  currentDay,   // number
  totalDays,    // number
  currentEntry, // number
  totalEntries, // number
  message,      // string
} = useAutomationStatus();
```

### `useAutomationLogs()`

Hook for real-time log streaming from worker.

```tsx
const { logs, clearLogs } = useAutomationLogs();

// logs: LogEntry[] - Array of timestamped log entries
// clearLogs: () => void - Clear all logs
```

## State Flow

```
Component calls mutation.mutate()
          ↓
window.electronAPI.startAutomation() (IPC)
          ↓
Main process → Worker thread
          ↓
Worker emits IPC events:
  - automation:progress
  - automation:log
  - automation:complete
  - automation:error
          ↓
Preload bridge listeners catch events
          ↓
useAutomationStatus/Logs hooks update Zustand store
          ↓
Components re-render with new state
```

## Integration Points

### IPC Channels (from `src/common/ipc.ts`)
- `AUTOMATION_START` - Start automation
- `AUTOMATION_STOP` - Stop automation  
- `AUTOMATION_PAUSE` - Pause/resume
- `AUTOMATION_PROGRESS` - Progress events
- `AUTOMATION_LOG` - Log events
- `AUTOMATION_COMPLETE` - Completion event
- `AUTOMATION_ERROR` - Error event

### Zustand Store (`src/renderer/stores/automation-store.ts`)
- `progress` - Current AutomationProgress or null
- `logs` - Array of LogEntry objects
- `setProgress()` - Update progress
- `addLog()` - Add log entry
- `clearLogs()` - Clear all logs
- `reset()` - Reset all state

### Execution History Store
- Automatically records all automation runs
- Tracks success/error/cancelled status
- Provides execution statistics

## Usage Example

See [example.tsx](./example.tsx) for a complete component example.

## TypeScript

All hooks are fully typed. Import types from:

```tsx
import type {
  AutomationResult,
  UseAutomationMutationReturn,
  UseAutomationStatusReturn,
  UseAutomationLogsReturn,
} from '@renderer/hooks/automation';
```

## Error Handling

Mutations automatically:
- Record errors in execution history
- Provide error state via `mutation.error`
- Allow custom error handling via `onError` callback

```tsx
const mutation = useAutomationMutation();

if (mutation.isError) {
  console.error('Automation failed:', mutation.error.message);
}
```

## Cleanup

All IPC event listeners are automatically cleaned up on component unmount via `useEffect` return functions.
