/**
 * useScheduler Hook - Manages scheduled task state and operations
 * Extracted from SchedulerTab for cleaner separation of concerns
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';

export interface ScheduledTask {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    type: 'daily' | 'weekly' | 'monthly' | 'once';
    time: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    date?: string;
  };
  accountIds: string[];
  lastRun?: string;
  nextRun?: string;
}

export interface UseSchedulerReturn {
  // State
  tasks: ScheduledTask[];
  isEditing: boolean;
  editingTask: Partial<ScheduledTask> | null;
  isLoading: boolean;
  
  // Task CRUD operations
  loadTasks: () => Promise<void>;
  createTask: () => void;
  editTask: (task: ScheduledTask) => void;
  saveTask: () => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  runTaskNow: (id: string) => Promise<void>;
  
  // Modal control
  closeEditor: () => void;
  
  // Task form updates
  updateEditingTask: (updates: Partial<ScheduledTask>) => void;
  updateSchedule: (updates: Partial<ScheduledTask['schedule']>) => void;
  toggleDayOfWeek: (day: number) => void;
  
  // Utilities
  formatDate: (date?: string) => string;
  daysOfWeek: { value: number; label: string }[];
}

const DEFAULT_SCHEDULE = {
  type: 'daily' as const,
  time: '09:00',
  daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
};

export function useScheduler(): UseSchedulerReturn {
  const { t, language } = useTranslation();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<ScheduledTask> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const daysOfWeek = [
    { value: 0, label: t('scheduler.sun') },
    { value: 1, label: t('scheduler.mon') },
    { value: 2, label: t('scheduler.tue') },
    { value: 3, label: t('scheduler.wed') },
    { value: 4, label: t('scheduler.thu') },
    { value: 5, label: t('scheduler.fri') },
    { value: 6, label: t('scheduler.sat') },
  ];

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI?.getScheduledTasks?.();
      if (result) {
        setTasks(result);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load tasks on mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadTasks();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadTasks]);

  const createTask = useCallback(() => {
    setEditingTask({
      name: '',
      enabled: true,
      schedule: { ...DEFAULT_SCHEDULE },
      accountIds: [],
    });
    setIsEditing(true);
  }, []);

  const editTask = useCallback((task: ScheduledTask) => {
    setEditingTask({ ...task });
    setIsEditing(true);
  }, []);

  const saveTask = useCallback(async () => {
    if (!editingTask) return;

    try {
      if (editingTask.id) {
        await window.electronAPI?.updateScheduledTask?.(editingTask.id, editingTask);
      } else {
        await window.electronAPI?.createScheduledTask?.(editingTask);
      }
      await loadTasks();
      setIsEditing(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }, [editingTask, loadTasks]);

  const deleteTask = useCallback(async (id: string) => {
    if (!confirm(t('scheduler.confirmDelete'))) return;

    try {
      await window.electronAPI?.deleteScheduledTask?.(id);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [loadTasks, t]);

  const toggleTask = useCallback(async (id: string) => {
    try {
      await window.electronAPI?.toggleScheduledTask?.(id);
      await loadTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }, [loadTasks]);

  const runTaskNow = useCallback(async (id: string) => {
    try {
      await window.electronAPI?.runScheduledTaskNow?.(id);
    } catch (error) {
      console.error('Error running task:', error);
    }
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditing(false);
    setEditingTask(null);
  }, []);

  const updateEditingTask = useCallback((updates: Partial<ScheduledTask>) => {
    setEditingTask((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const updateSchedule = useCallback((updates: Partial<ScheduledTask['schedule']>) => {
    setEditingTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        schedule: { ...(prev.schedule ?? DEFAULT_SCHEDULE), ...updates },
      };
    });
  }, []);

  const toggleDayOfWeek = useCallback((day: number) => {
    setEditingTask((prev) => {
      if (!prev) return null;
      const current = prev.schedule?.daysOfWeek || [];
      const updated = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day];
      return {
        ...prev,
        schedule: { ...(prev.schedule ?? DEFAULT_SCHEDULE), daysOfWeek: updated },
      };
    });
  }, []);

  const formatDate = useCallback((date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }, [language]);

  return {
    tasks,
    isEditing,
    editingTask,
    isLoading,
    loadTasks,
    createTask,
    editTask,
    saveTask,
    deleteTask,
    toggleTask,
    runTaskNow,
    closeEditor,
    updateEditingTask,
    updateSchedule,
    toggleDayOfWeek,
    formatDate,
    daysOfWeek,
  };
}
