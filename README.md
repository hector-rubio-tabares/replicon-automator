# Replicon Automator v3

🚀 **Modern desktop app to automate time entry in Replicon**

[![Version](https://img.shields.io/github/v/release/hector-rubio-tabares/replicon-automator?label=version&color=blue)](https://github.com/hector-rubio-tabares/replicon-automator/releases/latest)
[![Node](https://img.shields.io/badge/node-22.14.0-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/electron-39-purple.svg)](https://www.electronjs.org/)

## ✨ Features

- **🎯 Electron + React** - Modern and responsive UI
- **⚡ Playwright** - Ultra-fast web automation (no external drivers)
- **📊 Built-in CSV Editor** - Create and edit data directly in the app
- **📝 Predefined Templates** - Standard week, vacations, mixed projects
- **⏰ Configurable Schedules** - Define your work time blocks
- **🏢 Account Mapping** - Configure abbreviations and projects
- **📋 Real-time Logs** - Monitor automation progress
- **🔐 Secure Credentials** - Save credentials encrypted with Windows Credential Manager
- **🔄 Auto-updates** - App updates automatically when new versions are released

## 🖥️ For End Users

### Installation

1. Download `Replicon.Automator.Setup.exe` from [Releases](https://github.com/hector-rubio-tabares/replicon-automator/releases)
2. Run the installer
3. Open the app

**That's it!** No Node.js, npm, or additional software required.

---

## 🛠️ For Developers

### Requirements

- **Node.js 22.14.0** (recommended via [Volta](https://volta.sh/) or nvm)
- npm (comes with Node.js)

### Setup

```bash
# 1. Clone repository
git clone https://github.com/hector-rubio-tabares/replicon-automator.git
cd replicon-automator

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (first time only)
npx playwright install chromium

# 4. Run in development mode
npm run dev

# 5. Build for production
npm run dist:win
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start app in development mode (hot reload) |
| `npm run build` | Build renderer and main process |
| `npm run dist:win` | Build and create Windows installer |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests with Vitest |

### Debug Mode (VS Code)

Press `F5` to start debugging with breakpoints. The debug configuration:
- Runs Vite dev server
- Builds main process with source maps
- Launches Electron with `--inspect=9229`

### Tech Stack

| Technology | Usage |
|------------|-------|
| Electron 39 | Desktop app framework |
| React 18 | Renderer UI |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Playwright | Web automation |
| Vite | Renderer build tool |
| Vitest | Testing |

## 📁 Project Structure

```
RepliconAutomatorV3/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts          # Entry point
│   │   ├── preload.ts        # Secure renderer<->main bridge
│   │   ├── controllers/      # IPC handlers
│   │   └── services/
│   │       ├── automation.service.ts   # Playwright automation
│   │       ├── csv.service.ts          # CSV handling
│   │       └── credentials.service.ts  # Secure credentials
│   │
│   ├── renderer/             # UI (React)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── atoms/        # Basic UI components
│   │   │   ├── molecules/    # Composite components
│   │   │   ├── organisms/    # Complex components
│   │   │   └── pages/        # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   └── stores/           # State management
│   │
│   ├── common/               # Shared code
│   │   ├── types.ts          # TypeScript types
│   │   ├── constants.ts      # Constants and defaults
│   │   └── utils.ts          # Utilities
│   │
│   └── test/                 # Tests
│
├── assets/                   # Resources (icons, default config)
├── .vscode/                  # VS Code debug configuration
├── package.json
├── tsconfig.json             # TS config for renderer
├── tsconfig.main.json        # TS config for main
├── vite.config.ts
└── tailwind.config.js
```

## 🎮 Usage

### 1. Configure Credentials
- Enter your Okta email and password
- Optionally check "Remember credentials"
- Supports 1Password SSO

### 2. Load/Create CSV
- **Load**: Use "Load CSV" button for an existing file
- **Create**: Go to "CSV Editor" tab and use templates or create manually

### 3. Configure Schedules (optional)
- Go to "Configuration" tab
- Adjust work time blocks

### 4. Start Automation
- Click "Start Automation"
- Monitor progress in real-time
- Review logs in the "Logs" tab

## 📊 CSV Format

```csv
Cuenta,Projecto,Extras
PROD,PI,
AV,MS,EXT/PROD:PI:1600:1800
PROD,IN,EXT/PROD:PI:0900:1100;AV:MS:1400:1500
```

### Columns
- **Cuenta**: Account code (e.g., PROD, AV, JM)
- **Projecto**: Project code (e.g., MS, PR, PI)
- **Extras**: Extra hours in format `EXT/ACCOUNT:PROJECT:START:END`

### Special Codes
- `H` or `F` = Vacation
- `BH` = No work day
- `ND` = Not applicable (weekend)

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 👤 Author

**Hector David Rubio Tabares**

---

⚡ Powered by Playwright - Next-generation web automation
