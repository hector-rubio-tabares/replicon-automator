# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.0.8] - 2026-01-02

### Fixed
- Input fields not working in production (clicking on username/password fields caused app to freeze)
- `Menu.setApplicationMenu(null)` was breaking input focus in production builds
- Added missing `onUpdateError` type in renderer global.d.ts

### Added
- File logging system that saves all logs to `C:\RepliconLogs\replicon-{date}.log`
- Logs now persist in both development and production modes
- Session start info (version, packaged status) logged on startup

### Technical
- Removed `Menu.setApplicationMenu(null)` - using `autoHideMenuBar` instead
- Logger writes to file regardless of environment
- Better debugging capability for production issues

## [0.0.7] - 2026-01-02

### Fixed
- Update checker state not resetting after pressing "Later" multiple times
- UI stuck showing "Downloading update..." when download fails
- Flags (`isDownloading`, `dialogShowing`, `isChecking`) not resetting on error

### Added
- `showDownloadDialog()` method to re-show download dialog when update available
- `onUpdateError` event to notify renderer of update errors
- Event handlers in preload for `update-downloaded` and `update-error`

### Improved
- Artifact name changed to `Replicon.Automator.Setup.exe` (with dots, no spaces)
- Reduced installer size by limiting locales to English and Spanish only
- Better state management in UpdateChecker component

### Technical
- Added `electronLanguages: ["en", "es"]` to reduce bundle size
- Reset all updater flags in error handler
- Send `update-error` event to renderer on failure

## [0.0.6] - 2026-01-02

### Added
- Prompt to install pending update when closing the application
- `showInstallDialog()` method for showing install dialog when update is ready
- New i18n translations for update install prompts

### Fixed
- Auto-updater artifact name mismatch causing 404 errors (changed from hyphens to dots)
- Duplicate update dialogs appearing when checking for updates
- App hanging when checking updates after download completed
- Unused variable TypeScript error in retry.ts

### Improved
- Better update flow with `dialogShowing` and `isDownloading` flags to prevent duplicates
- Shows install dialog immediately if update was already downloaded
- Cleaner update experience with single dialog pattern

### Technical
- Changed `artifactName` in package.json to `${productName}.Setup.${ext}`
- Added `promptInstallOnQuit()` method to updater service
- Prefixed unused callback parameter with underscore (`_delay`)

## [0.0.5] - 2026-01-02

### Added
- DevLogs floating button to view application logs in real-time
- Console interceptor for Main and Renderer processes
- Source indicator for logs ([Main] / [Renderer])

### Improved
- In production, DevLogs only shows errors (no info/warn/debug)
- DevLogs button only appears in production when there are errors
- Removed application menu in production for cleaner UI
- Disabled DevTools in production for security
- Replaced all console.log with structured logger system
- Better theme support (dark/light) for DevLogs panel
- Full i18n support for DevLogs component

### Fixed
- DevLogger interceptor not working due to incorrect environment detection
- Old compiled files in dist/ not being updated
- Console.log statements appearing in production builds

### Technical
- Use `app.isPackaged` instead of `process.env.NODE_ENV` for environment detection
- Added `devTools: isDev` and `autoHideMenuBar` options to BrowserWindow
- Cleaned up debug/test console.log statements

## [0.0.4] - 2026-01-01

### Added
- Welcome/guide modal for new users (Onboarding)
- Step-by-step guide explaining main features
- Visual progress indicators in onboarding

### Improved
- Better user experience for first-time users
- Complete onboarding translations (ES/EN)

## [0.0.3] - 2026-01-01

### Fixed
- Missing TypeScript types for update APIs
- Artifact paths in CI/CD pipeline

## [0.0.2] - 2026-01-01

### Added
- Automatic update system with background download
- Update installation button in UI
- Translation system for main process (i18n)

### Improved
- Update messages now use translation system
- Better visual feedback during update downloads

## [0.0.1] - 2026-01-01

### Added
- Complete migration to Electron + Playwright
- Modern interface with React + Tailwind CSS
- Theme system (light/dark/system) with smooth transitions
- Multi-language support (ES/EN)
- Integrated CSV editor with undo/redo
- Template system
- Task scheduler
- Execution history with charts (BarChart, DonutChart, LineChart, Sparkline, ProgressRing)
- Notifications with sounds
- Global keyboard shortcuts
- Unified credentials service with safeStorage encryption
- Dry Run system to simulate automations
- Recovery/Checkpoint system for failed executions
- Browser preloading for faster startup
- Optimized Zustand selectors for better performance

### Technical
- Architecture based on Electron with separate main and renderer processes
- Automation with Playwright (faster than Selenium, no external drivers)
- CI/CD pipeline with GitHub Actions
- Automatic build for Windows (.exe installer and portable)
