# Fase 1 — Fundamentos

Fecha: 2026-10-31 (America/Bogota).

## Implementación

- Alias @renderer, @shared y @main sincronizados en TypeScript, Vite y Vitest.
  Comprobación estricta separada de renderer, Main/Preload y pruebas.
- ESLint sin any explícito, reglas de hooks y restricciones de Electron, Node,
  Leaflet y APIs de red en el renderer activo.
- Contrato mínimo app:get-info con petición y respuesta Zod estrictas. Main
  verifica identidad de webContents, frame principal y URL exacta, admitiendo
  únicamente cambios del fragmento de HashRouter. Rechaza payloads inesperados.
- window.netAgro expone solamente getAppInfo; no expone eventos Electron ni
  primitivas genéricas de envío. Preload CommonJS autocontenido para sandbox.
- Ventana con contextIsolation/sandbox activos y nodeIntegration desactivado.
  CSP de producción bloquea conexiones; permisos, webviews y nuevas ventanas
  denegados. Navegación restringida al documento de la aplicación.
- Arranque de desarrollo sin el --no-sandbox predeterminado del plugin.
  CSP de desarrollo permite el preámbulo React y WebSocket local de Vite.
- AppShell adaptable con navegación, panel de detalle, apariencia e idioma.
  Tipografía del sistema, espaciado y superficies claras/oscuras estilo Apple.
- Diccionario tipado español/inglés completo; idioma inicial español.
- Preferencias versionadas y validadas en localStorage. Manejo de JSON corrupto,
  falta de almacenamiento y errores de escritura; fallback en memoria con aviso.
  El tema del sistema responde a cambios y se aplica antes del primer render.
- Estados vacíos claros, sin cifras ni mapas ficticios. Las páginas de datos
  quedan preparadas para fases 2–4. La vista de preferencias muestra la versión
  real del proceso Main; el navegador sin preload se identifica como vista previa.
- build genera solo los tres bundles; package reserva electron-builder para fase 8.
  El build limpia salidas antiguas de Electron antes de generar el nuevo preload.

## Protección del trabajo previo

No se modificaron los archivos previos en src/renderer/src. Su estado local
queda fuera del commit de fundamentos y fuera del grafo de producción.
Se conservan las dependencias auxiliares clsx/tailwind-merge ya añadidas por
el usuario; se retiran Leaflet, react-leaflet y sus tipos, y el polyfill de Node
para renderer. Se añaden Vitest, Testing Library, jsdom y tipos Node explícitos.
Las copias locales previas de package.json y pnpm-lock.yaml están en
.local-backup, excluidas de Git.

Ni los insumos ni datos procesados, perfiles de prueba, capturas, dependencias,
.env o bundles se añaden a Git. No se ejecuta push.

## Verificación

- pnpm typecheck: renderer, Main/Preload y pruebas, sin errores.
- pnpm lint: sin errores ni advertencias.
- pnpm test: 30 pruebas en ocho archivos, todas aprobadas.
- pnpm build: bundles de renderer, Main y preload generados correctamente.
- pnpm test:smoke: arranque nativo de los bundles sin servidor de desarrollo,
  IPC real, sandbox/contextIsolation y ausencia de Node en renderer; CSP,
  tema/idioma, recarga persistente, ventana compacta sin desbordamiento horizontal,
  sin errores de preload o renderer.
- Capturas de tema claro, oscuro/inglés y preferencias compactas revisadas.
  Evidencia local: test-results/electron-smoke.json y archivos PNG.
- Revisión React: hooks con limpieza, claves estables, derivación del tema,
  etiquetas y controles nativos, navegación con aria-current, foco visible,
  enlace para saltar al contenido y respeto por movimiento reducido.

La instalación inicial requirió permiso de ejecución fuera del sandbox del
agente por enlaces de pnpm; la prueba nativa también requirió ese permiso.
Esto no desactiva el sandbox de Electron.

Rollup informa dos avisos de anotaciones PURE en comentarios de Zod 4.6.5;
elimina esos comentarios y termina correctamente. No hay errores de build.
No se ocultan los avisos ni se cambian versiones mayores para esta fase.

## Pendientes fuera de alcance

Pipeline y validación completa de cartografía (fase 2); repositorio de cobertura
(fase 3); MapLibre offline y capas (fase 4); IA (fase 5); autenticación scrypt
(fase 6); rankings/exportación (fase 7); instaladores (fase 8). No hay métricas
procesadas todavía. No se afirma que estas funciones estén implementadas.

Referencias usadas para el aislamiento:
[seguridad Electron](https://www.electronjs.org/docs/latest/tutorial/security)
y [preload con sandbox](https://www.electronjs.org/docs/latest/tutorial/sandbox/).
