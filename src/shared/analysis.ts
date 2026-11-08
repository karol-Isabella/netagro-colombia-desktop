import { z } from 'zod'
export const analysisTextSchema = z.object({
  summary: z.string().min(1).max(1800),
  findings: z.array(z.string().min(1).max(700)).min(1).max(6),
  recommendations: z.array(z.string().min(1).max(700)).min(1).max(6),
}).strict()
export const analysisSchema = analysisTextSchema.extend({
  provider: z.enum(['rules', 'gemini']), model: z.string().nullable(), territoryId: z.string(), period: z.string(),
  fallbackReason: z.enum(['offline', 'not-configured', 'rate-limit', 'network', 'provider-error', 'invalid-response']).nullable(),
}).strict()
export type Analysis = z.infer<typeof analysisSchema>
