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
      
      // Normalize path (remove leading slash if present)
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      
      // Always include dist/ (compiled code - CRITICAL)
      if (normalizedPath.startsWith('dist')) return false;
      
      // Always include node_modules (dependencies)
      if (normalizedPath.startsWith('node_modules')) return false;
      
      // Always include critical files
      if (normalizedPath.startsWith('assets')) return false;
      if (normalizedPath.startsWith('playwright-bin')) return false;
      if (normalizedPath === 'package.json') return false;
      if (normalizedPath === '.env.production') return false;
      
      // Ignore development and source files
      if (normalizedPath.match(/^(src|scripts|docs|\.github|coverage|test|out|release)($|\/)/)) return true;
      if (normalizedPath.match(/\.(ts|tsx|test\.js|spec\.js)$/)) return true;
      if (normalizedPath.match(/^\.git($|\/)/)) return true;
      if (normalizedPath.match(/^\.(gitignore|eslintrc|prettierrc|env\.example)/)) return true;
      if (normalizedPath.match(/tsconfig.*\.json$/)) return true;
      if (normalizedPath.match(/vitest\.config\./)) return true;
      if (normalizedPath.match(/vite\.config\./)) return true;
      
      // Include everything else by default
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
