#!/usr/bin/env node
/**
 * Script para preparar Playwright para el build de Electron
 * Asegura que los binarios estén disponibles en node_modules/playwright
 * antes de que electron-builder los empaquete
 */

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');
const os = require('os');

const projectRoot = path.join(__dirname, '..');
const playwrightDir = path.join(projectRoot, 'node_modules', 'playwright');

function log(msg, level = 'info') {
  const icons = {
    info: '📋',
    success: '✅',
    warning: '⚠️ ',
    error: '❌',
  };
  console.log(`${icons[level]} ${msg}`);
}

function checkPlaywrightInstallation() {
  if (!fs.existsSync(playwrightDir)) {
    log('Playwright no encontrado en node_modules', 'error');
    return false;
  }

  const hasChromium = fs.readdirSync(playwrightDir).some((f) => f.startsWith('chromium-'));

  if (!hasChromium) {
    // Verificar en cache global
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
        log('Chromium encontrado en cache global', 'success');
        return true;
      }
    }

    log('Chromium no encontrado en Playwright', 'warning');
    return false;
  }

  log('Playwright instalado correctamente', 'success');
  return true;
}

function findChromiumBinaries() {
  // Buscar en node_modules/playwright
  if (fs.existsSync(playwrightDir)) {
    const contents = fs.readdirSync(playwrightDir);
    if (contents.some((dir) => dir.startsWith('chromium-'))) {
      return true;
    }
  }

  // Buscar en cache global
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
      return true;
    }
  }

  return false;
}

function detectPlatformBrowsers() {
  const browsers = {};

  // Intentar leer desde node_modules primero
  if (fs.existsSync(playwrightDir)) {
    const contents = fs.readdirSync(playwrightDir);

    for (const file of contents) {
      if (file.startsWith('chromium-')) {
        browsers.chromium = file;
      } else if (file.startsWith('firefox-')) {
        browsers.firefox = file;
      } else if (file.startsWith('webkit-')) {
        browsers.webkit = file;
      }
    }
  }

  // Si no encontramos en node_modules, buscar en cache global
  if (!browsers.chromium) {
    const homeDir = os.homedir();
    let cacheDir;

    if (process.platform === 'win32') {
      cacheDir = path.join(homeDir, 'AppData', 'Local', 'ms-playwright');
    } else {
      cacheDir = path.join(homeDir, '.cache', 'ms-playwright');
    }

    if (fs.existsSync(cacheDir)) {
      const contents = fs.readdirSync(cacheDir);
      for (const file of contents) {
        if (file.startsWith('chromium-')) {
          browsers.chromium = file;
          log(`Chromium encontrado en cache global: ${cacheDir}`, 'success');
        } else if (file.startsWith('firefox-')) {
          browsers.firefox = file;
        } else if (file.startsWith('webkit-')) {
          browsers.webkit = file;
        }
      }
    }
  }

  return browsers;
}

function ensureChromium() {
  log('Verificando binarios de Chromium...', 'info');

  // Primero verificar si ya existen en cualquier lado
  if (findChromiumBinaries()) {
    log('Chromium está disponible', 'success');
    return;
  }

  // Si no existen, descargar
  log('Chromium no está instalado, descargando...', 'warning');

  const result = spawnSync('npx', ['playwright', 'install', 'chromium', '--with-deps'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    log('Error instalando Chromium', 'error');
    process.exit(1);
  }

  // Verificar nuevamente
  if (findChromiumBinaries()) {
    log('Chromium está disponible', 'success');
  } else {
    log('Chromium aún no está disponible después de instalar', 'error');
    process.exit(1);
  }
}

function verifyElectronBuilder() {
  log('Verificando configuración de electron-builder...', 'info');

  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.build) {
    log('No hay configuración de build en package.json', 'error');
    process.exit(1);
  }

  if (!packageJson.build.asarUnpack) {
    log('asarUnpack no está configurado en package.json', 'warning');
    packageJson.build.asarUnpack = ['node_modules/playwright/**/*'];
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log('asarUnpack ha sido configurado automáticamente', 'success');
  } else if (Array.isArray(packageJson.build.asarUnpack)) {
    if (!packageJson.build.asarUnpack.some((p) => p.includes('playwright'))) {
      log('Playwright no está en asarUnpack, añadiendo...', 'warning');
      packageJson.build.asarUnpack.push('node_modules/playwright/**/*');
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }

  log('Configuración de electron-builder verificada', 'success');
}

function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  🚀 Preparando Playwright para Electron Build');
  console.log('═══════════════════════════════════════════════════════\n');

  log(`Platform: ${process.platform} ${os.arch()}`, 'info');
  log(`Node: ${process.version}`, 'info');
  log(`NPM: ${execSync('npm --version').toString().trim()}`, 'info');

  console.log('\n📦 Paso 1: Verificar instalación de Playwright');
  if (!checkPlaywrightInstallation()) {
    log('Instalando Playwright...', 'info');
    const result = spawnSync('npm', ['install', 'playwright'], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      log('Error al instalar Playwright', 'error');
      process.exit(1);
    }
  }

  console.log('\n🌐 Paso 2: Asegurar que Chromium esté disponible');
  ensureChromium();

  console.log('\n⚙️  Paso 3: Verificar configuración de electron-builder');
  verifyElectronBuilder();

  console.log('\n📋 Paso 4: Mostrar información de Playwright');
  const browsers = detectPlatformBrowsers();
  console.log('Navegadores disponibles:');
  Object.entries(browsers).forEach(([name, version]) => {
    log(`${name}: ${version}`, 'success');
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ Playwright está listo para el build de Electron');
  console.log('═══════════════════════════════════════════════════════\n');
}

main();
