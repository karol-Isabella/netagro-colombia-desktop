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
export const credentialsSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{1,50}$/),
  password: z.string().min(6).max(20),
}).strict()
const sessionSchema = z.object({ username: z.string().nullable(), hasAccounts: z.boolean() }).strict()

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
  'auth:status': { request: z.undefined(), response: resultSchema(sessionSchema) },
  'auth:register': { request: credentialsSchema, response: resultSchema(sessionSchema) },
  'auth:login': { request: credentialsSchema, response: resultSchema(sessionSchema) },
  'auth:logout': { request: z.undefined(), response: resultSchema(z.null()) },
  'export:csv': { request: z.object({ territoryId: z.string().regex(/^(CO|\d{2}|\d{5})$/), layer: z.enum(['2G','3G','4G','5G','none']), kind: z.enum(['rankings','centers']) }).strict(), response: resultSchema(z.object({ saved: z.boolean() }).strict()) },
  'analysis:run': { request: z.object({ territoryId: z.string().regex(/^(CO|\d{2}|\d{5})$/), layer: z.enum(['2G','3G','4G','5G','none']), locale: localeSchema, online: z.boolean() }).strict(), response: resultSchema(analysisSchema) },
} as const

export type AppInfo = z.infer<typeof appInfoSchema>

// Named capabilities only, never Electron or arbitrary channel selection.
export interface DesktopApi {
  getAppInfo: () => Promise<AppInfo>
  getCoverage: () => Promise<z.infer<typeof contracts['data:load']['response']>>
  getMaps: () => Promise<z.infer<typeof contracts['data:maps']['response']>>
  authStatus: () => Promise<z.infer<typeof contracts['auth:status']['response']>>
  register: (input: z.infer<typeof credentialsSchema>) => Promise<z.infer<typeof contracts['auth:register']['response']>>
  login: (input: z.infer<typeof credentialsSchema>) => Promise<z.infer<typeof contracts['auth:login']['response']>>
  logout: () => Promise<z.infer<typeof contracts['auth:logout']['response']>>
  exportCsv: (input: z.infer<typeof contracts['export:csv']['request']>) => Promise<z.infer<typeof contracts['export:csv']['response']>>
  analyze: (input: z.infer<typeof contracts['analysis:run']['request']>) => Promise<z.infer<typeof contracts['analysis:run']['response']>>
}
