import { afterEach, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { AiKeyStore } from './aiKeyStore'

const directories: string[] = []
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }) })

async function directory() {
  const root = path.resolve('test-results/unit')
  await mkdir(root, { recursive: true })
  const folder = await mkdtemp(path.join(root, 'netagro-ai-key-'))
  directories.push(folder)
  return folder
}

function crypto(backend = 'os_store') {
  return {
    isAsyncEncryptionAvailable: async () => true,
    encryptStringAsync: async (value: string) => Buffer.from(Buffer.from(value).toString('base64')),
    decryptStringAsync: async (value: Buffer) => ({ result: Buffer.from(value.toString(), 'base64').toString(), shouldReEncrypt: false }),
    getSelectedStorageBackend: () => backend,
  }
}

it('stores the API key encrypted and restores it through the system store', async () => {
  const folder = await directory()
  const key = 'AIzaSyExamplePersonalKey_123456789'
  const store = new AiKeyStore(folder, crypto(), 'win32')
  await store.initialize()
  expect(store.status()).toEqual({ configured: false, secureStorageAvailable: true, storageError: false })
  await store.save(key)
  expect(await readFile(path.join(folder, 'gemini-api-key.enc'), 'utf8')).not.toContain(key)
  expect(store.getKey()).toBe(key)

  const restored = new AiKeyStore(folder, crypto(), 'win32')
  await restored.initialize()
  expect(restored.getKey()).toBe(key)
  await restored.clear()
  expect(restored.status().configured).toBe(false)
})

it('refuses insecure fallback storage on Linux', async () => {
  const store = new AiKeyStore(await directory(), crypto('basic_text'), 'linux')
  await store.initialize()
  expect(store.status().secureStorageAvailable).toBe(false)
  await expect(store.save('AIzaSyExamplePersonalKey_123456789')).rejects.toThrow('SECURE_STORAGE_UNAVAILABLE')
})
