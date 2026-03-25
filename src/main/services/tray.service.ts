import { app, Tray, Menu, nativeImage, BrowserWindow, Notification } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Servicio de gestión del System Tray (bandeja del sistema).
 * 
 * @singleton - Mantiene referencia única a Tray, mainWindow y estado isQuitting.
 * Solo debe existir una instancia para controlar correctamente el tray.
 */
export class TrayService {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    const iconPath = this.getIconPath();
    const icon = nativeImage.createFromPath(iconPath);
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip('Replicon Automator');
    this.updateMenu();
    this.tray.on('double-click', () => {
      this.showWindow();
    });
    this.setupWindowHandlers();
    app.on('before-quit', () => {
      this.isQuitting = true;
    });
  }
  private getIconPath(): string {
    const candidates = [
      path.join(process.cwd(), 'assets', 'icon.ico'),
      path.join(process.cwd(), 'assets', 'icon.png'),
      path.join(process.resourcesPath || '', 'assets', 'icon.ico'),
      path.join(process.resourcesPath || '', 'assets', 'icon.png'),
      path.join(__dirname, '../../assets/icon.ico'),
      path.join(__dirname, '../../assets/icon.png'),
    ];
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      } catch {
        continue;
      }
    }
    return '';
  }
  private setupWindowHandlers(): void {
    if (!this.mainWindow) return;
    this.mainWindow.on('minimize', () => {
    });
  }
  updateMenu(status?: 'idle' | 'running' | 'completed' | 'error'): void {
    if (!this.tray) return;
    const statusText = status 
      ? status === 'running' ? '🟢 Running' 
        : status === 'completed' ? '✅ Completed'
        : status === 'error' ? '❌ Error'
        : '⚪ Idle'
      : '⚪ Idle';
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Replicon Automator', 
        enabled: false,
        icon: this.getIconPath() ? nativeImage.createFromPath(this.getIconPath()).resize({ width: 16, height: 16 }) : undefined
      },
      { type: 'separator' },
      { 
        label: statusText, 
        enabled: false 
      },
      { type: 'separator' },
      { 
        label: 'Show Window', 
        click: () => this.showWindow() 
      },
      { 
        label: 'Start Automation', 
        click: () => {
          this.showWindow();
          this.mainWindow?.webContents.send('tray-action', 'start');
        },
        enabled: status !== 'running'
      },
      { 
        label: 'Stop Automation', 
        click: () => {
          this.mainWindow?.webContents.send('tray-action', 'stop');
        },
        enabled: status === 'running'
      },
      { type: 'separator' },
      { 
        label: 'Quit', 
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);
    this.tray.setContextMenu(contextMenu);
  }
  showWindow(): void {
    if (!this.mainWindow) return;
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
  }
  hideWindow(): void {
    if (!this.mainWindow) return;
    this.mainWindow.hide();
  }
  showNotification(title: string, content: string): void {
    if (!this.tray) return;
    if (process.platform === 'win32') {
      this.tray.displayBalloon({
        title,
        content,
        iconType: 'info',
      });
    }
    else {
      if (Notification.isSupported()) {
        new Notification({
          title,
          body: content,
        }).show();
      }
    }
  }
  setStatus(status: 'idle' | 'running' | 'completed' | 'error'): void {
    this.updateMenu(status);
    const tooltips = {
      idle: 'Replicon Automator - Ready',
      running: 'Replicon Automator - Running...',
      completed: 'Replicon Automator - Completed',
      error: 'Replicon Automator - Error',
    };
    this.tray?.setToolTip(tooltips[status]);
  }
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

// Export singleton instance - Patrón B estándar
export const trayService = new TrayService();
