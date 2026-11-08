import { expect, it } from 'vitest'
import { csvCell,rankingCsv,centersCsv } from './export'
import { aggregateTerritory } from '@shared/coverage'
import type { Dataset } from '@shared/dataSchema'
it('escapes CSV delimiters, quotes, newlines and formula injection', () => {
  expect(csvCell('A;"B"')).toBe('"A;""B"""')
  expect(csvCell('=2+2')).toBe('"\'=2+2"')
  expect(csvCell('  =2+2')).toBe('"\'  =2+2"')
  expect(csvCell(-77.28)).toBe('"-77.28"')
  expect(csvCell(null)).toBe('""')
})
it('exports only municipalities in the selected scope and preserves DANE codes', () => {
  const region = aggregateTerritory({id:'52',name:'Nariño',level:'department',parentId:'CO'},[])
  const municipality = aggregateTerritory({id:'52001',name:'Pasto',level:'municipality',parentId:'52'},[])
  const other = aggregateTerritory({id:'05001',name:'Medellín',level:'municipality',parentId:'05'},[])
  const data = { metadata: {period:'2025Q4'},territories:[region,municipality,other],centers:[] } as unknown as Dataset
  const result=rankingCsv(data,'52','4G')
  expect(result.startsWith('\uFEFF')).toBe(true)
  expect(result).toContain('"52001"')
  expect(result).not.toContain('Medellín')
  expect(centersCsv(data,'52','4G')).toContain('longitude')
  expect(() => rankingCsv(data,'99','4G')).toThrow('INVALID_INPUT')
})
