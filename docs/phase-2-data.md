# Fase 2 — Pipeline oficial

Ejecutar `pnpm data:build`. Lee el CSV por streaming en dos pasadas: descubre
el último trimestre y procesa exclusivamente ese periodo. Los datos actuales
contienen 761.892 filas en doce trimestres, incluyendo 5G. Se seleccionó 2025Q4:
60.797 filas y 8.161 centros poblados. Se generaron 1.155 territorios (país,
33 departamentos/distrito y 1.121 unidades municipales).

Se copiaron los insumos administrativos y los atributos de manzanas necesarios
a data/raw/MGN2024_00_COLOMBIA. Los originales permanecen intactos. No se presupone
que sea un paquete DANE completo: se consumen límites administrativos WGS84 de
2024 y los campos de manzanas zu_cdivi, manz_long, manz_lati y manz_narea.
Los 8.161 centros tienen coincidencia por código de ocho dígitos; los puntos son
promedios de coordenadas de manzanas ponderados por área, no centroides oficiales
de un polígono de centro poblado ni mediciones GPS.

Se suman niveles de señal por operador/tecnología, se limita cada fracción a uno
y se elige el mejor operador por centro. La agregación territorial pondera el
área de los centros con reporte para la tecnología seleccionada. Falta de reporte
es null; Ninguna representa cero. Se incorpora 5G al diagnóstico global para no
declarar sin cobertura un centro con esa tecnología. La capa sin cobertura mide
la proporción de área de centros completamente sin cobertura; no calcula la
unión geométrica de señales ni población cubierta.

Las geometrías se simplifican a tolerancia 0,002 grados para visualización; no
deben usarse para deslindes. Los hashes SHA-256 de las fuentes, metodología y
conteos quedan en metadata.json. manifest.json registra la integridad de todas
las salidas; Main deberá rechazar una generación incompleta o modificada.

Salidas locales ignoradas por Git: coverage.json, departments.geojson,
municipalities.geojson, centers.geojson, rankings.json, metadata.json y manifest.json.
La suite typecheck/lint/test/build pasó; 32 pruebas, incluyendo separación temporal,
suma por niveles, tope de fracciones, ausencia de reporte y ponderación de áreas.
