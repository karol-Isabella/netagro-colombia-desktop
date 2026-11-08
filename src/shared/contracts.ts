import { z } from 'zod'
import { datasetSchema, mapsSchema } from './dataSchema'
import { analysisSchema } from './analysis'

export const errorCodeSchema = z.enum(['AUTH_REQUIRED', 'AUTH_FAILED', 'USER_EXISTS', 'RATE_LIMIT', 'STORAGE_ERROR', 'DATA_UNAVAILABLE', 'INVALID_INPUT', 'EXPORT_FAILED', 'INTERNAL'])
export type ErrorCode = z.infer<typeof errorCodeSchema>
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ErrorCode }
export const resultSchema = <T extends z.ZodType>(schema: T) => z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), data: schema }).strict(),
  z.object({ ok: z.literal(false), error: errorCodeSchema }).strict(),
])

export const themeSchema = z.enum(['light', 'dark', 'system'])
export const localeSchema = z.enum(['es', 'en'])
export const preferencesSchema = z.object({
  theme: themeSchema,
  locale: localeSchema,
}).strict()

export type Theme = z.infer<typeof themeSchema>
export type Locale = z.infer<typeof localeSchema>
export type Preferences = z.infer<typeof preferencesSchema>

export const appInfoSchema = z.object({
  name: z.literal('NetAgro Colombia'),
  version: z.string().min(1),
  platform: z.enum(['win32', 'darwin', 'linux', 'aix', 'freebsd', 'openbsd', 'sunos', 'android', 'haiku', 'cygwin', 'netbsd']),
}).strict()

export const contracts = {
  'app:get-info': {
    request: z.undefined(),
    response: appInfoSchema,
  },
  'data:load': { request: z.undefined(), response: resultSchema(datasetSchema) },
  'data:maps': { request: z.undefined(), response: resultSchema(mapsSchema) },
  'analysis:run': { request: z.object({ territoryId: z.string().regex(/^(CO|\d{2}|\d{5})$/), layer: z.enum(['2G','3G','4G','5G','none']), locale: localeSchema, online: z.boolean() }).strict(), response: resultSchema(analysisSchema) },
} as const

export type AppInfo = z.infer<typeof appInfoSchema>

// Named capabilities only, never Electron or arbitrary channel selection.
export interface DesktopApi {
  getAppInfo: () => Promise<AppInfo>
  getCoverage: () => Promise<z.infer<typeof contracts['data:load']['response']>>
  getMaps: () => Promise<z.infer<typeof contracts['data:maps']['response']>>
  analyze: (input: z.infer<typeof contracts['analysis:run']['request']>) => Promise<z.infer<typeof contracts['analysis:run']['response']>>
}
