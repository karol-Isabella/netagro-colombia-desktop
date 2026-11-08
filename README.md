# NetAgro Colombia

Aplicación de escritorio offline para explorar cobertura móvil de Colombia con
datos locales oficiales de CRC y DANE. Incluye mapa jerárquico, búsqueda,
capas 2G/3G/4G/5G/sin cobertura, mapa de calor, detalle por operador, diagnóstico,
autenticación local, panorama nacional, rankings y exportación CSV.

## Desarrollo en Windows

Requisitos: Node.js 22 o superior y pnpm. Entorno verificado: Node 24.14.0,
pnpm 11.25.0. Desde PowerShell en C:\NetAgro\NetAgro:

```powershell
pnpm install --frozen-lockfile
pnpm data:build
pnpm dev
```

El pipeline necesita los insumos locales indicados en
[la documentación de datos](docs/phase-2-data.md). No descarga ni inventa datos.
Si data/processed ya contiene una generación válida, basta con pnpm data:verify.
La generación actual selecciona 2025Q4: 8.161 centros, 241 sin cobertura,
33 departamentos/distrito y 1.121 unidades municipales.

Crea una cuenta local al abrir la app (usuario de 3–40 caracteres y contraseña
de 10–128). Las cuentas quedan en userData/accounts.json, con sal y hash scrypt;
no se guarda la contraseña ni se comparte la cuenta con un servidor. La sesión
se pierde al cerrar el proceso. Tema e idioma español/inglés se conservan.

## Verificación y empaquetado

Ejecutar un comando por línea:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:smoke
pnpm package
pnpm test:packaged
```

- typecheck valida renderer, Main, preload y pruebas con TypeScript estricto.
- lint aplica ESLint sin advertencias permitidas y restringe APIs del renderer.
- test cubre datos, contratos, integridad, sesiones, diagnóstico y preferencias.
- build genera dist y dist-electron. pnpm exec electron . abre esa compilación.
- test:smoke ejecuta Electron real con perfil temporal y sandbox activo; prueba
  registro desde la interfaz, mapa, Nariño, diagnóstico, CSV, tema/idioma y logout.
- package recompila, verifica hashes de las seis salidas de datos y genera un
  instalador NSIS x64 en release/0.1.0/NetAgro-Colombia-0.1.0-Setup.exe.
  Incluye datos procesados en resources/data y código en app.asar.
- test:packaged abre el ejecutable de win-unpacked con un perfil aislado y
  depuración solo en loopback. Verifica el arranque ASAR, datos incluidos,
  autenticación, MapLibre, diagnóstico local y cierre de sesión.

Las pruebas nativas dejan informes JSON y capturas en test-results, excluido
de Git. Pueden requerir ejecución fuera del sandbox del agente de programación;
el sandbox interno de Electron permanece activo. El instalador es local y
sin firma digital. No se publica ni se ejecuta automáticamente para instalarlo.
La primera generación puede descargar herramientas NSIS de electron-builder.

## Datos e interpretación

Las cifras representan áreas de centros poblados con reporte, ponderadas por
área; no población cubierta ni toda la superficie de un municipio. Se suman
niveles por operador/tecnología, se limita la fracción a uno y se toma el mejor
operador por centro. Falta de reporte es desconocido, no cero.

Sin cobertura identifica centros sin señal en todas las tecnologías reportadas,
incluida 5G. Su porcentaje es la fracción del área de esos centros; el mapa de
calor muestra concentración de puntos y no un contorno exacto de ausencia de
señal. Las ubicaciones se aproximan con coordenadas de manzanas DANE ponderadas
por área. La cartografía está simplificada para visualización.

Los CSV se guardan mediante diálogo nativo, con BOM UTF-8 y separador punto y
coma. Al importarlos en una hoja de cálculo, declara los códigos DANE como
texto para conservar los ceros iniciales. Los rankings se exportan completos;
la tabla carga progresivamente 50 filas.

## Diagnóstico opcional con Gemini

El diagnóstico por reglas funciona sin conexión ni clave. Para una consulta
en vivo, configura MAIN_VITE_GEMINI_API_KEY en el entorno del proceso antes de
abrir la app y activa “Consultar Gemini en línea” al analizar. No escribas la
clave en archivos versionados ni en variables del renderer.

Main consulta Gemini REST con los modelos del prompt maestro:
gemini-3.5-flash-lite y gemini-3.1-flash-lite. Envía métricas agregadas públicas
del territorio seleccionado y valida la respuesta. Sin clave, ante fallos de
red, cuota o respuestas inválidas, usa reglas locales. No se validó una llamada
real a Gemini en este entorno; las pruebas del adaptador usan transporte
controlado. El origen del resultado se muestra en la interfaz.

## Arquitectura y seguridad

| Ruta | Responsabilidad |
| --- | --- |
| electron / @main | Ventana, autenticación, datos, diagnóstico y exportación |
| electron/preload.ts | API nominal window.netAgro; bundle preload.cjs |
| src/shared / @shared | Esquemas Zod, contratos y cálculos |
| src/renderer/app / @renderer | Interfaz activa, estado, temas e i18n |
| scripts/data | Pipeline streaming y cartografía |
| scripts | Verificación de datos y pruebas de Electron |
| data/raw | Insumos locales, ignorados por Git |
| data/processed | Salidas generadas, ignoradas por Git |
| release | Artefactos de Windows, ignorados por Git |

Renderer sin Node ni peticiones directas a APIs externas. Main valida emisor,
frame, sesión y payload; preload valida respuestas. Context isolation,
sandbox, CSP sin conexiones externas, permisos y ventanas emergentes denegados.
MapLibre carga únicamente geometrías y worker locales.

El árbol previo src/renderer/src se conserva como referencia fuera de la app
activa, TypeScript y ESLint; sus cambios locales no se incluyeron en commits.
El análisis/optimización de rutas del prototipo no está implementado en estas
fases. No se incluyen insumos, secretos, binarios ni compilaciones en Git.

Documentación: [auditoría](docs/phase-0-audit.md),
[fundamentos](docs/phase-1-foundations.md), [pipeline](docs/phase-2-data.md),
[aplicación](docs/phases-3-7-application.md) y
[empaquetado y evidencia](docs/phase-8-packaging.md).
