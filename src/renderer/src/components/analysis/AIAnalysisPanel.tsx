import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../ui';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export const AIAnalysisPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Análisis de Inteligencia Artificial
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ruta Medellín - Villavicencio
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">DISTANCIA</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">459 km</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">DURACIÓN</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">8h 40m</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">SIN SEÑAL</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">52 min</div>
        </div>
      </div>

      {/* Dead Zone Alert */}
      <Card variant="default" className="border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-base text-red-900 dark:text-red-100">
                Zona muerta detectada
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
            Entre El Santuario y Doradal (Autopista Medellín-Bogotá):
            <br />
            <span className="font-medium">Sin señal móvil, aprox. 52 min fuera de línea.</span>
            <br />
            Descarga mapas y documentos antes de salir.
          </p>
          <div className="mt-3 flex gap-2">
            <Badge variant="error" size="sm">
              🔴 3G
            </Badge>
            <Badge variant="error" size="sm">
              🔴 4G
            </Badge>
            <Badge variant="error" size="sm">
              ⚠️ Altá montaña
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Route */}
      <Card variant="elevated" className="border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-base text-green-900 dark:text-green-100">
                Ruta alternativa recomendada
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
            Desviarse por Rionegro → La Unión:<br />
            <span className="font-medium">
              (+74%) con señal 3G en 180 min adicionales de ruta y cobertura 3G continua.
            </span>
          </p>
          <div className="p-2 bg-white dark:bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Ahorro de</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              39 min sin cobertura
            </div>
          </div>
          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
          >
            <span>Aplicar ruta</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Signal Map Legend */}
      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-sm">Leyenda de cobertura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-xs text-slate-700 dark:text-slate-300">Con cobertura 4G/3G</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-xs text-slate-700 dark:text-slate-300">Sin cobertura</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-600" />
            <span className="text-xs text-slate-700 dark:text-slate-300">Cobertura débil 2G</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
