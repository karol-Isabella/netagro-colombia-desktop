import { createReadStream } from 'node:fs'
import { parse } from 'csv-parse'
import { normalizeCode, normalizeName, technologies, operators, emptyCoverage, emptyOperators, type Center, type Technology } from '../../src/shared/coverage'

export async function* readRows(file: string): AsyncGenerator<Record<string, string>> {
  const parser = createReadStream(file).pipe(parse({ bom: true, delimiter: ';', columns: true, skip_empty_lines: true }))
  for await (const row of parser) yield row as Record<string, string>
}
export function decimal(value: string): number {
  if (!/^[+-]?\d+(?:,\d+)?$/.test(value.trim())) throw new Error(`Invalid decimal: ${value}`)
  const number = Number(value.replace(',', '.'))
  if (!Number.isFinite(number) || number < 0) throw new Error('Negative or non-finite area')
  return number
}
export function rowPeriod(row: Record<string, string>): string {
  const value = `${row.ANNO}Q${row.TRIMESTRE}`
  if (!/^\d{4}Q[1-4]$/.test(value)) throw new Error('Invalid reporting period')
  return value
}
export async function processCoverage(file: string) {
  const periods = new Set<string>()
  let csvRows = 0
  for await (const row of readRows(file)) { periods.add(rowPeriod(row)); csvRows++ }
  const sorted = [...periods].sort()
  const period = sorted.at(-1)
  if (!period) throw new Error('Coverage CSV is empty')
  const centers = new Map<string, Center>(), seen = new Map<string, string>()
  let selectedRows = 0, duplicateRows = 0
  const warnings: string[] = []
  for await (const row of readRows(file)) {
    if (rowPeriod(row) !== period) continue
    selectedRows++
    const id = normalizeCode(row.ID_CPOB, 8), municipalityId = normalizeCode(row.ID_MUNICIPIO, 5), departmentId = normalizeCode(row.ID_DEPARTAMENTO, 2)
    if (!id.startsWith(municipalityId) || !municipalityId.startsWith(departmentId)) throw new Error(`Inconsistent DANE hierarchy: ${id}`)
    const technology = row.TECNOLOGIA.trim()
    if (technology !== 'Ninguna' && !technologies.includes(technology as Technology)) throw new Error(`Unknown technology: ${technology}`)
    const key = `${id}:${technology}:${row.NIVEL_SENAL}`, signature = JSON.stringify(row)
    if (seen.has(key)) {
      if (seen.get(key) !== signature) throw new Error(`Conflicting duplicate: ${key}`)
      duplicateRows++; continue
    }
    seen.set(key, signature)
    const area = decimal(row.AREA_CPOB)
    if (area <= 0) throw new Error(`Invalid center area: ${id}`)
    let center = centers.get(id)
    if (!center) {
      center = { id, municipalityId, departmentId, name: normalizeName(row.CPOB), area, coverage: emptyCoverage(),
        operators: emptyOperators(), none: false, explicitNone: false, coordinates: null }
      centers.set(id, center)
    }
    if (Math.abs(center.area - area) > Math.max(1e-6, center.area * 1e-6)) throw new Error(`Inconsistent area: ${id}`)
    if (technology === 'Ninguna') { center.explicitNone = true; continue }
    const tech = technology as Technology
    for (const op of operators) center.operators[op][tech] = (center.operators[op][tech] ?? 0) + decimal(row[`AREA_COB_${op}`])
  }
  for (const center of centers.values()) {
    for (const tech of technologies) {
      for (const op of operators) {
        const total = center.operators[op][tech]
        center.operators[op][tech] = total === null ? (center.explicitNone ? 0 : null) : Math.min(1, total / center.area)
      }
      const values = operators.map(op => center.operators[op][tech]).filter((v): v is number => v !== null)
      center.coverage[tech] = values.length ? Math.max(...values) : null
    }
    center.none = Object.values(center.coverage).some(v => v !== null) && Object.values(center.coverage).every(v => v === null || v === 0)
    if (center.explicitNone && !center.none) warnings.push(`Ninguna conflicts with positive coverage: ${center.id}`)
  }
  return { centers: [...centers.values()].sort((a,b) => a.id.localeCompare(b.id)), period, periods: sorted, csvRows, selectedRows, duplicateRows, warnings }
}
