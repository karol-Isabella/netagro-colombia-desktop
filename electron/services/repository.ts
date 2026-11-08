import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { z } from 'zod'
import { datasetSchema, mapsSchema, type Dataset, type MapData } from '@shared/dataSchema'

const manifestSchema = z.object({ schemaVersion: z.literal(1), files: z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)) })
export class CoverageRepository {
  private pending?: Promise<{ data: Dataset; maps: MapData }>
  constructor(private readonly directory: string) {}
  private async read() {
    try {
      const manifest = manifestSchema.parse(JSON.parse(await readFile(path.join(this.directory, 'manifest.json'), 'utf8')))
      const content: Record<string, unknown> = {}
      for (const name of ['coverage.json', 'departments.geojson', 'municipalities.geojson', 'centers.geojson']) {
        const raw = await readFile(path.join(this.directory, name))
        if (createHash('sha256').update(raw).digest('hex') !== manifest.files[name]) throw new Error('Integrity check failed')
        content[name] = JSON.parse(raw.toString('utf8')) as unknown
      }
      return { data: datasetSchema.parse(content['coverage.json']), maps: mapsSchema.parse({
        departments: content['departments.geojson'], municipalities: content['municipalities.geojson'], centers: content['centers.geojson'],
      }) }
    } catch { throw new Error('DATA_UNAVAILABLE') }
  }
  async load() {
    this.pending ??= this.read().catch(error => { this.pending = undefined; throw error })
    return this.pending
  }
  async territory(id: string) {
    const { data } = await this.load()
    const territory = data.territories.find(t => t.id === id)
    if (!territory) throw new Error('INVALID_INPUT')
    return { territory, metadata: data.metadata }
  }
}
