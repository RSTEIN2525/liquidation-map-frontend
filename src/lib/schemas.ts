import { z } from 'zod';

// Bin status enum
export const BinStatus = z.enum(['ACTIVE', 'CLEARED', 'PARTIAL']);
export type BinStatus = z.infer<typeof BinStatus>;

// Direction bias enum
export const DirectionBias = z.enum(['UP', 'DOWN', 'UNBIASED']);
export type DirectionBias = z.infer<typeof DirectionBias>;

// Raw Liquidation Schema
export const RawLiquidationSchema = z.object({
  price: z.number(),
  usd: z.number(),
  side: z.string(), // 'long' or 'short'
  status: BinStatus,
  entry_time: z.number().optional(),
});
export type RawLiquidation = z.infer<typeof RawLiquidationSchema>;

// Bin schema
export const BinSchema = z.object({
  bucket: z.string(),
  mid_price: z.number(),
  intensity: z.number().min(0).max(100),
  usd: z.number(), // Value in billions
  status: BinStatus,
});
export type Bin = z.infer<typeof BinSchema>;

// Direction schema
export const DirectionSchema = z.object({
  bias: DirectionBias,
  upward_mag: z.number(),
  downward_mag: z.number(),
});
export type Direction = z.infer<typeof DirectionSchema>;

// Summary schema - flexible to handle variations
export const SummarySchema = z.object({
  price: z.number().optional(),
  current_price: z.number().optional(),
  currentPrice: z.number().optional(),
  close: z.number().optional(),
  total_oi_usd: z.number().optional(),
  funding_rate: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  open_interest: z.number().optional(),
}).passthrough();
export type Summary = z.infer<typeof SummarySchema>;

// Main liquidation map response schema
export const LiquidationMapSchema = z.object({
  summary: SummarySchema,
  direction: DirectionSchema,
  bins: z.array(BinSchema),
  raw_liquidations: z.array(RawLiquidationSchema).nullable().optional(),
  timestamp: z.number(),
}).transform((data) => ({
  ...data,
  raw_liquidations: data.raw_liquidations ?? undefined, // Convert null to undefined
}));
export type LiquidationMap = z.infer<typeof LiquidationMapSchema>;

// Helper to safely extract current price from summary
export function getCurrentPrice(summary: Summary): number | null {
  return summary.currentPrice ?? summary.current_price ?? summary.price ?? summary.close ?? null;
}

// View models for charts
export interface CrossSectionalDataPoint {
  price: number;
  usd: number;
  intensity: number;
  status: BinStatus;
  aboveCurrentPrice: boolean;
}

export interface HeatmapDataPoint {
  price: number;
  intensity: number;
  usd: number;
  status: BinStatus;
}

export function transformToCrossSectional(
  bins: Bin[],
  currentPrice: number | null
): CrossSectionalDataPoint[] {
  return bins
    .filter(bin => bin.status !== 'CLEARED') // Filter out cleared liquidations
    .map(bin => ({
      price: bin.mid_price,
      usd: bin.usd,
      intensity: bin.intensity,
      status: bin.status,
      aboveCurrentPrice: currentPrice !== null ? bin.mid_price > currentPrice : false,
    }));
}

export function transformToHeatmap(bins: Bin[]): HeatmapDataPoint[] {
  return bins.map(bin => ({
    price: bin.mid_price,
    intensity: bin.intensity,
    usd: bin.usd,
    status: bin.status,
  }));
}
