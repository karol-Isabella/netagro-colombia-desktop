import { describe, expect, it } from 'vitest'
import { contracts, preferencesSchema } from './contracts'

describe('IPC contracts', () => {
  it('rejects unexpected request payloads', () => {
    expect(contracts['app:get-info'].request.safeParse(undefined).success).toBe(true)
    for (const value of [null, {}, { channel: 'fs:read' }, 'app:get-info']) {
      expect(contracts['app:get-info'].request.safeParse(value).success).toBe(false)
    }
  })
  it('rejects malformed responses and extra fields', () => {
    const info = { name: 'NetAgro Colombia', version: '0.0.0', platform: 'win32' }
    expect(contracts['app:get-info'].response.safeParse(info).success).toBe(true)
    expect(contracts['app:get-info'].response.safeParse({ ...info, version: '' }).success).toBe(false)
    expect(contracts['app:get-info'].response.safeParse({ ...info, apiKey: 'forbidden' }).success).toBe(false)
  })
  it('allows only supported preferences', () => {
    expect(preferencesSchema.safeParse({ theme: 'dark', locale: 'en' }).success).toBe(true)
    expect(preferencesSchema.safeParse({ theme: 'night', locale: 'en' }).success).toBe(false)
    expect(preferencesSchema.safeParse({ theme: 'dark', locale: 'fr' }).success).toBe(false)
  })
})
