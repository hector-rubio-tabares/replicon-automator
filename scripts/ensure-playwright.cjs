#!/usr/bin/env node
/**
 * Script para asegurar que Playwright esté disponible antes del build
 * Verifica que Playwright esté instalado y disponible en node_modules
 * Se ejecuta en postinstall y antes del build
 *
 * En CI/CD, los binarios pueden estar en ~/.cache/ms-playwright/ (Linux)
 * o en AppData\Local\ms-playwright (Windows)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const playwrightDir = path.join(projectRoot, 'node_modules', 'playwright');

console.log('🔍 Verificando instalación de Playwright...\n');

// Verificar que Playwright existe en node_modules
if (!fs.existsSync(playwrightDir)) {
  console.log('📦 Playwright no está instalado, instalando...');

  const installResult = spawnSync('npm', ['install', 'playwright@^1.40.0', '--save'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (installResult.status !== 0) {
    console.error('❌ Error instalando Playwright');
    process.exit(1);
  }
}

// Función para detectar si los binarios de Chromium están disponibles
function findChromiumBinaries() {
  // Buscar en node_modules/playwright
  if (fs.existsSync(playwrightDir)) {
    const contents = fs.readdirSync(playwrightDir);
    if (contents.some((dir) => dir.startsWith('chromium-'))) {
      return true;
    }
  }

  // Buscar en la cache global de Playwright
  // Windows: %LOCALAPPDATA%\ms-playwright
  // Linux/macOS: ~/.cache/ms-playwright
  const homeDir = os.homedir();
  let cacheDir;

  if (process.platform === 'win32') {
    cacheDir = path.join(homeDir, 'AppData', 'Local', 'ms-playwright');
  } else {
    cacheDir = path.join(homeDir, '.cache', 'ms-playwright');
  }

  if (fs.existsSync(cacheDir)) {
    const contents = fs.readdirSync(cacheDir);
    if (contents.some((dir) => dir.startsWith('chromium-'))) {
      console.log(`✅ Chromium encontrado en cache: ${cacheDir}`);
      return true;
    }
  }

  return false;
}

// Verificar si los binarios ya existen
if (!findChromiumBinaries()) {
  console.log('📥 Descargando binarios de Chromium...');

  const installBrowsersResult = spawnSync(
    'npx',
    ['playwright', 'install', 'chromium', '--with-deps'],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  if (installBrowsersResult.status !== 0) {
    console.error('❌ Error descargando binarios de Chromium');
    process.exit(1);
  }
}

// Verificar nuevamente después de instalación
if (findChromiumBinaries()) {
  console.log('✅ Playwright está listo para usar\n');
} else {
  console.error('❌ Playwright no se pudo preparar correctamente');
  process.exit(1);
}

console.log('\n✅ Playwright está disponible y listo para usar');
console.log('📁 Contenido de Playwright:');
fs.readdirSync(playwrightDir).forEach((item) => {
  const fullPath = path.join(playwrightDir, item);
  const isDir = fs.statSync(fullPath).isDirectory();
  console.log(`   ${isDir ? '📂' : '📄'} ${item}`);
});

process.exit(0);
