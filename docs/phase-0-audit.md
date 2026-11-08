# Fase 0 — Auditoría del repositorio

Fecha: 2026-10-31 (America/Bogota). Base: `9006b45`.

## Estado inicial

- Proyecto real: `C:\NetAgro\NetAgro`; Electron 30, Vite 5, React 18,
  TypeScript, Tailwind y pnpm. No se encontraron archivos AGENTS.md.
- Hay cambios previos en package.json, pnpm-lock.yaml, utils y seis páginas,
  además de componentes locales no versionados. No se revierten ni se incluyen
  indiscriminadamente en los commits de esta tarea.
- PROMPT-MAESTRO.md existe como archivo local no versionado. PROMPT.txt no existe.
- El CSV oficial existe en data/raw (73.799.381 bytes). La carpeta esperada
  data/raw/MGN2024_00_COLOMBIA no existe. Hay shapefiles administrativos y urbanos
  en ADMINISTRATIVO y URBANO, fuera de la ruta indicada. No se ha confirmado la
  integridad del paquete DANE ni la presencia de centros poblados y proyecto QGIS.
  La revisión/unificación de insumos corresponde a la fase 2.
- No hay datos procesados disponibles. No se generan métricas en estas fases.

## Hallazgos

1. TypeScript ya usa strict, pero faltan alias y separación de tipos del renderer.
2. No existen scripts typecheck/test ni pruebas; build también empaqueta instaladores.
3. No hay node_modules. Los cuatro comandos iniciales no pudieron arrancar:
   pnpm 11 intenta instalar y falla con EPERM al crear un enlace en su store.
4. El preload expone on/off/send/invoke arbitrarios; falta validación Zod y del emisor.
5. No hay CSP, configuración explícita de sandbox ni protección de navegación.
6. El prototipo usa Leaflet, recursos remotos y cifras ficticias. No debe formar
   parte de la aplicación de producción de fase 1.
7. El tema puede fallar con almacenamiento corrupto y no sigue cambios del sistema.
   No existe diccionario i18n tipado.
8. .gitignore no excluye los insumos oficiales ni todas las variantes de .env.

## Alcance de fase 1

Establecer una entrada de producción independiente del prototipo local existente:
AppShell, estados vacíos honestos, navegación, preferencias persistentes y
diccionario español/inglés; contratos IPC mínimos comprobables; Main/Preload
aislados; alias y verificación completa. Preservar el prototipo previo como
referencia local, sin compilarlo ni servirlo. No implementar el pipeline, mapas,
IA, autenticación o instaladores de fases posteriores.

Separar build (TypeScript y bundles de los tres procesos) de package
(electron-builder, fase 8). Incorporar pruebas de fronteras IPC, persistencia,
traducciones e interacción. Registrar resultados finales en phase-1-foundations.md.

Referencias técnicas: [seguridad Electron](https://www.electronjs.org/docs/latest/tutorial/security)
y [sandbox de preload](https://www.electronjs.org/docs/latest/tutorial/sandbox/).
