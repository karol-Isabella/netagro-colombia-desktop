import { afterEach, expect, it } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { CoverageRepository } from './repository'
const directories: string[] = []
afterEach(async () => { for (const dir of directories.splice(0)) await rm(dir, { recursive: true, force: true }) })
it('rejects missing datasets and retries after a failed load', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'netagro-repo-')); directories.push(dir)
  const repository = new CoverageRepository(dir)
  await expect(repository.load()).rejects.toThrow('DATA_UNAVAILABLE')
  await writeFile(path.join(dir, 'manifest.json'), '{"schemaVersion":1,"files":{}}')
  await expect(repository.load()).rejects.toThrow('DATA_UNAVAILABLE')
})
it('rejects tampered files before deserializing them', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'netagro-integrity-')); directories.push(dir)
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ schemaVersion: 1, files: { 'coverage.json': createHash('sha256').update('{}').digest('hex') } }))
  await writeFile(path.join(dir, 'coverage.json'), '{"tampered":true}')
  await expect(new CoverageRepository(dir).load()).rejects.toThrow('DATA_UNAVAILABLE')
})
