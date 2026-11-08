import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  className?: string;
}

export const Map: React.FC<MapProps> = ({ className = '' }) => {
  // Colombia center
  const colombiaCenter: [number, number] = [4.5709, -74.2973];
  
  // Route points: Medellín to Villavicencio
  const medellin: [number, number] = [6.2442, -75.5812];
  const villavicencio: [number, number] = [4.1427, -73.6245];
  
  // Route with dead zone
  const routePath: [number, number][] = [
    medellin,
    [6.05, -75.3],
    [5.85, -75.1],
    [5.65, -74.9],
    [5.4, -74.6],
    [5.15, -74.3],
    [4.9, -74.0],
    [4.65, -73.7],
    villavicencio,
  ];

  return (
    <div className={`relative h-full w-full ${className}`}>
      <MapContainer
        center={colombiaCenter}
        zoom={7}
        className="h-full w-full rounded-2xl"
        style={{ zIndex: 1 }}
      >
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="Topográfico">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satelital">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Calor">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Route with signal (green) */}
        <Polyline
          positions={routePath.slice(0, 7) as [number, number][]}
          pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.8 }}
        />

        {/* Dead zone (red) */}
        <Polyline
          positions={routePath.slice(6, 9) as [number, number][]}
          pathOptions={{ color: '#dc2626', weight: 4, opacity: 0.8, dashArray: '5, 5' }}
        />

        {/* Markers */}
        <Marker position={medellin}>
          <Popup>
            <div className="text-sm font-medium">
              Origen: Medellín
              <br />
              <span className="text-xs text-slate-600">6.24°N, 75.58°W</span>
            </div>
          </Popup>
        </Marker>

        <Marker position={villavicencio}>
          <Popup>
            <div className="text-sm font-medium">
              Destino: Villavicencio
              <br />
              <span className="text-xs text-slate-600">4.14°N, 73.62°W</span>
            </div>
          </Popup>
        </Marker>

        {/* Dead zone marker */}
        <Marker
          position={[5.3, -74.5]}
          icon={
            new L.Icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI2RjMjYyNiIvPjwvc3ZnPg==',
              iconSize: [24, 24],
            })
          }
        >
          <Popup>
            <div className="text-sm font-medium text-red-600">
              Zona muerta detectada
              <br />
              <span className="text-xs">47 km sin cobertura</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Coverage badge */}
      <div className="absolute top-4 left-4 z-50 bg-white dark:bg-slate-900 rounded-2xl px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Porcentaje de Cobertura: <span className="text-green-600">68%</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-950 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Listo para uso Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
