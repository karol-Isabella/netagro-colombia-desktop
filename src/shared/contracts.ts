import { z } from 'zod'

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
} as const

export type AppInfo = z.infer<typeof appInfoSchema>

// Named capabilities only, never Electron or arbitrary channel selection.
export interface DesktopApi {
  getAppInfo: () => Promise<AppInfo>
}
