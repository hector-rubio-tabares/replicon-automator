import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  packagerConfig: {
    asar: true,
    prune: false,
    // Ignore function: return true to IGNORE, false to KEEP
    // Based on https://github.com/electron/packager/issues/1787
    ignore: function(path) {
      // KEEP these critical paths (must return false)
      if (!path) return false;
      if (path === '/dist' || path.startsWith('/dist/')) return false;
      if (path === '/node_modules' || path.startsWith('/node_modules/')) return false;
      if (path === '/package.json') return false;
      if (path === '/playwright-bin' || path.startsWith('/playwright-bin/')) return false;
      if (path === '/.env.production') return false;
      if (path === '/assets' || path.startsWith('/assets/')) return false;
      
      // IGNORE everything else (return true)
      if (path.startsWith('/src/')) return true;
      if (path.startsWith('/test/')) return true;
      if (path.startsWith('/scripts/')) return true;
      if (path.startsWith('/docs/')) return true;
      if (path.startsWith('/.github/')) return true;
      if (path.startsWith('/coverage/')) return true;
      if (path.startsWith('/out/')) return true;
      if (path.startsWith('/release/')) return true;
      if (path.startsWith('/.git/')) return true;
      if (path.endsWith('.ts') || path.endsWith('.tsx')) return true;
      if (path.endsWith('.test.js') || path.endsWith('.test.ts')) return true;
      if (path.includes('tsconfig') && path.endsWith('.json')) return true;
      if (path.includes('vite.config')) return true;
      if (path.includes('vitest.config')) return true;
      if (path.endsWith('.md') && path !== '/README.md') return true;
      if (path.match(/\.(eslintrc|prettierrc|gitignore)$/)) return true;
      
      // Default: KEEP everything else
      return false;
    },
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
