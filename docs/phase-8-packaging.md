# Fase 8 — Windows x64

Versión 0.1.0, identidad co.netagro.colombia, nombre NetAgro Colombia.
electron-builder genera NSIS con asistente, instalación por usuario y selección
de directorio. Desinstalar conserva userData; no borra cuentas ni preferencias.
No se configuró certificado de firma ni publicación automática.

`pnpm package` compila los tres bundles, ejecuta `pnpm data:verify` y empaqueta.
La verificación comprueba las seis salidas contra manifest.json antes de
incluirlas. El paquete usa el runtime Electron instalado por el lockfile y
contiene app.asar más resources/data. No incluye insumos crudos, código del
prototipo, secretos ni carpetas de pruebas. Las dependencias de JavaScript
necesarias están incorporadas en los bundles.

Artefactos locales, excluidos de Git:

- release/0.1.0/NetAgro-Colombia-0.1.0-Setup.exe
- release/0.1.0/win-unpacked/NetAgro Colombia.exe
- test-results/electron-smoke.json y capturas de interfaz
- test-results/packaged-smoke.json

`pnpm test:smoke` ejecuta los bundles de producción en Electron con perfil
temporal, registro desde la UI, IPC protegido, mapa/heatmap, Nariño, diagnóstico,
CSV reales, tema/idioma persistidos, tamaño compacto y logout. El diálogo de
exportación se sustituye únicamente en el harness para guardar en test-results.

`pnpm test:packaged` ejecuta el EXE empaquetado, sin Vite, y prueba los datos
incluidos en resources/data. Usa --smoke-test para ocultar la ventana y un
directorio de perfil obligatorio y absoluto. No desactiva autenticación, CSP,
aislamiento ni sandbox; CDP se habilita solo en ese lanzamiento mediante un
puerto efímero de loopback. El script termina su proceso al finalizar.

La validación del ejecutable de win-unpacked comprueba el código ASAR que
distribuye el instalador. No equivale a instalar/desinstalar en una máquina
limpia: el asistente NSIS no se ejecuta sobre la cuenta del usuario.

Las consultas reales a Gemini quedan pendientes de una clave válida. Su
adaptador y los respaldos sí están cubiertos por pruebas automáticas.
Vite emite avisos no bloqueantes por anotaciones de Zod y el tamaño del bundle
MapLibre; el mapa se carga de forma diferida y su worker se sirve localmente.

## Evidencia final — 2026-11-02

- pnpm typecheck, pnpm lint, pnpm test y pnpm build: salida 0.
- Vitest: 46 pruebas aprobadas en 14 archivos.
- pnpm data:verify: seis archivos íntegros, 2025Q4 y 8.161 centros.
- pnpm test:smoke: salida 0 sobre 0.1.0; sandbox y contextIsolation activos,
  nodeIntegration desactivado, exportaciones reales y sin errores de renderer.
- pnpm test:packaged: salida 0; arranque ASAR, sesión, mapa, Nariño > Pasto,
  migas de pan, búsqueda de narino sin tilde y diagnóstico offline. No se
  observaron peticiones HTTP desde el renderer ni excepciones.
- Los seis hashes de resources/data coinciden con las salidas del pipeline.
- ASAR inspeccionado: bundles, assets y package.json; sin node_modules,
  insumos crudos, archivos de entorno, prototipo ni pruebas.
- EXE con ProductName NetAgro Colombia y ProductVersion 0.1.0.0.
- Instalador NSIS: 80.048.531 bytes, Authenticode NotSigned.
- SHA-256 del instalador:
  484a79a1cdf8cbcfe232dfc7249adc314c49af4d4cda823bd6d672ea044e7fcc

El primer pnpm package completó build y data:verify, pero la extracción de
winCodeSign-2.6.0 falló al crear enlaces simbólicos de bibliotecas de macOS.
Se inspeccionó el archivo oficial descargado y se extrajo la parte aplicable
a Windows con 7-Zip, excluyendo darwin/linux, en la caché esperada
%LOCALAPPDATA%/electron-builder/Cache/winCodeSign/winCodeSign-2.6.0.
Después, `pnpm exec electron-builder --win --publish never` terminó con salida 0.
Se mantuvieron la edición de metadatos del EXE y los controles de seguridad.
En otro equipo sin permisos de enlaces simbólicos puede requerirse la misma
preparación de caché antes del primer empaquetado. No se versionan estas
herramientas ni se cambian los permisos globales del sistema.

La revisión visual usó las capturas nativas del mismo build en test:smoke;
CDP no permite capturar de forma fiable esa ventana oculta. La prueba del
paquete verifica comportamiento y deja su informe JSON.
