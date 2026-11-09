import { z } from 'zod'
import type { Center, Territory } from './coverage'
const fraction = z.number().min(0).max(1).nullable()
const coverage = z.object({ '2G': fraction, '3G': fraction, '4G': fraction, '5G': fraction }).strict()
const operatorCoverage = z.object({ CLARO: coverage, MOVISTAR: coverage, TIGO: coverage, WOM: coverage }).strict()
export const centerSchema: z.ZodType<Center> = z.object({
  id: z.string().regex(/^\d{8}$/), name: z.string().min(1), municipalityId: z.string().regex(/^\d{5}$/),
  departmentId: z.string().regex(/^\d{2}$/), area: z.number().positive(), coverage, operators: operatorCoverage,
  none: z.boolean(), explicitNone: z.boolean(), coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).nullable(),
}).strict()
export const territorySchema: z.ZodType<Territory> = z.object({
  id: z.string(), name: z.string(), level: z.enum(['country', 'department', 'municipality']), parentId: z.string().nullable(),
  area: z.number().nonnegative(), centerCount: z.number().int().nonnegative(), uncoveredCenters: z.number().int().nonnegative(),
  locatedCenters: z.number().int().nonnegative(), coverage, operators: operatorCoverage, none: fraction,
}).strict()
export const metadataSchema = z.object({
  schemaVersion: z.literal(1), generatedAt: z.string(), period: z.string().regex(/^\d{4}Q[1-4]$/),
  periods: z.array(z.string()), csvRows: z.number().int(), selectedRows: z.number().int(), duplicateRows: z.number().int(),
  centerCount: z.number().int(), locatedCenters: z.number().int(), explicitNoneCount: z.number().int(),
  sourceHashes: z.record(z.string(), z.string()), pointMethod: z.literal('DANE block area-weighted coordinates'),
  warnings: z.array(z.string()), methodology: z.string(),
}).strict()
export const datasetSchema = z.object({
  metadata: metadataSchema, territories: z.array(territorySchema), centers: z.array(centerSchema),
}).strict()
export type Dataset = z.infer<typeof datasetSchema>
const position = z.array(z.number().finite()).min(2).max(3)
const polygon = z.array(z.array(position).min(4)).min(1)
export const geometrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: polygon }),
  z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(polygon) }),
  z.object({ type: z.literal('Point'), coordinates: position }),
  z.object({ type: z.literal('LineString'), coordinates: z.array(position).min(2) }),
  z.object({ type: z.literal('MultiLineString'), coordinates: z.array(z.array(position).min(2)).min(1) }),
])
export const collectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.object({
    type: z.literal('Feature'), id: z.string(), geometry: geometrySchema,
    properties: z.object({ id: z.string(), name: z.string(), parentId: z.string().nullable() }),
  })),
})
export type MapCollection = z.infer<typeof collectionSchema>
const reliefFeature = z.object({
  type: z.literal('Feature'), id: z.string(),
  geometry: z.discriminatedUnion('type', [
    z.object({ type: z.literal('LineString'), coordinates: z.array(position).min(2) }),
    z.object({ type: z.literal('MultiLineString'), coordinates: z.array(z.array(position).min(2)).min(1) }),
  ]),
  properties: z.object({ id: z.string(), elevation: z.number().finite(), major: z.boolean() }).strict(),
})
export const reliefSchema = z.object({ type: z.literal('FeatureCollection'), features: z.array(reliefFeature) })
export type ReliefCollection = z.infer<typeof reliefSchema>
export const mapsSchema = z.object({ departments: collectionSchema, municipalities: collectionSchema, centers: collectionSchema })
export type MapData = z.infer<typeof mapsSchema>
