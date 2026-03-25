# Migration Guide: From useAutomation to React Query Hooks

This guide helps you migrate from the old `useAutomation` hook to the new React Query-based automation hooks.

## Old Approach (useAutomation)

```tsx
import { useAutomation } from '@renderer/hooks';

function MyComponent() {
  const { status, progress, logs, isPaused, start, stop, togglePause } = useAutomation();
  
  const handleStart = () => {
    start(request);
  };
  
  return (
    <div>
      <div>Status: {status}</div>
      <button onClick={handleStart}>Start</button>
    </div>
  );
}
```

## New Approach (React Query + Zustand)

```tsx
import { 
  useAutomationMutation,
  useStopAutomation,
  usePauseAutomation,
  useAutomationStatus,
  useAutomationLogs 
} from '@renderer/hooks/automation';

function MyComponent() {
  // Mutations for actions
  const automationMutation = useAutomationMutation();
  const stopMutation = useStopAutomation();
  const pauseMutation = usePauseAutomation();
  
  // Real-time state
  const { status, progress, currentEntry, totalEntries, message } = useAutomationStatus();
  const { logs } = useAutomationLogs();
  
  const handleStart = () => {
    automationMutation.mutate(request);
  };
  
  const handleStop = () => {
    stopMutation.mutate();
  };
  
  const handlePause = () => {
    pauseMutation.mutate();
  };
  
  return (
    <div>
      {/* Use mutation.status for loading state */}
      <div>Mutation: {automationMutation.status}</div>
      
      {/* Use status from useAutomationStatus for real-time state */}
      <div>Automation: {status}</div>
      
      <button 
        onClick={handleStart}
        disabled={automationMutation.isPending}
      >
        {automationMutation.isPending ? 'Starting...' : 'Start'}
      </button>
      
      <button onClick={handleStop}>Stop</button>
      <button onClick={handlePause}>Pause/Resume</button>
      
      {/* Error handling is more explicit */}
      {automationMutation.isError && (
        <div>Error: {automationMutation.error.message}</div>
      )}
    </div>
  );
}
```

## Key Differences

### 1. State Sources

| Old | New |
|-----|-----|
| Local component state | Zustand store (shared across components) |
| Manual IPC subscription | Automatic IPC subscription in hooks |
| All state in one hook | Separate concerns (mutation vs status) |

### 2. Mutations

| Old | New |
|-----|-----|
| `start(request)` | `automationMutation.mutate(request)` |
| `stop()` | `stopMutation.mutate()` |
| `togglePause()` | `pauseMutation.mutate()` |

### 3. Status Properties

| Old | New |
|-----|-----|
| `status` | `status` (from useAutomationStatus) |
| `progress` | `progress` (from useAutomationStatus) |
| `logs` | `logs` (from useAutomationLogs) |
| `isPaused` | Check `status === 'paused'` |

### 4. Loading States

```tsx
// Old
<button disabled={status === 'running'}>Start</button>

// New
<button disabled={automationMutation.isPending || status === 'running'}>
  Start
</button>
```

### 5. Error Handling

```tsx
// Old - errors were added to logs
useEffect(() => {
  const errorLog = logs.find(log => log.level === 'error');
  if (errorLog) {
    // Handle error
  }
}, [logs]);

// New - explicit error state
if (automationMutation.isError) {
  console.error(automationMutation.error);
}
```

## Benefits of New Approach

1. **Better separation of concerns**
   - Mutations handle async operations
   - Zustand handles real-time state
   - Components are simpler

2. **Shared state**
   - Multiple components can access automation state
   - No prop drilling needed

3. **Better typing**
   - Full TypeScript support
   - Explicit return types

4. **React Query features**
   - Built-in loading/error states
   - Automatic retries (if configured)
   - Request deduplication
   - Cache management

5. **Easier testing**
   - Mock mutations independently
   - Test store updates separately
   - No complex component state

## Gradual Migration

You can migrate gradually:

1. Keep old `useAutomation` for existing components
2. Use new hooks in new components
3. Migrate old components one by one
4. Remove old hook when done

Both approaches can coexist because:
- IPC events are broadcast to all listeners
- Zustand store is independent
- No conflicts between implementations
