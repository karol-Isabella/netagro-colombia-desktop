# Fase 9 — Rediseño UI/UX Premium (Apple / SaaS Design Language)

Fecha: 2026-11-08 (America/Bogota).

## Objetivo

Elevar la experiencia visual de NetAgro Colombia a un estándar de software moderno
tipo Apple / SaaS premium, sin alterar la lógica de negocio, estados de Zustand,
endpoints IPC o estructura del pipeline de datos.

---

## Sistema de Diseño

### Paleta de Colores

| Token CSS            | Light                | Dark                 | Uso                        |
|----------------------|----------------------|----------------------|----------------------------|
| `--canvas`           | `#f8fafc`            | `#0a0f1a`            | Fondo base de la app       |
| `--surface`          | `#ffffff`            | `#111827`            | Tarjetas y paneles         |
| `--sidebar`          | `#f1f5f9`            | `#0d1526`            | Barra lateral              |
| `--text`             | `#0f172a`            | `#f1f5f9`            | Texto primario             |
| `--muted`            | `#64748b`            | `#64748b`            | Texto secundario           |
| `--accent`           | `#059669`            | `#10b981`            | Acento esmeralda NetAgro   |
| `--accent-soft`      | `rgba(5,150,105,.1)` | `rgba(16,185,129,.12)`| Fondos de badges / hover  |
| `--line`             | `#e2e8f0`            | `#1e293b`            | Bordes y separadores       |

### Tipografía

- Fuente del sistema: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont`
- Escala: 10px (labels) → 12px (captions) → 13.5px (body) → 20px (títulos)
- Pesos: 500 (normal), 600 (semi-bold), 700 (bold), 900 (hero metric)

### Bordes Redondeados

| Uso                  | Valor         |
|----------------------|---------------|
| Tarjetas principales | `rounded-2xl` (20px) |
| Botones / inputs     | `rounded-xl`  (12px) |
| Pills / badges       | `rounded-full` |
| Iconos pequeños      | `rounded-xl`  (12px) |

---

## Componentes Rediseñados

### AuthGate — Pantalla de Autenticación

- **Aurora animada**: 3 orbes CSS (`aurora-orb-1/2/3`) con `@keyframes auroraShift`
  en tonos verde esmeralda y cian. Animación fluida de 14–20s.
- **Glassmorphism card**: `backdrop-blur-2xl`, `border-white/10`, `shadow-2xl`
- **Encabezado limpio**: "Iniciar sesión en NetAgro" / "Crear cuenta en NetAgro"
- **Labels sobre campos**: posición top con guía sutil (hint) a la derecha
- **Validación custom** (sin globos nativos HTML5): mensajes animados con `AlertCircle`
- **Reglas**: usuario 1–50 chars `[a-zA-Z0-9._-]`, contraseña 6–20 chars
- **`noValidate`** en el `<form>` para suprimir tooltips nativos del navegador

### AppShell — Layout Principal

- **Aurora de fondo**: 3 orbes `position: fixed` con baja opacidad (7–10%) para
  el dashboard completo, usando `isolation: isolate` + `z-index` para no interferir.
- **Sidebar glassmorphism**: `backdrop-filter: blur(16px)`, borde sutil, sticky.
- **Nav-link activo**: indicador pill izquierdo (`::before`) con glow verde esmeralda.
- **Account pill**: avatar con inicial, nombre de usuario y botón de logout compacto.
- **workspace-note**: badge "local" con fondo `accent-soft`.

### TerritoryPanel — Panel de Detalle Territorial

- **Hero metric**: número grande con color semántico dinámico:
  - ≥ 90% → `text-emerald-500` + `TrendingUp` icon
  - 50–90% → `text-amber-500` + `Minus` icon
  - < 50% → `text-rose-500` + `TrendingDown` icon
- **Fade-up animation** al cambiar territorio (`@keyframes fadeUp`)
- Separadores de línea fina entre secciones

### AnalysisPanel — Diagnóstico IA

- **Spinner** de carga inline en el botón (reemplaza el texto "Analizando…")
- **Loading skeleton**: 3 líneas shimmer animadas mientras carga el resultado
- Resultado estructurado con `CheckCircle2` (hallazgos) y `Lightbulb` (recomendaciones)

### CoverageMap — Mapa Interactivo

- **Loading overlay**: spinner centrado sobre el canvas mientras `loaded === false`
- **Error overlay** mejorado: card glassmorphic con `fadeIn` animation
- MapLibre GL con colores de relleno semánticos (rojo→amarillo→verde)

### OverviewPage — Panorama

- **KPI cards** 2×2 con iconos de colores (Building2, Radio, MapPin, Signal)
- **Progress bars semánticas**: color dinámico por nivel de cobertura
  - ≥ 90% → degradado esmeralda
  - 50–90% → degradado ámbar
  - < 50% → degradado rojo

### ReportsPage — Informes y Rankings

- **Coverage-dot badge**: punto de 8px con colores semánticos + ring de halo
  en cada fila de la tabla (`high`, `medium`, `low`, `unknown`)
- Encabezado de tabla con `TrendingUp` icon

### WorkspacePage — Estado Vacío

- **Pulse-ring animation**: anillo que pulsa alrededor del icono central
- **Preview-mode badge**: pill "Preview Mode" con icono `Wifi`

### SettingsPage — Configuración

- **Version badge**: pill verde `v{version}` al lado del nombre de la app
- Separación visual clara entre PreferencesPanel y la sección About

---

## Microinteracciones

| Elemento              | Interacción                               |
|-----------------------|-------------------------------------------|
| Botones               | `transform: translateY(-1px)` en hover   |
| Nav-link              | `translateX(2px)` en hover                |
| Stats cards           | `translateY(-2px)` + `shadow-md` en hover |
| Aurora orbes          | Movimiento fluido con `alternate` keyframes |
| Coverage number       | `fadeUp` al cambiar territorio           |
| Skeleton              | `shimmer` horizontal de 1.4s              |
| Pulse ring (empty)    | `pulseRing` de 2.4s                       |

---

## Validación Final

```
pnpm typecheck  → exit 0  (3 tsconfigs: renderer, node, test)
pnpm test       → 14 test files, 46 tests, all passed
git status      → working tree clean
```
