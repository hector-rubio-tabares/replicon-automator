/**
 * Script para copiar binarios de Playwright antes del build
 * Copia chromium desde la cache de Playwright a un directorio local
 * Soporta Windows, Linux y macOS
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

// Detectar el directorio de Playwright según el sistema operativo
function getPlaywrightDir() {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === 'win32') {
    // Windows: %LOCALAPPDATA%\ms-playwright
    return path.join(homeDir, 'AppData', 'Local', 'ms-playwright');
  } else if (platform === 'darwin') {
    // macOS: ~/Library/Caches/ms-playwright
    return path.join(homeDir, 'Library', 'Caches', 'ms-playwright');
  } else {
    // Linux: ~/.cache/ms-playwright
    return path.join(homeDir, '.cache', 'ms-playwright');
  }
}

const SOURCE_DIR = getPlaywrightDir();
const TARGET_DIR = path.join(__dirname, '..', 'playwright-bin');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`❌ Source directory does not exist: ${src}`);
    process.exit(1);
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('📦 Copiando binarios de Playwright para el build...');
console.log(`Origen: ${SOURCE_DIR}`);
console.log(`Destino: ${TARGET_DIR}`);

try {
  // Verificar que existe el directorio de origen
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ No se encontró ms-playwright.');
    console.error('   Ejecuta: npx playwright install chromium');
    process.exit(1);
  }

  // Buscar carpetas chromium-*
  const files = fs.readdirSync(SOURCE_DIR);
  const chromiumFolders = files.filter(
    (f) => f.startsWith('chromium-') && !f.startsWith('chromium_headless_shell-')
  );

  if (chromiumFolders.length === 0) {
    console.error('❌ No se encontró ninguna carpeta chromium-* en ms-playwright');
    process.exit(1);
  }

  console.log(`✅ Encontrado: ${chromiumFolders.join(', ')}`);

  // Limpiar directorio destino si existe
  if (fs.existsSync(TARGET_DIR)) {
    console.log('🧹 Limpiando directorio anterior...');
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
  }

  // Copiar cada carpeta chromium-*
  for (const folder of chromiumFolders) {
    const srcPath = path.join(SOURCE_DIR, folder);
    const destPath = path.join(TARGET_DIR, folder);

    console.log(`📂 Copiando ${folder}...`);
    copyDirRecursive(srcPath, destPath);
  }

  console.log('✅ Binarios de Playwright copiados exitosamente');
  console.log(`📍 Ubicación: ${TARGET_DIR}`);
} catch (error) {
  console.error('❌ Error copiando binarios:', error.message);
  process.exit(1);
}
