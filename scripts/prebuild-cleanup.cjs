/**
 * Script para limpiar procesos y archivos antes del build
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const releasePath = path.join(__dirname, '..', 'release');

function sleep(ms) {
  execSync(`powershell -Command "Start-Sleep -Milliseconds ${ms}"`, { stdio: 'ignore' });
}

function killRelatedProcesses() {
  console.log('🔍 Buscando procesos relacionados con Replicon/Electron...');

  // Buscar procesos que usen archivos del proyecto
  try {
    const cmd = `powershell -Command "Get-Process | Where-Object { $_.Path -like '*replicon-automator*' } | ForEach-Object { $_.Id }"`;
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });

    const pids = result
      .trim()
      .split('\n')
      .filter((pid) => pid.trim() && !isNaN(pid.trim()));

    if (pids.length > 0) {
      console.log(`🔫 Cerrando ${pids.length} proceso(s): ${pids.join(', ')}`);
      pids.forEach((pid) => {
        try {
          execSync(`taskkill /F /PID ${pid.trim()} /T`, { stdio: 'ignore' });
        } catch (e) {
          // Proceso ya cerrado o sin permisos
        }
      });
      return pids.length;
    }
  } catch (error) {
    // Si falla PowerShell, intentar por nombre
  }

  // Plan B: cerrar por nombre de proceso
  let killed = 0;
  try {
    execSync('taskkill /F /IM electron.exe /T 2>nul', { stdio: 'ignore' });
    killed++;
  } catch (e) {}

  try {
    execSync('taskkill /F /IM "Replicon Automator.exe" /T 2>nul', { stdio: 'ignore' });
    killed++;
  } catch (e) {}

  if (killed > 0) {
    console.log(`🔫 Cerrados ${killed} proceso(s) por nombre`);
  } else {
    console.log('ℹ️  No se encontraron procesos activos');
  }

  return killed;
}

(function cleanup() {
  console.log('🧹 Limpiando antes del build...\n');

  // Cerrar procesos relacionados
  killRelatedProcesses();

  // Esperar a que los procesos se cierren completamente
  console.log('⏳ Esperando cierre de procesos...');
  sleep(3000);

  // Intentar eliminar la carpeta release
  if (fs.existsSync(releasePath)) {
    console.log('🗑️  Eliminando carpeta release...\n');

    let attempts = 0;
    const maxAttempts = 5;
    let deleted = false;

    while (attempts < maxAttempts && !deleted) {
      try {
        fs.rmSync(releasePath, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 1000,
        });
        deleted = true;
        console.log('✅ Carpeta release eliminada correctamente\n');
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⚠️  Intento ${attempts}/${maxAttempts} fallido`);

          // En el tercer intento, buscar procesos de nuevo
          if (attempts === 3) {
            console.log('🔄 Segunda búsqueda de procesos...');
            const found = killRelatedProcesses();
            if (found > 0) {
              sleep(3000);
            } else {
              sleep(2000);
            }
          } else {
            sleep(2000);
          }
        } else {
          console.error('\n❌ ERROR: No se pudo eliminar la carpeta release');
          console.error('\n📋 Ejecuta estos comandos manualmente en PowerShell:\n');
          console.error('   # 1. Buscar procesos que bloquean archivos:');
          console.error('   Get-Process | Where-Object { $_.Path -like "*replicon-automator*" }\n');
          console.error('   # 2. Si aparecen procesos, ciérralos:');
          console.error(
            '   Get-Process | Where-Object { $_.Path -like "*replicon-automator*" } | Stop-Process -Force\n'
          );
          console.error('   # 3. Elimina la carpeta:');
          console.error('   Remove-Item -Path release -Recurse -Force\n');
          console.error('   # 4. Vuelve a ejecutar: npm run dist:win\n');
          process.exit(1);
        }
      }
    }
  } else {
    console.log('ℹ️  No hay carpeta release para eliminar\n');
  }

  console.log('✅ Limpieza completada\n');
})();
