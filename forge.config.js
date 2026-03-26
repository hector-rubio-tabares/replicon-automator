import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  packagerConfig: {
    asar: true,
    // NO ignore function - let electron-packager include everything by default
    // This ensures dist/ is always included on both Windows and Linux
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
