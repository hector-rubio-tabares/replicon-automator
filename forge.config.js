import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  packagerConfig: {
    asar: true,
    asarUnpack: [
      '**/node_modules/playwright/**/*',
    ],
    icon: join(__dirname, 'assets', 'icon'),
    executableName: 'Replicon Automator',
    appBundleId: 'com.hdrt.replicon-automator',
    appCopyright: 'Copyright © 2026 Hector David Rubio Tabares',
    extraResource: [
      join(__dirname, 'playwright-bin'),
      join(__dirname, '.env.production'),
    ],
    // DO NOT ignore dist/ - it contains the compiled app
    ignore: (path) => {
      if (!path) return false;
      
      // Always include dist/ (compiled code)
      if (path.startsWith('/dist')) return false;
      
      // Always include node_modules (dependencies)
      if (path.startsWith('/node_modules')) return false;
      
      // Always include assets
      if (path.startsWith('/assets')) return false;
      
      // Always include playwright-bin
      if (path.startsWith('/playwright-bin')) return false;
      
      // Ignore common dev files
      if (path.match(/^\/(src|scripts|docs|\.github|coverage|test|\.vscode|\.git)/)) return true;
      if (path.match(/\.(ts|tsx|test\.js|spec\.js|md)$/)) return true;
      if (path.match(/^\/\.(gitignore|eslintrc|prettierrc|env\.example)/)) return true;
      if (path.endsWith('tsconfig.json') || path.endsWith('tsconfig.main.json')) return true;
      
      // Include everything else
      return false;
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'RepliconAutomator',
        setupIcon: join(__dirname, 'assets', 'icon.ico'),
        iconUrl: 'https://raw.githubusercontent.com/hector26rubio2/replicon-automator/main/assets/icon.ico',
        // loadingGif: Opcional - removido por ahora
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      config: {
        name: 'Replicon.Automator.Portable',
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'hector26rubio2',
          name: 'replicon-automator',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
};
