# Fases 3 a 7 — Aplicación con datos oficiales

El repositorio Main comprueba SHA-256 y esquemas Zod antes de compartir una
instantánea de datos y geometrías. Los contratos IPC validan emisor, ventana,
frame, solicitud y respuesta. Los errores expuestos son códigos controlados.
La sesión se comprueba antes y después de operaciones asíncronas.

MapLibre usa GeoJSON y un worker incluidos localmente, sin mapas base, teselas,
fuentes ni APIs externas. Permite país > departamento > municipio, búsqueda
por nombre/código, filtros de leyenda, capas 2G/3G/4G/5G/sin cobertura, puntos,
mapa de calor y atajo a Nariño. El panel muestra métricas, operadores y hasta
20 centros sin cobertura seleccionables; la exportación contiene todos.

El panorama nacional y los rankings consultan la misma instantánea. Los rankings
ordenan municipios desde menor cobertura (mayor proporción sin cobertura en
esa capa), con carga progresiva de 50 filas. Se exportan rankings y centros del
territorio seleccionado mediante el diálogo nativo: UTF-8 BOM, separador ;,
comillas escapadas y protección de fórmulas en texto. Las coordenadas conservan
su signo numérico. Los códigos DANE se escriben completos; al importar en una
hoja de cálculo deben declararse columnas de texto para conservar ceros iniciales.

El diagnóstico local explica cifras reales y las limitaciones del indicador.
Gemini REST es opcional, con consentimiento por consulta y clave solo en Main
(`MAIN_VITE_GEMINI_API_KEY`). Usa los modelos indicados en el prompt maestro,
salida estructurada validada, timeout y respaldo local ante falta de clave,
red o cuota. Las pruebas cubren estas respuestas con transporte controlado;
no se realizó una consulta real a Gemini porque no hay clave configurada.

Las cuentas locales se guardan en userData/accounts.json mediante escritura
atómica: salt aleatoria por cuenta y hash scrypt. La contraseña no se almacena.
Las operaciones se serializan; los intentos fallidos tienen espera temporal.
La sesión vive en Main y se pierde al cerrar el proceso. Cerrar sesión limpia
los datos del renderer y bloquea consultas/exportaciones/diagnósticos por IPC.
No es un servicio de identidad remoto ni protege los datos públicos frente a
otro administrador del equipo.

La suite incluye contratos, seguridad IPC, integridad de archivos, cálculos,
autenticación, exportaciones, preferencias y navegación. La prueba nativa usa
un perfil temporal, registra una cuenta mediante la interfaz, carga MapLibre,
selecciona Nariño, genera diagnóstico local y exporta CSV reales sin abrir
diálogos sobre el escritorio. Capturas e informes quedan en test-results/.

El prototipo antiguo y la página de análisis de rutas no forman parte de los
requisitos funcionales de estas fases. No se implementó optimización de rutas.
