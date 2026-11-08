import { afterEach, expect, it } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { decimal, processCoverage } from './csv'
import { aggregateTerritory, normalizeCode, normalizeName } from '../../src/shared/coverage'
const temporary: string[] = []
afterEach(async () => { for (const folder of temporary.splice(0)) await rm(folder, { recursive: true, force: true }) })
it('normalizes DANE codes, names and comma decimals without accepting malformed areas', () => {
  expect(normalizeCode('5001000', 8)).toBe('05001000')
  expect(normalizeName(' BOGOTÁ. D.C. ')).toBe('BOGOTÁ, D.C.')
  expect(decimal('1,25')).toBe(1.25)
  expect(() => decimal('NaN')).toThrow()
  expect(() => decimal('-1')).toThrow()
})
it('separates quarters, sums signal levels per operator, caps, and preserves missing observations', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'netagro-csv-')); temporary.push(directory)
  const file = path.join(directory, 'coverage.csv')
  const header = 'ANNO;TRIMESTRE;ID_DEPARTAMENTO;ID_MUNICIPIO;ID_CPOB;CPOB;AREA_CPOB;TECNOLOGIA;NIVEL_SENAL;AREA_COB_CLARO;AREA_COB_MOVISTAR;AREA_COB_TIGO;AREA_COB_WOM'
  const rows = ['2024;4;5;5001;5001000;A;10;4G;1;10;0;0;0',
    '2025;4;5;5001;5001000;A;10;4G;1;3;1;0;0', '2025;4;5;5001;5001000;A;10;4G;2;2;2;0;0',
    '2025;4;5;5001;5001001;B;30;Ninguna;0;0;0;0;0',
    '2025;4;5;5001;5001002;C;10;4G;1;20;0;0;0']
  await writeFile(file, '\uFEFF' + header + '\n' + rows.join('\n'))
  const result = await processCoverage(file)
  expect(result.period).toBe('2025Q4')
  expect(result.centers[0].coverage['4G']).toBe(0.5)
  expect(result.centers[0].coverage['2G']).toBeNull()
  expect(result.centers[1].none).toBe(true)
  expect(result.centers[2].coverage['4G']).toBe(1)
  const aggregate = aggregateTerritory({ id: 'CO', name: 'Colombia', level: 'country', parentId: null }, result.centers)
  expect(aggregate.coverage['4G']).toBe(0.3)
  expect(aggregate.none).toBe(0.6)
  expect(aggregate.uncoveredCenters).toBe(1)
})
