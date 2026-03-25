# Patrones de Servicios Estandarizados

Este documento define los patrones de instanciación de servicios en Replicon Automator.

## 📐 Patrón B: Singleton (Recomendado)

**Usar cuando:** El servicio mantiene estado compartido que debe ser único en toda la aplicación.

### Ejemplos de servicios Singleton:

- **CredentialsService** - credenciales en memoria/electron-store
- **AuditLoggerService** - sessionId, logDir, currentLogFile
- **NotificationService** - caché de iconos
- **TrayService** - referencia única al tray del sistema
- **UpdaterService** - estado de actualización (isChecking, updateDownloaded)
- **SchedulerService** - timers y config de tareas programadas
- **PdfReportService** - reportsDir compartido
- **PlaywrightRuntimeCheckService** - validación de runtime

### Implementación:

```typescript
/**
 * Descripción del servicio.
 * 
 * @singleton - Explicar qué estado compartido mantiene.
 * Exportado como singleton para [razón específica].
 */
class ServiceName {
  private someState: string;
  
  constructor() {
    this.someState = 'initial';
  }
  
  someMethod(): void {
    // implementation
  }
}

// Export singleton instance - Patrón B estándar
export const serviceNameInstance = new ServiceName();
```

### ❌ NO HACER:

```typescript
// INCORRECTO: Doble instanciación
export const service = new Service();  // en service.ts

// Luego en otro archivo:
const service = new Service();  // ❌ Segunda instancia = pérdida de estado
```

### ✅ CORRECTO:

```typescript
// En otro archivo, importar el singleton:
import { serviceNameInstance } from './service-name.service.js';

serviceNameInstance.someMethod();
```

---

## 🏭 Patrón Factory: Instanciable

**Usar cuando:** El servicio es stateless o cada uso necesita su propia instancia con estado aislado.

### Ejemplos de servicios instanciables:

- **CSVService** - stateless, solo operaciones de I/O
- **PlaywrightAutomation** - cada ejecución es instancia separada con su browser/context
- **AutomationWorkerService** - cada worker es instancia separada
- **AccountMapperService** - se crea con mappings específicos parametrizados

### Implementación:

```typescript
/**
 * Descripción del servicio.
 * 
 * @instanciable - Explicar por qué es stateless o factory.
 * Se instancia donde se necesite con `new ServiceName()`.
 */
export class ServiceName {
  // Si tiene constructor parametrizado:
  constructor(config: SomeConfig) {
    // setup
  }
  
  someMethod(): void {
    // stateless logic o estado aislado
  }
}
```

### Uso:

```typescript
// Cada uso crea su instancia:
const service = new ServiceName(config);
service.someMethod();

// O en factory pattern:
function createAutomation(config: Config): PlaywrightAutomation {
  return new PlaywrightAutomation(config, progressCb, logCb);
}
```

---

## 🚫 Patrón A: getInstance() - NO USAR

**Razón:** Innecesariamente complejo para una aplicación Electron. Patrón B es suficiente.

```typescript
// ❌ NO USAR - Overkill
class Service {
  private static instance: Service | null = null;
  
  private constructor() {}
  
  static getInstance(): Service {
    if (!Service.instance) {
      Service.instance = new Service();
    }
    return Service.instance;
  }
}
```

Este patrón se usaba en **PlaywrightRuntimeCheckService** pero fue refactorizado a Patrón B.

---

## 📝 Checklist para agregar un nuevo servicio:

1. **¿Mantiene estado que debe ser único?**
   - Sí → Singleton (Patrón B)
   - No → Instanciable (Factory)

2. **Agregar JSDoc:**
   ```typescript
   /**
    * @singleton - Razón específica
    * O
    * @instanciable - Razón específica
    */
   ```

3. **Si es Singleton:**
   - Exportar instancia: `export const serviceName = new ServiceName()`
   - Agregar comentario: `// Export singleton instance - Patrón B estándar`

4. **Si es Instanciable:**
   - Solo exportar clase: `export class ServiceName { }`
   - Documentar en JSDoc: `@instanciable - [razón]`

5. **Actualizar este documento** con el nuevo servicio en la lista correspondiente.

---

## 🔍 Verificar doble instanciación:

```bash
# Buscar todas las instanciaciones de un servicio:
grep -r "new ServiceName()" src/
```

Si un servicio Singleton aparece instanciado más de una vez, es un **BUG CRÍTICO**.

---

## 📊 Resumen actual:

| Servicio | Patrón | Estado compartido |
|----------|--------|-------------------|
| CredentialsService | Singleton | credenciales en store |
| AuditLoggerService | Singleton | sessionId, logDir |
| NotificationService | Singleton | iconCache |
| TrayService | Singleton | tray, mainWindow |
| UpdaterService | Singleton | updateDownloaded, isChecking |
| SchedulerService | Singleton | timers, config |
| PdfReportService | Singleton | reportsDir |
| PlaywrightRuntimeCheckService | Singleton | paths, validation state |
| CSVService | Instanciable | stateless I/O |
| PlaywrightAutomation | Instanciable | browser/page por run |
| AutomationWorkerService | Instanciable | worker por ejecución |
| AccountMapperService | Instanciable | mappings parametrizados |

---

**Última actualización:** 2026-03-25 - Fase 4 (Refactorización Singleton)
