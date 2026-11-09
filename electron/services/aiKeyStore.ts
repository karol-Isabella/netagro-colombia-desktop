import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface SystemCrypto {
  isAsyncEncryptionAvailable(): Promise<boolean>
  encryptStringAsync(value: string): Promise<Buffer>
  decryptStringAsync(value: Buffer): Promise<{ result: string; shouldReEncrypt: boolean }>
  getSelectedStorageBackend(): string
}

/** Keeps a user's own Gemini key encrypted with the operating system key store. */
export class AiKeyStore {
  private apiKey: string | null = null
  private secureStorageAvailable = false
  private storageError = false
  private readonly file: string

  constructor(private readonly directory: string, private readonly crypto: SystemCrypto, private readonly platform: string) {
    this.file = path.join(directory, 'gemini-api-key.enc')
  }

  async initialize() {
    try {
      this.secureStorageAvailable = await this.crypto.isAsyncEncryptionAvailable() &&
        (this.platform !== 'linux' || this.crypto.getSelectedStorageBackend() !== 'basic_text')
    } catch {
      this.storageError = true
      return
    }
    if (!this.secureStorageAvailable) return
    try {
      const decrypted = await this.crypto.decryptStringAsync(await readFile(this.file))
      this.apiKey = decrypted.result
      if (decrypted.shouldReEncrypt) await this.save(decrypted.result)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') this.storageError = true
    }
  }

  status() {
    return { configured: this.apiKey !== null, secureStorageAvailable: this.secureStorageAvailable, storageError: this.storageError }
  }

  getKey() { return this.apiKey ?? undefined }

  async save(value: string) {
    if (!this.secureStorageAvailable) throw new Error('SECURE_STORAGE_UNAVAILABLE')
    const apiKey = value.trim()
    if (apiKey.length < 20 || apiKey.length > 512) throw new Error('INVALID_INPUT')
    try {
      await mkdir(this.directory, { recursive: true })
      const temporary = path.join(this.directory, `gemini-${randomBytes(8).toString('hex')}.tmp`)
      try {
        await writeFile(temporary, await this.crypto.encryptStringAsync(apiKey), { mode: 0o600, flag: 'wx' })
        await rename(temporary, this.file)
      } catch (error) {
        await unlink(temporary).catch(() => undefined)
        throw error
      }
      this.apiKey = apiKey
      this.storageError = false
    } catch (error) {
      if (error instanceof Error && error.message === 'SECURE_STORAGE_UNAVAILABLE') throw error
      throw new Error('AI_KEY_STORAGE_ERROR', { cause: error })
    }
  }

  async clear() {
    try { await unlink(this.file) } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('AI_KEY_STORAGE_ERROR')
    }
    this.apiKey = null
    this.storageError = false
  }
}
