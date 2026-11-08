export const technologies = ['2G', '3G', '4G', '5G'] as const
export const operators = ['CLARO', 'MOVISTAR', 'TIGO', 'WOM'] as const
export type Technology = typeof technologies[number]
export type Operator = typeof operators[number]
export type Layer = Technology | 'none'
export type Coverage = Record<Technology, number | null>
export type OperatorCoverage = Record<Operator, Coverage>
export const emptyCoverage = (): Coverage => ({ '2G': null, '3G': null, '4G': null, '5G': null })
export const emptyOperators = (): OperatorCoverage => ({ CLARO: emptyCoverage(), MOVISTAR: emptyCoverage(), TIGO: emptyCoverage(), WOM: emptyCoverage() })

export interface Center {
  id: string; name: string; municipalityId: string; departmentId: string; area: number
  coverage: Coverage; operators: OperatorCoverage; none: boolean; explicitNone: boolean
  coordinates: [number, number] | null
}
export interface Territory {
  id: string; name: string; level: 'country' | 'department' | 'municipality'; parentId: string | null
  area: number; centerCount: number; uncoveredCenters: number; locatedCenters: number
  coverage: Coverage; operators: OperatorCoverage; none: number | null
}
export function aggregateTerritory(identity: Pick<Territory, 'id' | 'name' | 'level' | 'parentId'>, centers: Center[]): Territory {
  const area = centers.reduce((sum, c) => sum + c.area, 0)
  const weighted = (read: (c: Center) => number | null): number | null => {
    let covered = 0, observedArea = 0
    for (const c of centers) {
      const value = read(c)
      if (value !== null) { covered += value * c.area; observedArea += c.area }
    }
    return observedArea > 0 ? Math.min(1, covered / observedArea) : null
  }
  const coverage = emptyCoverage(), byOperator = emptyOperators()
  for (const tech of technologies) {
    coverage[tech] = weighted(c => c.coverage[tech])
    for (const op of operators) byOperator[op][tech] = weighted(c => c.operators[op][tech])
  }
  return { ...identity, area, centerCount: centers.length, uncoveredCenters: centers.filter(c => c.none).length,
    locatedCenters: centers.filter(c => c.coordinates !== null).length, coverage, operators: byOperator,
    none: area > 0 ? centers.filter(c => c.none).reduce((sum, c) => sum + c.area, 0) / area : null }
}
export function normalizeCode(value: string | number, width: number): string {
  const text = String(value).trim()
  if (!/^\d+$/.test(text) || text.length > width) throw new Error(`Invalid DANE code: ${text}`)
  return text.padStart(width, '0')
}
export function normalizeName(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').replace(/BOGOTÁ[.,]?\s*D\.?\s*C\.?/iu, 'BOGOTÁ, D.C.')
}
export function layerValue(territory: Territory, layer: Layer): number | null {
  return layer === 'none' ? territory.none : territory.coverage[layer]
}
export function rankTerritories(territories: Territory[], layer: Layer): Territory[] {
  return [...territories].sort((a, b) => {
    const left = layerValue(a, layer), right = layerValue(b, layer)
    if (left === null) return right === null ? a.id.localeCompare(b.id) : 1
    if (right === null) return -1
    return (layer === 'none' ? right - left : left - right) || a.id.localeCompare(b.id)
  })
}
