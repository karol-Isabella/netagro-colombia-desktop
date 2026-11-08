import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../ui';
import { MapPin, Navigation, Download, ChevronDown } from 'lucide-react';

export const FilterPanel: React.FC = () => {
  const [department, setDepartment] = useState('Cundinamarca');
  const [municipality, setMunicipality] = useState('Soacha');

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            N
          </span>
          NetAgro Colombia
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Análisis de Conectividad Rural
        </p>
      </div>

      {/* Location Section */}
      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              Departamento
            </label>
            <div className="relative">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm appearance-none cursor-pointer"
              >
                <option>Cundinamarca</option>
                <option>Antioquia</option>
                <option>Valle del Cauca</option>
                <option>Meta</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 pointer-events-none text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              Municipio
            </label>
            <div className="relative">
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm appearance-none cursor-pointer"
              >
                <option>Soacha</option>
                <option>Facatativá</option>
                <option>Zipaquirá</option>
                <option>Ubaté</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 pointer-events-none text-slate-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Layers */}
      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-sm">Capas de cobertura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: '4G LTE', color: 'bg-green-600' },
            { label: '3G UMTS', color: 'bg-blue-600' },
            { label: '2G GSM', color: 'bg-amber-600' },
            { label: 'Sin Cobertura', color: 'bg-red-600' },
          ].map((layer) => (
            <label key={layer.label} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300 accent-green-600"
              />
              <div className={`w-3 h-3 rounded-full ${layer.color}`} />
              <span className="text-sm text-slate-700 dark:text-slate-300">{layer.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Route Planner */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Planificador de ruta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              Origen
            </label>
            <Input
              placeholder="Medellín"
              defaultValue="Medellín"
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
              Destino
            </label>
            <Input
              placeholder="Villavicencio"
              defaultValue="Villavicencio"
              className="text-sm"
            />
          </div>

          <Button variant="primary" className="w-full text-sm">
            <Navigation className="w-4 h-4 mr-2" />
            Planificar Ruta
          </Button>
        </CardContent>
      </Card>

      {/* Export */}
      <Button
        variant="secondary"
        className="w-full flex items-center justify-center gap-2 text-sm"
      >
        <Download className="w-4 h-4" />
        Exportar Reporte PDF
      </Button>

      {/* Info Footer */}
      <div className="text-xs text-slate-500 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <p>
          <strong>Datos actualizados:</strong> 15 Oct 2024
        </p>
        <p className="mt-1">
          <strong>Cobertura:</strong> 68% de la ruta
        </p>
      </div>
    </div>
  );
};
