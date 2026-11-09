import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { credentialsSchema } from '@shared/contracts'

const scrypt = promisify(scryptCallback)
const usersSchema = z.object({ version: z.literal(1), users: z.array(z.object({
  username: z.string().regex(/^[a-z0-9._-]{1,50}$/), salt: z.string().regex(/^[a-f0-9]{32}$/), hash: z.string().regex(/^[a-f0-9]{128}$/),
}).strict()).max(100) }).strict()
export class AuthService {
  private current: string | null = null
  private failed = 0
  private blockedUntil = 0
  private queue: Promise<unknown> = Promise.resolve()
  constructor(private readonly directory: string, private readonly now: () => number = Date.now) {}
  private async users() {
    try { return usersSchema.parse(JSON.parse(await readFile(path.join(this.directory, 'accounts.json'), 'utf8'))) }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1 as const, users: [] }
      throw new Error('STORAGE_ERROR')
    }
  }
  async status() { return { username: this.current, hasAccounts: (await this.users()).users.length > 0 } }
  requireSession() { if (!this.current) throw new Error('AUTH_REQUIRED') }
  logout() { this.current = null }
  async register(input: z.infer<typeof credentialsSchema>) {
    const next = this.queue.then(async () => {
      const credentials = credentialsSchema.parse(input)
      const accounts = await this.users()
      if (accounts.users.some(user => user.username === credentials.username)) throw new Error('USER_EXISTS')
      if (accounts.users.length >= 100) throw new Error('STORAGE_ERROR')
      const salt = randomBytes(16).toString('hex')
      const hash = (await scrypt(credentials.password, salt, 64) as Buffer).toString('hex')
      accounts.users.push({ username: credentials.username, salt, hash })
      await mkdir(this.directory, { recursive: true })
      const temporary = path.join(this.directory, 'accounts.' + randomBytes(8).toString('hex') + '.tmp')
      try {
        await writeFile(temporary, JSON.stringify(accounts), { mode: 0o600, flag: 'wx' })
        await rename(temporary, path.join(this.directory, 'accounts.json'))
      } catch (error) { throw new Error('STORAGE_ERROR', { cause: error }) }
      this.current = credentials.username
      return this.status()
    })
    this.queue = next.catch(() => undefined)
    return next
  }
  async login(input: z.infer<typeof credentialsSchema>) {
    const next = this.queue.then(() => this.verify(input))
    this.queue = next.catch(() => undefined)
    return next
  }
  private async verify(input: z.infer<typeof credentialsSchema>) {
    if (this.now() < this.blockedUntil) throw new Error('RATE_LIMIT')
    const credentials = credentialsSchema.parse(input)
    const user = (await this.users()).users.find(user => user.username === credentials.username)
    // Use the same expensive derivation for missing users to avoid timing disclosure.
    const salt = user?.salt ?? '00000000000000000000000000000000'
    const derived = await scrypt(credentials.password, salt, 64) as Buffer
    const expected = user ? Buffer.from(user.hash, 'hex') : Buffer.alloc(64)
    if (!user || !timingSafeEqual(derived, expected)) {
      this.failed++
      if (this.failed >= 5) { this.blockedUntil = this.now() + 30_000; this.failed = 0 }
      throw new Error('AUTH_FAILED')
    }
    this.failed = 0; this.blockedUntil = 0; this.current = user.username
    return this.status()
  }
}
