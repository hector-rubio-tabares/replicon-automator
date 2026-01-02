/**
 * Shortcuts Controller - Centraliza los atajos de teclado globales
 */

import { globalShortcut, BrowserWindow } from 'electron';

type ShortcutAction = 
  | 'load-csv'
  | 'save-csv'
  | 'run-automation'
  | 'toggle-theme'
  | 'toggle-language'
  | 'show-shortcuts'
  | 'go-to-tab';

interface ShortcutConfig {
  accelerator: string;
  action: ShortcutAction;
  payload?: number;
}

const SHORTCUTS: ShortcutConfig[] = [
  { accelerator: 'CommandOrControl+O', action: 'load-csv' },
  { accelerator: 'CommandOrControl+S', action: 'save-csv' },
  { accelerator: 'CommandOrControl+R', action: 'run-automation' },
  { accelerator: 'CommandOrControl+Shift+T', action: 'toggle-theme' },
  { accelerator: 'CommandOrControl+Shift+L', action: 'toggle-language' },
  { accelerator: 'Shift+/', action: 'show-shortcuts' },
  { accelerator: 'CommandOrControl+1', action: 'go-to-tab', payload: 0 },
  { accelerator: 'CommandOrControl+2', action: 'go-to-tab', payload: 1 },
  { accelerator: 'CommandOrControl+3', action: 'go-to-tab', payload: 2 },
  { accelerator: 'CommandOrControl+4', action: 'go-to-tab', payload: 3 },
];

export function setupGlobalShortcuts(getMainWindow: () => BrowserWindow | null): void {
  SHORTCUTS.forEach(({ accelerator, action, payload }) => {
    globalShortcut.register(accelerator, () => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return;

      const channel = `shortcut:${action}`;
      
      if (payload !== undefined) {
        mainWindow.webContents.send(channel, payload);
      } else {
        mainWindow.webContents.send(channel);
      }
    });
  });
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
}
