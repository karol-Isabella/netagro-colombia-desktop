import { afterEach, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { AuthService } from './auth'
const directories: string[] = []
afterEach(async () => { for (const dir of directories.splice(0)) await rm(dir,{ recursive:true,force:true }) })
async function directory() {
  const root = path.resolve('test-results/unit')
  await mkdir(root, { recursive: true })
  const dir = await mkdtemp(path.join(root,'netagro-auth-')); directories.push(dir); return dir
}
const credentials = { username: 'farmer', password: 'test-password-only' }
it('stores salted hashes and supports local login after restart', async () => {
  const dir = await directory(), auth = new AuthService(dir)
  expect((await auth.status()).hasAccounts).toBe(false)
  await auth.register(credentials)
  expect((await auth.status()).username).toBe('farmer')
  const stored = await readFile(path.join(dir,'accounts.json'),'utf8')
  expect(stored).not.toContain(credentials.password)
  expect(JSON.parse(stored).users[0].hash).toHaveLength(128)
  const restarted = new AuthService(dir)
  expect((await restarted.status()).username).toBeNull()
  expect(() => restarted.requireSession()).toThrow('AUTH_REQUIRED')
  await restarted.login(credentials)
  restarted.requireSession()
  restarted.logout()
  expect(() => restarted.requireSession()).toThrow('AUTH_REQUIRED')
})
it('serializes registration and rejects duplicate usernames', async () => {
  const auth = new AuthService(await directory())
  const results = await Promise.allSettled([auth.register(credentials),auth.register(credentials)])
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
})
it('throttles failed logins and allows retry after cooldown', async () => {
  let now = 0
  const auth = new AuthService(await directory(),() => now)
  await auth.register(credentials); auth.logout()
  for (let i=0;i<5;i++) await expect(auth.login({ ...credentials,password:'wrong-password' })).rejects.toThrow('AUTH_FAILED')
  await expect(auth.login(credentials)).rejects.toThrow('RATE_LIMIT')
  now = 30001
  await expect(auth.login(credentials)).resolves.toHaveProperty('username','farmer')
})
it('does not silently replace corrupted account storage', async () => {
  const dir = await directory()
  await writeFile(path.join(dir,'accounts.json'),'broken')
  await expect(new AuthService(dir).status()).rejects.toThrow('STORAGE_ERROR')
})
