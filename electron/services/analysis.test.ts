import { expect, it, vi } from 'vitest'
import { AnalysisService, rulesAnalysis } from './analysis'
import { aggregateTerritory } from '@shared/coverage'
import type { Dataset } from '@shared/dataSchema'
const territory = aggregateTerritory({ id: '52', name: 'NARIÑO', level: 'department', parentId: 'CO' }, [])
const repository = { territory: async () => ({ territory, metadata: { period: '2025Q4', methodology: 'Official area-weighted coverage' } as Dataset['metadata'] }) }
const input = { territoryId: '52', layer: '4G', locale: 'es', online: true } as const
it('does not call a provider without a key or when offline', async () => {
  const request = vi.fn()
  expect((await new AnalysisService(repository, () => undefined, request).analyze(input)).fallbackReason).toBe('not-configured')
  expect((await new AnalysisService(repository, () => 'test-key', request).analyze({ ...input, online: false })).fallbackReason).toBe('offline')
  expect(request).not.toHaveBeenCalled()
})
it('falls back immediately for quota and network failures', async () => {
  const quota = vi.fn().mockResolvedValue(new Response('', { status: 429 }))
  expect((await new AnalysisService(repository, () => 'test-key', quota).analyze(input)).fallbackReason).toBe('rate-limit')
  expect(quota).toHaveBeenCalledTimes(1)
  const network = vi.fn().mockRejectedValue(new Error('offline'))
  expect((await new AnalysisService(repository, () => 'test-key', network).analyze(input)).fallbackReason).toBe('network')
})
it('uses the published Flash-Lite model and validates its structured response', async () => {
  const content = { summary: 'Official diagnosis', findings: ['No reported area'], recommendations: ['Verify data'] }
  const request = vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(content) }] } }] }))
  const result = await new AnalysisService(repository, () => 'test-key', request).analyze(input)
  expect(result.provider).toBe('gemini')
  expect(result.model).toBe('gemini-3.1-flash-lite')
  expect(request).toHaveBeenCalledTimes(1)
  expect(request.mock.calls[0][1].headers['x-goog-api-key']).toBe('test-key')
  expect(request.mock.calls[0][1].body).not.toContain('test-key')
})
it('rejects invalid model output and never invents a percentage for missing data', async () => {
  const request = vi.fn().mockImplementation(async () => Response.json({ candidates: [{ content: { parts: [{ text: '{}' }] } }] }))
  expect((await new AnalysisService(repository, () => 'test-key', request).analyze(input)).provider).toBe('rules')
  expect(rulesAnalysis(territory, '2025Q4', '4G', 'es', 'offline').summary).toContain('sin información')
})
