# Changelog

Todos los cambios notables de este proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [Unreleased]

## [0.0.1] - 2026-01-01

### Agregado
- Migración completa a Electron + Playwright
- Interfaz moderna con React + Tailwind CSS
- Sistema de temas (claro/oscuro/sistema) con transiciones suaves
- Soporte multilenguaje (ES/EN)
- Editor CSV integrado con undo/redo
- Sistema de plantillas
- Programador de tareas
- Historial de ejecuciones con gráficos (BarChart, DonutChart, LineChart, Sparkline, ProgressRing)
- Notificaciones con sonidos
- Atajos de teclado globales
- Servicio unificado de credenciales con encriptación safeStorage
- Sistema de Dry Run para simular automatizaciones
- Sistema de Recovery/Checkpoint para recuperar ejecuciones fallidas
- Preloading del navegador para inicio más rápido
- Selectores optimizados de Zustand para mejor rendimiento

### Técnico
- Arquitectura basada en Electron con proceso main y renderer separados
- Automatización con Playwright (más rápido que Selenium, sin drivers externos)
- Pipeline CI/CD con GitHub Actions
- Build automático para Windows (.exe instalador y portable)
