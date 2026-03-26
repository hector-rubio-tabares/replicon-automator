#!/usr/bin/env node
/**
 * Script de diagnóstico para verificar la instalación de Playwright
 * Useful para debugging en caso de que falle la pipeline
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (err) {
    return null;
  }
}

console.log('\n' + '═'.repeat(70));
console.log('  🔍 DIAGNÓSTICO DE PLAYWRIGHT');
console.log('═'.repeat(70) + '\n');

// Sistema
console.log('📊 INFORMACIÓN DEL SISTEMA:');
console.log(`  • OS: ${os.platform()} ${os.arch()}`);
console.log(`  • Node: ${process.version}`);
console.log(`  • NPM: ${run('npm --version')}`);
console.log(`  • Directorio: ${process.cwd()}`);

// Verificar directorios
console.log('\n📁 DIRECTORIOS:');
const dirs = ['node_modules', 'node_modules/playwright', '.github/workflows', 'scripts'];

for (const dir of dirs) {
  const fullPath = path.join(process.cwd(), dir);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}`);
}

// Verificar Playwright en node_modules
const playwrightDir = path.join(process.cwd(), 'node_modules', 'playwright');
if (fs.existsSync(playwrightDir)) {
  console.log('\n📦 CONTENIDO DE node_modules/playwright:');
  const items = fs.readdirSync(playwrightDir);
  items.slice(0, 10).forEach((item) => {
    const fullPath = path.join(playwrightDir, item);
    const isDir = fs.statSync(fullPath).isDirectory();
    console.log(`    ${isDir ? '📂' : '📄'} ${item}`);
  });
  if (items.length > 10) {
    console.log(`    ... y ${items.length - 10} más`);
  }

  // Buscar Chromium
  const hasChromium = items.some((f) => f.startsWith('chromium-'));
  console.log(
    `\n  ${hasChromium ? '✅' : '❌'} Chromium: ${hasChromium ? 'Encontrado' : 'No encontrado'}`
  );
}

// Verificar package.json
console.log('\n📄 PACKAGE.JSON:');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  console.log(`  ✅ package.json encontrado`);
  console.log(`     • Versión: ${pkg.version}`);
  console.log(`     • Scripts de build:`);

  const buildScripts = ['prebuild', 'build', 'prepare-playwright', 'dist', 'dist:win'];
  for (const script of buildScripts) {
    const exists = script in pkg.scripts;
    console.log(`       ${exists ? '✅' : '❌'} ${script}`);
  }

  if (pkg.build) {
    console.log(`\n     • electron-builder:`);
    console.log(`       ${pkg.build.asarUnpack ? '✅' : '❌'} asarUnpack configurado`);
    if (pkg.build.asarUnpack) {
      console.log(`         Valores: ${JSON.stringify(pkg.build.asarUnpack)}`);
    }
  }
}

// Verificar scripts
console.log('\n📝 SCRIPTS DE BUILD:');
const scriptFiles = [
  'scripts/prepare-playwright-build.js',
  'scripts/ensure-playwright.js',
  'scripts/copy-playwright-bins.js',
  'scripts/prebuild-cleanup.js',
];

for (const script of scriptFiles) {
  const fullPath = path.join(process.cwd(), script);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${script}`);
}

// Verificar CI/CD
console.log('\n⚙️  GITHUB ACTIONS:');
const cicdPath = path.join(process.cwd(), '.github', 'workflows', 'ci-cd.yml');
if (fs.existsSync(cicdPath)) {
  const content = fs.readFileSync(cicdPath, 'utf-8');
  console.log(`  ✅ ci-cd.yml encontrado`);
  console.log(`     • Pasos de Playwright:`);

  const steps = [
    'Prepare Playwright for build',
    'Verify Playwright before packaging',
    'Verify packaged Playwright (asarUnpack)',
  ];

  for (const step of steps) {
    const hasStep = content.includes(step);
    console.log(`       ${hasStep ? '✅' : '❌'} ${step}`);
  }
}

// Comandos para prueba
console.log('\n🧪 COMANDOS DE PRUEBA:');
console.log(`
Para verificar la instalación manualmente:

1. Instalar dependencias:
   npm install

2. Preparar Playwright:
   npm run prepare-playwright

3. Verificar que Playwright esté disponible:
   npm ls playwright

4. Construir la app:
   npm run build

5. Ver qué se incluiría en el instalador:
   npm run dist:win

6. Limpiar y reintentar:
   npm run clean
   npm install
   npm run dist:win
`);

console.log('\n' + '═'.repeat(70));
console.log('  ✅ Diagnóstico completado');
console.log('═'.repeat(70) + '\n');
